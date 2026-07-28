"""
Service B — PDF → DOCX conversion via Marker (Datalab) on Modal.

Two execution paths chosen automatically:
  TEXT PATH  – born-digital PDF (>100 chars/page avg) → CPU, OCR disabled
  OCR PATH   – scanned PDF → GPU (T4), OCR enabled

Marker output → pandoc → .docx with embedded images.
"""

import io
import logging
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import modal
from fastapi import Request

# ---------------------------------------------------------------------------
# Modal infrastructure
# ---------------------------------------------------------------------------
app = modal.App("pdf2docx-converter")

model_volume = modal.Volume.from_name("marker-models-cache", create_if_missing=True)

# Base image shared by CPU and GPU classes
base_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("pandoc")
    .pip_install(
        "fastapi",
        "marker-pdf==1.9.3",
        "torch",
        "pymupdf",
        "python-docx",
    )
)

MODEL_CACHE_PATH = "/root/.cache/datalab"
CHARS_PER_PAGE_THRESHOLD = 100

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("pdf2docx")


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------
def _detect_is_scanned(pdf_bytes: bytes) -> bool:
    """
    Return True if the PDF is scanned/image-only.
    Uses PyMuPDF to extract text and checks average chars per page.
    """
    import fitz  # pymupdf

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_chars = 0
    num_pages = len(doc)

    if num_pages == 0:
        doc.close()
        return True

    for page in doc:
        total_chars += len(page.get_text("text"))
    doc.close()

    avg = total_chars / num_pages
    logger.info("PDF analysis: %d pages, %d total chars, %.1f avg chars/page", num_pages, total_chars, avg)
    return avg < CHARS_PER_PAGE_THRESHOLD


def _validate_pdf(pdf_bytes: bytes) -> None:
    """Basic validation: check PDF header and that it can be opened."""
    if len(pdf_bytes) < 5 or not pdf_bytes[:5].startswith(b"%PDF-"):
        raise ValueError("Not a valid PDF file (missing %PDF- header)")

    import fitz
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if doc.is_encrypted:
            doc.close()
            raise ValueError("PDF is password-protected/encrypted — cannot process")
        doc.close()
    except Exception as exc:
        if "encrypted" in str(exc).lower() or "password" in str(exc).lower():
            raise ValueError("PDF is password-protected/encrypted — cannot process")
        raise ValueError(f"Corrupt or unreadable PDF: {exc}")


def _run_marker(pdf_path: str, output_dir: str, output_format: str, use_ocr: bool, artifact_dict: dict) -> str:
    """
    Run Marker conversion and return the output text file path.
    """
    from marker.config.parser import ConfigParser
    from marker.converters.pdf import PdfConverter
    from marker.output import save_output

    config = {
        "output_format": output_format,
        "output_dir": output_dir,
    }

    if not use_ocr:
        config["force_ocr"] = False
        config["use_ocr"] = False

    config_parser = ConfigParser(config)
    converter = PdfConverter(
        config=config_parser.generate_config_dict(),
        artifact_dict=artifact_dict,
        processor_list=config_parser.get_processors(),
        renderer=config_parser.get_renderer(),
    )

    rendered = converter(pdf_path)

    # Save output (text + images)
    out_name = Path(pdf_path).stem
    save_output(rendered, output_dir, out_name)

    # Find the output file
    ext = "html" if output_format == "html" else "md"
    output_file = Path(output_dir) / out_name / f"{out_name}.{ext}"
    if not output_file.exists():
        # Try flat structure
        output_file = Path(output_dir) / f"{out_name}.{ext}"

    if not output_file.exists():
        # Search for any matching file
        candidates = list(Path(output_dir).rglob(f"*.{ext}"))
        if candidates:
            output_file = candidates[0]
        else:
            raise RuntimeError(f"Marker produced no .{ext} output in {output_dir}")

    return str(output_file)


def _pandoc_to_docx(input_file: str, output_path: str, input_format: str) -> None:
    """Convert Marker output to .docx using pandoc."""
    resource_path = str(Path(input_file).parent)

    cmd = [
        "pandoc",
        "-f", input_format,
        "-o", output_path,
        f"--resource-path={resource_path}",
        "--standalone",
        input_file,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"Pandoc failed: {result.stderr}")

    if not Path(output_path).exists() or Path(output_path).stat().st_size == 0:
        raise RuntimeError("Pandoc produced empty output")


def _convert_core(pdf_bytes: bytes, artifact_dict: dict, use_ocr: bool) -> bytes:
    """
    Core conversion logic shared by CPU and GPU classes.
    Returns .docx bytes.
    """
    work_dir = tempfile.mkdtemp(prefix="pdf2docx_")

    try:
        # Write input PDF
        pdf_path = os.path.join(work_dir, "input.pdf")
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)

        output_dir = os.path.join(work_dir, "marker_output")
        os.makedirs(output_dir, exist_ok=True)

        # Run Marker → HTML (proven better for tables; see test comparison)
        t0 = time.monotonic()
        output_file = _run_marker(
            pdf_path=pdf_path,
            output_dir=output_dir,
            output_format="html",
            use_ocr=use_ocr,
            artifact_dict=artifact_dict,
        )
        marker_time = time.monotonic() - t0
        logger.info("Marker conversion took %.2fs (ocr=%s)", marker_time, use_ocr)

        # Pandoc HTML → DOCX
        docx_path = os.path.join(work_dir, "output.docx")
        t0 = time.monotonic()
        _pandoc_to_docx(output_file, docx_path, "html")
        pandoc_time = time.monotonic() - t0
        logger.info("Pandoc conversion took %.2fs", pandoc_time)

        return Path(docx_path).read_bytes()

    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


