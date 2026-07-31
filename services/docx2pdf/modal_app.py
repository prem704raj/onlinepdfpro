"""
Service A — DOCX → PDF conversion via LibreOffice on Modal.

Optimized for fast cold starts and low cost.
Uses LibreOffice headless with essential fonts only.
"""

import json
import logging
import os
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

import modal
from fastapi import Request

# ---------------------------------------------------------------------------
# Modal infrastructure — optimized for fast startup
# ---------------------------------------------------------------------------
app = modal.App("docx2pdf-converter")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "libreoffice-writer",       # Only writer component (not full libreoffice)
        "fonts-liberation",
        "fonts-dejavu-core",
        "fonts-noto-core",
        "fontconfig",
    )
    .pip_install("fastapi")
    .run_commands("fc-cache -fv")
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("docx2pdf")

CONVERT_TIMEOUT = 60


# ---------------------------------------------------------------------------
# Conversion
# ---------------------------------------------------------------------------
def _convert_to_pdf(input_path: str, output_dir: str) -> str:
    """Convert document to PDF using LibreOffice headless."""
    user_dir = f"/tmp/lo_{uuid.uuid4().hex[:8]}"

    cmd = [
        "soffice",
        "--headless",
        "--norestore",
        "--nofirststartwizard",
        f"-env:UserInstallation=file://{user_dir}",
        "--convert-to", "pdf",
        "--outdir", output_dir,
        input_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=CONVERT_TIMEOUT)

    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice failed: {result.stderr[:200]}")

    stem = Path(input_path).stem
    pdf_path = os.path.join(output_dir, f"{stem}.pdf")

    if not os.path.exists(pdf_path):
        pdfs = list(Path(output_dir).glob("*.pdf"))
        if pdfs:
            pdf_path = str(pdfs[0])
        else:
            raise RuntimeError("LibreOffice produced no PDF output")

    if os.path.getsize(pdf_path) == 0:
        raise RuntimeError("LibreOffice produced an empty PDF")

    return pdf_path


# ---------------------------------------------------------------------------
# Web endpoint
# ---------------------------------------------------------------------------
@app.function(
    image=image,
    cpu=1,
    memory=2048,
    timeout=120,
    scaledown_window=60,
)
@modal.fastapi_endpoint(method="POST", label="docx2pdf-convert")
async def convert_endpoint(request: Request):
    """POST: raw DOCX bytes → PDF bytes"""
    import shutil
    from starlette.responses import Response as StarletteResponse

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }

    body = await request.body()

    if len(body) == 0:
        return StarletteResponse(
            content=json.dumps({"error": "Empty request body"}),
            status_code=400, media_type="application/json", headers=cors_headers,
        )

    if len(body) > 50 * 1024 * 1024:
        return StarletteResponse(
            content=json.dumps({"error": "File too large. Maximum: 50 MB"}),
            status_code=413, media_type="application/json", headers=cors_headers,
        )

    content_type = request.headers.get("content-type", "")
    ext = ".docx"
    if "msword" in content_type: ext = ".doc"
    elif "opendocument" in content_type: ext = ".odt"
    elif "rtf" in content_type: ext = ".rtf"

    request_id = uuid.uuid4().hex[:12]
    work_dir = tempfile.mkdtemp(prefix="d2p_")

    try:
        input_path = os.path.join(work_dir, f"input{ext}")
        with open(input_path, "wb") as f:
            f.write(body)

        output_dir = os.path.join(work_dir, "out")
        os.makedirs(output_dir, exist_ok=True)

        t0 = time.monotonic()
        pdf_path = _convert_to_pdf(input_path, output_dir)
        elapsed = time.monotonic() - t0

        logger.info("[%s] Converted in %.2fs", request_id, elapsed)
        pdf_bytes = Path(pdf_path).read_bytes()

        return StarletteResponse(
            content=pdf_bytes, status_code=200, media_type="application/pdf",
            headers={
                **cors_headers,
                "Content-Disposition": 'attachment; filename="converted.pdf"',
                "X-Request-ID": request_id,
                "X-Convert-Time": f"{elapsed:.2f}",
            },
        )
    except subprocess.TimeoutExpired:
        return StarletteResponse(
            content=json.dumps({"error": "Conversion timed out"}),
            status_code=504, media_type="application/json", headers=cors_headers,
        )
    except Exception as exc:
        logger.exception("[%s] Failed", request_id)
        return StarletteResponse(
            content=json.dumps({"error": f"Conversion failed: {str(exc)}"}),
            status_code=500, media_type="application/json", headers=cors_headers,
        )
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.function(image=image, cpu=0.25, memory=128)
@modal.fastapi_endpoint(method="GET", label="docx2pdf-health")
async def health():
    return {"status": "healthy", "timestamp": time.time()}

