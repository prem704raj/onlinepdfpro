"""
Generate all 8 test fixtures for the PDF↔Word verification suite.

F1: Born-digital single-column text PDF
F2: 3-column academic-style layout
F3: PDF with 2+ tables (with merged cells)
F4: Scanned/image-only PDF (F1 rasterized at 200dpi)
F5: PDF with math/equations
F6: Non-Latin text (Hindi + CJK)
F7: 60+ page throughput test
F8a: Corrupt PDF
F8b: Password-protected PDF

Usage:
    pip install reportlab pillow pypdf
    python generate_fixtures.py
"""

import os
import sys
from io import BytesIO
from pathlib import Path

# Ensure output directory exists
FIXTURES_DIR = Path(__file__).parent / "fixtures"
FIXTURES_DIR.mkdir(exist_ok=True)

# Ground truth text will be saved alongside each fixture
GROUND_TRUTH_DIR = FIXTURES_DIR / "ground_truth"
GROUND_TRUTH_DIR.mkdir(exist_ok=True)


def generate_f1():
    """F1: Born-digital single-column text PDF (~2 pages)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

    path = FIXTURES_DIR / "f1_single_column.pdf"

    text = (
        "The quick brown fox jumps over the lazy dog. "
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris "
        "nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in "
        "reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla "
        "pariatur. Excepteur sint occaecat cupidatat non proident, sunt in "
        "culpa qui officia deserunt mollit anim id est laborum. "
    )
    # Repeat to fill ~2 pages
    full_text = text * 12

    doc = SimpleDocTemplate(str(path), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Single Column Document — Test Fixture F1", styles["Title"]))
    story.append(Spacer(1, 20))

    for para in full_text.split(". "):
        if para.strip():
            story.append(Paragraph(para.strip() + ".", styles["Normal"]))
            story.append(Spacer(1, 8))

    doc.build(story)

    # Save ground truth
    (GROUND_TRUTH_DIR / "f1.txt").write_text(full_text, encoding="utf-8")
    print(f"  ✓ F1: {path}")


def generate_f2():
    """F2: 3-column academic paper layout."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    path = FIXTURES_DIR / "f2_three_column.pdf"

    col_width = (A4[0] - 4 * cm) / 3
    col_height = A4[1] - 4 * cm

    frames = [
        Frame(2 * cm + i * (col_width + 0.5 * cm), 2 * cm, col_width, col_height, id=f"col{i}")
        for i in range(3)
    ]

    doc = BaseDocTemplate(str(path), pagesize=A4)
    doc.addPageTemplates([PageTemplate(id="ThreeCol", frames=frames)])

    styles = getSampleStyleSheet()
    story = []

    # Key sentence we'll check for contiguous reading order
    key_sentence = "This specific sentence must appear contiguously in the output to prove correct reading order."

    col1_text = (
        "Introduction. This is the first column of a three-column academic layout. "
        "The purpose of this fixture is to test whether the PDF-to-DOCX converter "
        "can correctly handle multi-column layouts without interleaving text from "
        "different columns. " + key_sentence + " "
        "Column one continues with additional text to fill the space appropriately."
    )

    col2_text = (
        "Methods. The second column contains methodology details. "
        "We performed experiments using standardized test procedures. "
        "Results were collected over a period of twelve months. "
        "Statistical analysis was performed using standard deviation "
        "and mean calculations across all data points collected."
    )

    col3_text = (
        "Results. The third column presents our findings. "
        "Data shows a significant improvement of 42 percent across "
        "all measured parameters. The control group showed no change. "
        "These results are consistent with previous research "
        "in the field of document analysis and conversion."
    )

    for text in [col1_text, col2_text, col3_text]:
        for sentence in text.split(". "):
            if sentence.strip():
                story.append(Paragraph(sentence.strip() + ".", styles["Normal"]))
                story.append(Spacer(1, 6))

    doc.build(story)

    full_text = col1_text + " " + col2_text + " " + col3_text
    (GROUND_TRUTH_DIR / "f2.txt").write_text(full_text, encoding="utf-8")
    (GROUND_TRUTH_DIR / "f2_key_sentence.txt").write_text(key_sentence, encoding="utf-8")
    print(f"  ✓ F2: {path}")


