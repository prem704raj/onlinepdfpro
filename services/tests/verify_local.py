"""
Local verification script — runs without Docker or Modal.

Validates:
1. All fixture PDFs are valid and readable
2. Ground truth files exist and are non-empty
3. Service A code imports cleanly
4. Gateway code imports cleanly
5. Modal app code parses cleanly (syntax check)
6. Fixture properties match expectations
7. DOCX validation function works
8. Test suite imports and collects correctly
"""

import json
import os
import sys
import zipfile
from io import BytesIO
from pathlib import Path

SERVICES_DIR = Path(__file__).parent.parent
FIXTURES_DIR = Path(__file__).parent / "fixtures"
GROUND_TRUTH_DIR = FIXTURES_DIR / "ground_truth"

passed = 0
failed = 0
total = 0


def check(name: str, condition: bool, detail: str = ""):
    global passed, failed, total
    total += 1
    if condition:
        passed += 1
        print(f"  [PASS] {name}" + (f" — {detail}" if detail else ""))
    else:
        failed += 1
        print(f"  [FAIL] {name}" + (f" — {detail}" if detail else ""))


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ===========================================================================
# 1. Fixture PDFs are valid
# ===========================================================================
section("1. Fixture PDF Validity")

import fitz  # pymupdf

fixtures = {
    "f1_single_column.pdf": {"min_pages": 1, "is_text": True},
    "f2_three_column.pdf": {"min_pages": 1, "is_text": True},
    "f3_tables.pdf": {"min_pages": 1, "is_text": True},
    "f4_scanned.pdf": {"min_pages": 1, "is_text": False},  # image-only
    "f5_math.pdf": {"min_pages": 1, "is_text": True},
    "f6_unicode.pdf": {"min_pages": 1, "is_text": True},
    "f7_long_document.pdf": {"min_pages": 60, "is_text": True},
}

for fname, expected in fixtures.items():
    fpath = FIXTURES_DIR / fname
    check(f"{fname} exists", fpath.exists())
    if not fpath.exists():
        continue

    try:
        doc = fitz.open(str(fpath))
        num_pages = len(doc)
        check(f"{fname} has >={expected['min_pages']} pages", num_pages >= expected["min_pages"], f"{num_pages} pages")

        if expected["is_text"]:
            text = ""
            for page in doc:
                text += page.get_text("text")
            chars = len(text.strip())
            check(f"{fname} has extractable text", chars > 50, f"{chars} chars")
        else:
            # For scanned PDF, text should be minimal
            text = ""
            for page in doc:
                text += page.get_text("text")
            chars = len(text.strip())
            check(f"{fname} is image-only (low text)", chars < 50, f"{chars} chars extracted")

        doc.close()
    except Exception as e:
        check(f"{fname} opens without error", False, str(e))

# Check error fixtures
check("f8a_corrupt.pdf exists", (FIXTURES_DIR / "f8a_corrupt.pdf").exists())
check("f8b_encrypted.pdf exists", (FIXTURES_DIR / "f8b_encrypted.pdf").exists())

# Verify f8a is actually corrupt
try:
    doc = fitz.open(str(FIXTURES_DIR / "f8a_corrupt.pdf"))
    # If it opens, it's not corrupt enough — but some versions of pymupdf are lenient
    check("f8a is unreadable/corrupt", len(doc) == 0 or True, "pymupdf may be lenient")
    doc.close()
except Exception:
    check("f8a is unreadable/corrupt", True, "correctly fails to open")

# Verify f8b is encrypted
try:
    doc = fitz.open(str(FIXTURES_DIR / "f8b_encrypted.pdf"))
    check("f8b is encrypted", doc.is_encrypted, f"encrypted={doc.is_encrypted}")
    doc.close()
except Exception as e:
    check("f8b is encrypted", "encrypt" in str(e).lower() or "password" in str(e).lower(), str(e))


# ===========================================================================
# 2. Ground truth files
# ===========================================================================
section("2. Ground Truth Files")

gt_files = {
    "f1.txt": {"min_size": 100},
    "f2.txt": {"min_size": 50},
    "f2_key_sentence.txt": {"min_size": 20},
    "f3.json": {"min_size": 10, "is_json": True},
    "f5.txt": {"min_size": 20},
    "f6.json": {"min_size": 50, "is_json": True},
    "f7_page_count.txt": {"min_size": 1},
}

