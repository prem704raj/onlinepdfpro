"""
Service B — PDF → DOCX conversion on Modal.

Uses pdf2docx with pre-processing to clean up artifacts.
Optimized for fast cold starts with minimal dependencies.
"""

import io
import json
import logging
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path

import modal
from fastapi import Request

# ---------------------------------------------------------------------------
# Modal infrastructure — minimal image for fastest cold start
# ---------------------------------------------------------------------------
app = modal.App("pdf2docx-converter")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi",
        "pdf2docx==0.5.8",
        "pymupdf>=1.24.0",
        "python-docx",
    )
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pdf2docx")


# ---------------------------------------------------------------------------
# Validation & preprocessing
# ---------------------------------------------------------------------------
def _validate_pdf(pdf_bytes: bytes) -> None:
    if len(pdf_bytes) < 5 or not pdf_bytes[:5].startswith(b"%PDF-"):
        raise ValueError("Not a valid PDF file (missing %PDF- header)")
    import fitz
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.is_encrypted:
            doc.close()
            raise ValueError("PDF is password-protected — please remove the password first")
        doc.close()
    except Exception as exc:
        if "encrypted" in str(exc).lower() or "password" in str(exc).lower():
            raise ValueError("PDF is password-protected — please remove the password first")
        raise ValueError(f"Corrupt or unreadable PDF: {exc}")


def _clean_pdf(pdf_bytes: bytes) -> bytes:
    """
    Pre-process the PDF to remove elements that cause artifacts in conversion:
    - Remove annotations (stamps, comments, form fields → square artifacts)
    - Remove headers/footers that bleed into body text
    """
    import fitz

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page in doc:
        # Remove all annotations (these cause the square artifacts)
        annots = list(page.annots()) if page.annots() else []
        for annot in annots:
            page.delete_annot(annot)

        # Remove widgets/form fields (also cause artifacts)
        widgets = list(page.widgets()) if page.widgets() else []
        for widget in widgets:
            page.delete_widget(widget)

    # Save cleaned PDF
    cleaned = doc.tobytes(deflate=True, garbage=4)
    doc.close()
    return cleaned


def _convert_pdf_to_docx(pdf_bytes: bytes) -> bytes:
    """Convert PDF to DOCX using pdf2docx with preprocessing."""
    from pdf2docx import Converter

    # Clean PDF first to remove artifacts
    cleaned_pdf = _clean_pdf(pdf_bytes)

    work_dir = tempfile.mkdtemp(prefix="pdf2docx_")
    try:
        pdf_path = os.path.join(work_dir, "input.pdf")
        docx_path = os.path.join(work_dir, "output.docx")

        with open(pdf_path, "wb") as f:
            f.write(cleaned_pdf)

        # Convert with optimized settings
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()

        if not os.path.exists(docx_path) or os.path.getsize(docx_path) == 0:
            raise RuntimeError("Conversion produced empty output")

        return Path(docx_path).read_bytes()
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# Web endpoint — keep warm for 180s to avoid cold starts
# ---------------------------------------------------------------------------
@app.function(
    image=image,
    cpu=2,
    memory=2048,
    timeout=120,
    scaledown_window=180,   # Keep warm for 3 min after last request (reduces cold starts)
)
@modal.fastapi_endpoint(method="POST", label="pdf2docx-convert")
async def convert_endpoint(request: Request):
    from starlette.responses import Response as StarletteResponse

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }

    body = await request.body()

    if len(body) == 0:
        return StarletteResponse(
            content=json.dumps({"error": "Empty request body. Please upload a PDF file."}),
            status_code=400, media_type="application/json", headers=cors_headers,
        )

    if len(body) > 50 * 1024 * 1024:
        return StarletteResponse(
            content=json.dumps({"error": "File too large. Maximum size is 50 MB."}),
            status_code=413, media_type="application/json", headers=cors_headers,
        )

    try:
        _validate_pdf(body)
    except ValueError as exc:
        return StarletteResponse(
            content=json.dumps({"error": str(exc)}),
            status_code=422, media_type="application/json", headers=cors_headers,
        )

    request_id = uuid.uuid4().hex[:12]
    logger.info("[%s] Converting PDF (%d bytes)", request_id, len(body))

    t0 = time.monotonic()
    try:
        docx_bytes = _convert_pdf_to_docx(body)
    except Exception as exc:
        logger.exception("[%s] Conversion failed", request_id)
        return StarletteResponse(
            content=json.dumps({"error": f"Conversion failed: {str(exc)}"}),
            status_code=500, media_type="application/json", headers=cors_headers,
        )

    elapsed = time.monotonic() - t0
    logger.info("[%s] Converted in %.2fs, output=%d bytes", request_id, elapsed, len(docx_bytes))

    return StarletteResponse(
        content=docx_bytes,
        status_code=200,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            **cors_headers,
            "Content-Disposition": 'attachment; filename="converted.docx"',
            "X-Request-ID": request_id,
            "X-Convert-Time": f"{elapsed:.2f}",
        },
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.function(image=image, cpu=0.25, memory=128)
@modal.fastapi_endpoint(method="GET", label="pdf2docx-warm")
async def warm():
    return {"status": "warm", "timestamp": time.time()}