def generate_f3():
    """F3: PDF with 2+ tables with merged cells."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib import colors

    path = FIXTURES_DIR / "f3_tables.pdf"

    doc = SimpleDocTemplate(str(path), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Table Test — Fixture F3", styles["Title"]))
    story.append(Spacer(1, 20))

    # Table 1: Simple 4×3 table
    story.append(Paragraph("Table 1: Quarterly Revenue", styles["Heading2"]))
    story.append(Spacer(1, 10))

    table1_data = [
        ["Quarter", "Revenue ($M)", "Growth (%)"],
        ["Q1 2024", "12.5", "8.2"],
        ["Q2 2024", "14.1", "12.8"],
        ["Q3 2024", "13.7", "-2.8"],
        ["Q4 2024", "16.2", "18.2"],
    ]

    t1 = Table(table1_data, colWidths=[150, 120, 100])
    t1.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
    ]))
    story.append(t1)
    story.append(Spacer(1, 30))

    # Table 2: 5×4 with merged cells (spans)
    story.append(Paragraph("Table 2: Employee Summary (with merged cells)", styles["Heading2"]))
    story.append(Spacer(1, 10))

    table2_data = [
        ["Department", "Role", "Name", "Status"],
        ["Engineering", "Lead", "Alice Chen", "Active"],
        ["Engineering", "Developer", "Bob Kumar", "Active"],
        ["Engineering", "Developer", "Carol Wu", "On Leave"],
        ["Marketing", "Lead", "Dave Patel", "Active"],
        ["Marketing", "Analyst", "Eve Jones", "Active"],
    ]

    t2 = Table(table2_data, colWidths=[110, 100, 120, 80])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.darkblue),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        # Merge "Engineering" cells vertically
        ("SPAN", (0, 1), (0, 3)),
        ("VALIGN", (0, 1), (0, 3), "MIDDLE"),
        # Merge "Marketing" cells vertically
        ("SPAN", (0, 4), (0, 5)),
        ("VALIGN", (0, 4), (0, 5), "MIDDLE"),
    ]))
    story.append(t2)

    doc.build(story)

    # Ground truth metadata
    gt = {
        "num_tables": 2,
        "table1": {"rows": 5, "cols": 3},
        "table2": {"rows": 6, "cols": 4},
    }
    import json
    (GROUND_TRUTH_DIR / "f3.json").write_text(json.dumps(gt, indent=2), encoding="utf-8")
    print(f"  ✓ F3: {path}")


def generate_f4():
    """F4: Scanned PDF — rasterize F1 at 200dpi and embed as image pages."""
    import fitz  # pymupdf
    from PIL import Image

    source = FIXTURES_DIR / "f1_single_column.pdf"
    if not source.exists():
        print("  ✗ F4: Cannot generate — F1 must be generated first")
        return

    path = FIXTURES_DIR / "f4_scanned.pdf"
    dpi = 200
    zoom = dpi / 72

    src_doc = fitz.open(str(source))
    images = []

    for page in src_doc:
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)

    src_doc.close()

    # Save as a PDF of images (no selectable text)
    if images:
        images[0].save(
            str(path),
            "PDF",
            resolution=dpi,
            save_all=True,
            append_images=images[1:],
        )

    # Ground truth is same as F1
    print(f"  ✓ F4: {path}")


def generate_f5():
    """F5: PDF with math/equations (rendered as text approximations)."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.enums import TA_CENTER

    path = FIXTURES_DIR / "f5_math.pdf"

    doc = SimpleDocTemplate(str(path), pagesize=A4)
    styles = getSampleStyleSheet()

    math_style = ParagraphStyle(
        "MathStyle",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=14,
        alignment=TA_CENTER,
        spaceAfter=20,
    )

    story = []
    story.append(Paragraph("Mathematical Equations — Fixture F5", styles["Title"]))
    story.append(Spacer(1, 20))

    equations = [
        ("Euler's Identity", "e^(i*pi) + 1 = 0"),
        ("Quadratic Formula", "x = (-b ± sqrt(b² - 4ac)) / (2a)"),
        ("Pythagorean Theorem", "a² + b² = c²"),
        ("Einstein's Mass-Energy", "E = mc²"),
        ("Integral", "∫₀^∞ e^(-x²) dx = √π / 2"),
        ("Summation", "∑(k=1 to n) k = n(n+1)/2"),
    ]

    for name, eq in equations:
        story.append(Paragraph(name, styles["Heading2"]))
        story.append(Spacer(1, 8))
        story.append(Paragraph(eq, math_style))
        story.append(Spacer(1, 20))

    doc.build(story)

    gt_text = "\n".join(f"{name}: {eq}" for name, eq in equations)
    (GROUND_TRUTH_DIR / "f5.txt").write_text(gt_text, encoding="utf-8")
    print(f"  ✓ F5: {path}")