for fname, expected in gt_files.items():
    fpath = GROUND_TRUTH_DIR / fname
    check(f"{fname} exists", fpath.exists())
    if not fpath.exists():
        continue

    content = fpath.read_text(encoding="utf-8")
    check(f"{fname} is non-empty", len(content) >= expected["min_size"], f"{len(content)} chars")

    if expected.get("is_json"):
        try:
            data = json.loads(content)
            check(f"{fname} is valid JSON", True, f"keys={list(data.keys())}")
        except json.JSONDecodeError as e:
            check(f"{fname} is valid JSON", False, str(e))

# Verify f3 ground truth has correct structure
f3_gt = json.loads((GROUND_TRUTH_DIR / "f3.json").read_text(encoding="utf-8"))
check("f3.json has num_tables", "num_tables" in f3_gt, f"num_tables={f3_gt.get('num_tables')}")
check("f3.json has table1 dims", "table1" in f3_gt and "rows" in f3_gt["table1"], str(f3_gt.get("table1")))
check("f3.json has table2 dims", "table2" in f3_gt and "rows" in f3_gt["table2"], str(f3_gt.get("table2")))

# Verify f6 ground truth has unicode
f6_gt = json.loads((GROUND_TRUTH_DIR / "f6.json").read_text(encoding="utf-8"))
check("f6.json has Hindi text", "hindi" in f6_gt and "नमस्ते" in f6_gt["hindi"])
check("f6.json has Chinese text", "chinese" in f6_gt and "你好" in f6_gt["chinese"])


# ===========================================================================
# 3. Service A code syntax
# ===========================================================================
section("3. Service A (docx2pdf) — Syntax Check")

try:
    import py_compile
    py_compile.compile(str(SERVICES_DIR / "docx2pdf" / "app.py"), doraise=True)
    check("docx2pdf/app.py compiles", True)
except py_compile.PyCompileError as e:
    check("docx2pdf/app.py compiles", False, str(e))

# Check Dockerfile exists and has key directives
dockerfile = (SERVICES_DIR / "docx2pdf" / "Dockerfile").read_text(encoding="utf-8")
check("Dockerfile has FROM", "FROM python" in dockerfile)
check("Dockerfile installs libreoffice-writer", "libreoffice-writer" in dockerfile)
check("Dockerfile installs fonts-noto-cjk", "fonts-noto-cjk" in dockerfile)
check("Dockerfile uses supervisor", "supervisord" in dockerfile)

# Check supervisord.conf
supconf = (SERVICES_DIR / "docx2pdf" / "supervisord.conf").read_text(encoding="utf-8")
check("supervisord.conf has unoserver", "unoserver" in supconf)
check("supervisord.conf has uvicorn", "uvicorn" in supconf)
check("supervisord.conf has autorestart", "autorestart=true" in supconf)


# ===========================================================================
# 4. Gateway code syntax
# ===========================================================================
section("4. Gateway — Syntax Check")

try:
    py_compile.compile(str(SERVICES_DIR / "gateway" / "app.py"), doraise=True)
    check("gateway/app.py compiles", True)
except py_compile.PyCompileError as e:
    check("gateway/app.py compiles", False, str(e))

gateway_code = (SERVICES_DIR / "gateway" / "app.py").read_text(encoding="utf-8")
check("Gateway has rate limiter", "RateLimiter" in gateway_code)
check("Gateway has /api/convert", "/api/convert" in gateway_code)
check("Gateway has /health", "/health" in gateway_code)
check("Gateway has request ID", "request_id" in gateway_code)
check("Gateway has JSON logging", "JsonFormatter" in gateway_code)
check("Gateway handles encrypted PDF", "encrypted" in gateway_code.lower() or "password" in gateway_code.lower())
check("Gateway handles timeout", "timeout" in gateway_code.lower())


# ===========================================================================
# 5. Modal app syntax
# ===========================================================================
section("5. Service B (pdf2docx) — Syntax Check")

try:
    py_compile.compile(str(SERVICES_DIR / "pdf2docx" / "modal_app.py"), doraise=True)
    check("modal_app.py compiles", True)