# ---------------------------------------------------------------------------
# CPU class — born-digital PDFs (no OCR needed)
# ---------------------------------------------------------------------------
@app.cls(
    image=base_image,
    cpu=4,
    memory=8192,
    volumes={MODEL_CACHE_PATH: model_volume},
    scaledown_window=300,
    timeout=600,
)
class MarkerCPU:
    @modal.enter()
    def setup(self):
        t0 = time.monotonic()
        logger.info("Loading Marker models (CPU path)…")
        from marker.models import create_model_dict
        self.artifact_dict = create_model_dict()
        elapsed = time.monotonic() - t0
        logger.info("Models loaded in %.2fs (CPU)", elapsed)
        # Commit any newly downloaded weights to the volume
        model_volume.commit()

    @modal.method()
    def convert(self, pdf_bytes: bytes) -> bytes:
        """Convert a born-digital PDF to DOCX (CPU, no OCR)."""
        _validate_pdf(pdf_bytes)
        return _convert_core(pdf_bytes, self.artifact_dict, use_ocr=False)


# ---------------------------------------------------------------------------
# GPU class — scanned / image-only PDFs (OCR required)
# ---------------------------------------------------------------------------
@app.cls(
    image=base_image,
    gpu="t4",
    volumes={MODEL_CACHE_PATH: model_volume},
    scaledown_window=300,
    timeout=600,
)
class MarkerGPU:
    @modal.enter()
    def setup(self):
        import torch

        t0 = time.monotonic()
        logger.info("Loading Marker models (GPU path)…")

        # Assert GPU is available
        gpu_available = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if gpu_available else "none"
        logger.info("GPU available: %s — device: %s", gpu_available, gpu_name)
        assert gpu_available, "torch.cuda.is_available() returned False on GPU container!"

        from marker.models import create_model_dict
        self.artifact_dict = create_model_dict()
        elapsed = time.monotonic() - t0
        logger.info("Models loaded in %.2fs (GPU: %s)", elapsed, gpu_name)
        model_volume.commit()

    @modal.method()
    def convert(self, pdf_bytes: bytes) -> bytes:
        """Convert a scanned PDF to DOCX (GPU, OCR enabled)."""
        _validate_pdf(pdf_bytes)
        return _convert_core(pdf_bytes, self.artifact_dict, use_ocr=True)


# ---------------------------------------------------------------------------
# Web endpoint — auto-routes to CPU or GPU based on content detection
# ---------------------------------------------------------------------------
@app.function(
    image=base_image,
    cpu=1,
    memory=512,
    timeout=600,
)
@modal.fastapi_endpoint(method="POST", label="pdf2docx-convert")
async def convert_endpoint(request: Request):
    """
    POST /pdf2docx-convert
    Body: raw PDF bytes (Content-Type: application/pdf)
    Returns: application/vnd.openxmlformats-officedocument.wordprocessingml.document
    """
    import json
    from starlette.responses import Response as StarletteResponse

    body = await request.body()

    if len(body) == 0:
        return StarletteResponse(
            content=json.dumps({"error": "Empty request body"}),
            status_code=400,
            media_type="application/json",
        )

    try:
        _validate_pdf(body)
    except ValueError as exc:
        return StarletteResponse(
            content=json.dumps({"error": str(exc)}),
            status_code=422,
            media_type="application/json",
        )

    # Decide path
    is_scanned = _detect_is_scanned(body)
    logger.info("Routing to %s path", "GPU/OCR" if is_scanned else "CPU/text")

    t0 = time.monotonic()
    try:
        if is_scanned:
            docx_bytes = MarkerGPU().convert.remote(body)
        else:
            docx_bytes = MarkerCPU().convert.remote(body)
    except Exception as exc:
        import traceback
        logger.exception("Conversion failed")
        return StarletteResponse(
            content=json.dumps({"error": f"Conversion failed: {exc}\n{traceback.format_exc()}"}),
            status_code=500,
            media_type="application/json",
        )

    elapsed = time.monotonic() - t0
    logger.info("Total conversion took %.2fs", elapsed)

    return StarletteResponse(
        content=docx_bytes,
        status_code=200,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": 'attachment; filename="converted.docx"',
            "X-Convert-Time": f"{elapsed:.2f}",
            "X-Path": "gpu-ocr" if is_scanned else "cpu-text",
        },
    )


# ---------------------------------------------------------------------------
# Warm-up endpoint
# ---------------------------------------------------------------------------
@app.function(image=base_image, cpu=0.25, memory=128)
@modal.fastapi_endpoint(method="GET", label="pdf2docx-warm")
async def warm():
    """Ping this to pre-warm containers."""
    return {"status": "warm", "timestamp": time.time()}