def generate_f6():
    """F6: Non-Latin text — Hindi (Devanagari) + CJK characters."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    path = FIXTURES_DIR / "f6_unicode.pdf"

    uni_font = "Helvetica"
    font_paths = [
        "C:/Windows/Fonts/ARIALUNI.TTF",
        "C:/Windows/Fonts/ARIALUNI.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ]
    for fp in font_paths:
        if Path(fp).exists():
            try:
                pdfmetrics.registerFont(TTFont("UniFont", fp))
                uni_font = "UniFont"
                break
            except Exception:
                pass

    doc = SimpleDocTemplate(str(path), pagesize=A4)
    styles = getSampleStyleSheet()
    uni_style = ParagraphStyle(
        "UnicodeStyle",
        parent=styles["Normal"],
        fontName=uni_font,
        fontSize=12,
        leading=16,
    )
    story = []

    story.append(Paragraph("Unicode Text Test — Fixture F6", styles["Title"]))
    story.append(Spacer(1, 20))

    # Hindi text (Devanagari script)
    hindi_text = "नमस्ते दुनिया। यह एक परीक्षण दस्तावेज़ है। हिंदी में लिखा गया पाठ।"
    story.append(Paragraph("Hindi (Devanagari):", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(hindi_text, uni_style))
    story.append(Spacer(1, 20))

    # Chinese text (CJK)
    chinese_text = "你好世界。这是一个测试文档。中文文本用于验证Unicode处理。"
    story.append(Paragraph("Chinese (CJK):", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(chinese_text, uni_style))
    story.append(Spacer(1, 20))

    # Japanese text
    japanese_text = "こんにちは世界。これはテスト文書です。日本語テキスト。"
    story.append(Paragraph("Japanese:", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(japanese_text, uni_style))
    story.append(Spacer(1, 20))

    # Mixed
    mixed_text = f"Mixed: {hindi_text} | {chinese_text} | {japanese_text}"
    story.append(Paragraph("Mixed Scripts:", styles["Heading2"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(mixed_text, uni_style))

    doc.build(story)

    gt = {
        "hindi": hindi_text,
        "chinese": chinese_text,
        "japanese": japanese_text,
    }
    import json
    (GROUND_TRUTH_DIR / "f6.json").write_text(json.dumps(gt, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  ✓ F6: {path}")


def generate_f7():
    """F7: 60+ page throughput test document."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

    path = FIXTURES_DIR / "f7_long_document.pdf"

    doc = SimpleDocTemplate(str(path), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("Long Document — 60+ Page Throughput Test (F7)", styles["Title"]))
    story.append(Spacer(1, 20))

    paragraph_text = (
        "This is a paragraph of text designed to fill pages for throughput testing. "
        "The document converter must handle large files efficiently. Performance "
        "is measured in seconds per page. The total conversion time should not "
        "exceed 300 seconds on the GPU path. This paragraph is repeated many times "
        "to generate the required page count. "
    )

    # ~65+ pages worth of content (each page holds ~11 paragraphs at Normal size)
    for i in range(750):
        story.append(Paragraph(f"[Para {i+1}] {paragraph_text}", styles["Normal"]))
        story.append(Spacer(1, 10))

    doc.build(story)

    (GROUND_TRUTH_DIR / "f7_page_count.txt").write_text("65", encoding="utf-8")
    print(f"  ✓ F7: {path}")


def generate_f8():
    """F8a: Corrupt PDF, F8b: Password-protected PDF."""
    # F8a: Corrupt PDF (truncated)
    path_a = FIXTURES_DIR / "f8a_corrupt.pdf"
    path_a.write_bytes(b"%PDF-1.4 this is corrupt garbage data that is not a valid pdf")
    print(f"  ✓ F8a: {path_a}")

    # F8b: Password-protected PDF
    from pypdf import PdfWriter, PdfReader
    from io import BytesIO

    # Create a simple PDF first
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    doc.build([Paragraph("This is a password-protected document.", styles["Normal"])])
    buf.seek(0)

    # Encrypt it
    reader = PdfReader(buf)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt("secretpassword123")

    path_b = FIXTURES_DIR / "f8b_encrypted.pdf"
    with open(path_b, "wb") as f:
        writer.write(f)

    print(f"  ✓ F8b: {path_b}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Generating test fixtures…\n")

    try:
        import reportlab
    except ImportError:
        print("ERROR: reportlab is required. Install: pip install reportlab pillow pypdf pymupdf")
        sys.exit(1)

    generate_f1()
    generate_f2()
    generate_f3()
    generate_f4()
    generate_f5()
    generate_f6()
    generate_f7()
    generate_f8()

    print(f"\nDone! Fixtures saved to: {FIXTURES_DIR}")
    print(f"Ground truth saved to:  {GROUND_TRUTH_DIR}")