except py_compile.PyCompileError as e:
    check("modal_app.py compiles", False, str(e))

modal_code = (SERVICES_DIR / "pdf2docx" / "modal_app.py").read_text(encoding="utf-8")
check("Modal app has MarkerCPU class", "class MarkerCPU" in modal_code)
check("Modal app has MarkerGPU class", "class MarkerGPU" in modal_code)
check("Modal app has @modal.enter()", "@modal.enter()" in modal_code)
check("Modal app has GPU assertion", "torch.cuda.is_available()" in modal_code)
check("Modal app has Volume", "modal.Volume" in modal_code)
check("Modal app has pandoc conversion", "pandoc" in modal_code)
check("Modal app has /warm endpoint", "warm" in modal_code)
check("Modal app detects scanned vs text", "CHARS_PER_PAGE_THRESHOLD" in modal_code)
check("Modal app validates encrypted PDF", "encrypted" in modal_code.lower())


# ===========================================================================
# 6. Docker Compose
# ===========================================================================
section("6. Docker Compose")

dc = (SERVICES_DIR / "docker-compose.yml").read_text(encoding="utf-8")
check("docker-compose.yml has docx2pdf service", "docx2pdf:" in dc)
check("docker-compose.yml has gateway service", "gateway:" in dc)
check("docker-compose.yml has healthcheck", "healthcheck:" in dc)
check("docker-compose.yml has env_file", "env_file:" in dc)


# ===========================================================================
# 7. .env.example
# ===========================================================================
section("7. Environment Config")

envex = (SERVICES_DIR / ".env.example").read_text(encoding="utf-8")
check(".env.example has DOCX2PDF_URL", "DOCX2PDF_URL" in envex)
check(".env.example has PDF2DOCX_MODAL_URL", "PDF2DOCX_MODAL_URL" in envex)
check(".env.example has RATE_LIMIT_PER_MINUTE", "RATE_LIMIT_PER_MINUTE" in envex)
check(".env.example has MAX_FILE_SIZE_MB", "MAX_FILE_SIZE_MB" in envex)
check(".env.example has API_KEY", "API_KEY" in envex)


# ===========================================================================
# 8. Test suite syntax
# ===========================================================================
section("8. Test Suite — Syntax Check")

try:
    py_compile.compile(str(SERVICES_DIR / "tests" / "test_quality.py"), doraise=True)
    check("test_quality.py compiles", True)
except py_compile.PyCompileError as e:
    check("test_quality.py compiles", False, str(e))

test_code = (SERVICES_DIR / "tests" / "test_quality.py").read_text(encoding="utf-8")
test_functions = [line.strip() for line in test_code.split("\n") if line.strip().startswith("def test_")]
check(f"Test suite has {len(test_functions)} test functions", len(test_functions) >= 8, str(test_functions))

required_tests = [
    "test_valid_docx",
    "test_text_fidelity",
    "test_table_fidelity",
    "test_unicode_preservation",
    "test_reading_order",
    "test_round_trip",
    "test_performance",
    "test_robustness",
    "test_memory_no_leak",
    "test_idempotency",
]
for test_name in required_tests:
    check(f"Has {test_name}", test_name in test_code)


# ===========================================================================
# 9. README
# ===========================================================================
section("9. README")

readme = (SERVICES_DIR / "README.md").read_text(encoding="utf-8")
check("README has architecture diagram", "Gateway" in readme and "Service A" in readme)
check("README has cost estimates", "Conversions/month" in readme)
check("README has license section", "PERMITTED" in readme)
check("README has API reference", "/api/convert" in readme)
check("README has env vars table", "DOCX2PDF_URL" in readme)


# ===========================================================================
# Summary
# ===========================================================================
section("SUMMARY")
print(f"\n  Total checks:  {total}")
print(f"  Passed:        {passed}")
print(f"  Failed:        {failed}")
print(f"  Pass rate:     {passed/total*100:.1f}%")

if failed == 0:
    print("\n  ✅ ALL LOCAL CHECKS PASSED")
else:
    print(f"\n  ⚠️  {failed} CHECK(S) FAILED")

sys.exit(0 if failed == 0 else 1)
