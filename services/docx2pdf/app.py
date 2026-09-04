"""
Service A — DOCX → PDF conversion via unoserver/LibreOffice.

POST /convert/docx-to-pdf  → multipart file → application/pdf
GET  /health               → 200 only if unoserver probe succeeds
"""

import asyncio
import hmac
import io
import logging
import os
import re
import signal
import subprocess
import tempfile
import time
import uuid
import zipfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import Response

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024  # bytes
MAX_OUTPUT_SIZE = int(os.getenv("MAX_OUTPUT_SIZE_MB", "100")) * 1024 * 1024
CONVERT_TIMEOUT = int(os.getenv("CONVERT_TIMEOUT_SECS", "120"))
UNO_HOST = os.getenv("UNO_HOST", "127.0.0.1")
UNO_PORT = os.getenv("UNO_PORT", "2003")
ALLOWED_EXTENSIONS = {".docx", ".doc", ".odt", ".rtf"}
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
DOCX2PDF_API_TOKEN = os.getenv("DOCX2PDF_API_TOKEN", "")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("docx2pdf")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="DOCX→PDF Service", version="1.0.0")


def _validate_extension(filename: str) -> str:
    """Return lowered extension or raise 415."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    return ext


def _authorize(request: Request) -> None:
    """Require the gateway's bearer token before accepting conversion work."""
    if not DOCX2PDF_API_TOKEN:
        if ENVIRONMENT == "production":
            raise HTTPException(
                status_code=503,
                detail="DOCX→PDF service authentication is not configured.",
            )
        return

    authorization = request.headers.get("authorization", "")
    provided = authorization[7:].strip() if authorization.lower().startswith("bearer ") else ""
    if not provided or not hmac.compare_digest(provided, DOCX2PDF_API_TOKEN):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate_document(contents: bytes, ext: str) -> None:
    """Validate the actual container instead of trusting a filename/MIME label."""
    if ext in {".docx", ".odt"}:
        valid = False
        try:
            with zipfile.ZipFile(io.BytesIO(contents)) as archive:
                names = set(archive.namelist())
                if ext == ".docx":
                    valid = "[Content_Types].xml" in names and "word/document.xml" in names
                else:
                    valid = "mimetype" in names and "content.xml" in names and archive.read("mimetype", pwd=None).startswith(b"application/vnd.oasis.opendocument.text")
        except (OSError, ValueError, KeyError, RuntimeError, zipfile.BadZipFile):
            valid = False
    elif ext == ".doc":
        valid = contents.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
    elif ext == ".rtf":
        valid = bool(re.match(br"^\s*\{\\rtf[0-9]", contents[:64], re.IGNORECASE))
    if not valid:
        raise HTTPException(
            status_code=415,
            detail="The file contents do not match the selected document type.",
        )


def _safe_output_stem(filename: str) -> str:
    """Keep user filenames out of response-header control characters."""
    stem = Path(os.path.basename(filename or "output")).stem
    stem = re.sub(r'[\x00-\x1f\x7f"\\/:*?<>|]+', "_", stem)
    stem = re.sub(r"[^A-Za-z0-9._() -]", "_", stem).strip(" .")[:120]
    return stem or "output"


def _kill_unoserver() -> None:
    """Kill any running unoserver/soffice processes so supervisor restarts them."""
    logger.warning("Killing unoserver/soffice processes for restart…")
    try:
        subprocess.run(["pkill", "-f", "soffice"], timeout=5)
    except Exception:
        pass
    try:
        subprocess.run(["pkill", "-f", "unoserver"], timeout=5)
    except Exception:
        pass


async def _convert(input_path: str, output_path: str) -> None:
    """
    Run unoconverter or soffice --headless as a subprocess with a hard timeout.
    Raises TimeoutError or RuntimeError on failure.
    """
    cmd = [
        "unoconverter",
        "--host", UNO_HOST,
        "--port", UNO_PORT,
        "--convert-to", "pdf",
        input_path,
        output_path,
    ]

    use_soffice = False
    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(), timeout=CONVERT_TIMEOUT
        )
        if proc.returncode != 0:
            use_soffice = True
    except FileNotFoundError:
        use_soffice = True
    except asyncio.TimeoutError:
        if proc and proc.returncode is None:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            await proc.wait()
        raise TimeoutError(f"Conversion timed out after {CONVERT_TIMEOUT}s")

    if use_soffice:
        soffice_bin = os.getenv("SOFFICE_PATH", "soffice")
        if os.name == "nt" and os.path.exists("C:/Program Files/LibreOffice/program/soffice.exe"):
            soffice_bin = "C:/Program Files/LibreOffice/program/soffice.exe"

        out_dir = str(Path(output_path).parent)
        cmd = [
            soffice_bin,
            "--headless",
            "--convert-to", "pdf",
            "--outdir", out_dir,
            input_path,
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=CONVERT_TIMEOUT
            )
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            raise TimeoutError(f"Conversion timed out after {CONVERT_TIMEOUT}s")

        if proc.returncode != 0:
            err_msg = stderr.decode(errors="replace").strip() if stderr else ""
            raise RuntimeError(f"soffice failed (rc={proc.returncode}): {err_msg}")

        # soffice --convert-to pdf writes <stem>.pdf into out_dir
        expected_pdf = Path(out_dir) / (Path(input_path).stem + ".pdf")
        if expected_pdf.exists() and str(expected_pdf) != output_path:
            expected_pdf.replace(output_path)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.post("/convert/docx-to-pdf")
async def convert_docx_to_pdf(request: Request, file: UploadFile = File(...)):
    """Convert an uploaded document to PDF via LibreOffice/unoserver."""
    request_id = uuid.uuid4().hex[:12]
    _authorize(request)
    logger.info("[%s] Convert request: %s", request_id, file.filename)

    # Validate extension
    ext = _validate_extension(file.filename or "upload.bin")

    # Reject obviously oversized multipart requests before reading the body.
    declared_length = request.headers.get("content-length")
    try:
        if declared_length and int(declared_length) > MAX_FILE_SIZE + 1024 * 1024:
            raise HTTPException(status_code=413, detail="File is too large.")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Content-Length header.")

    # Read file with size check
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(contents) / 1024 / 1024:.1f} MB). Max: {MAX_FILE_SIZE / 1024 / 1024:.0f} MB.",
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    _validate_document(contents, ext)

    # Work in temp files
    input_path = None
    output_path = None
    try:
        # Write input
        with tempfile.NamedTemporaryFile(
            suffix=ext, delete=False, dir="/tmp"
        ) as tmp_in:
            tmp_in.write(contents)
            input_path = tmp_in.name

        output_path = input_path.rsplit(".", 1)[0] + ".pdf"

        t0 = time.monotonic()
        await _convert(input_path, output_path)
        elapsed = time.monotonic() - t0
        logger.info("[%s] Converted in %.2fs", request_id, elapsed)

        # Read result
        pdf_bytes = Path(output_path).read_bytes()
        if len(pdf_bytes) == 0:
            raise RuntimeError("Conversion produced an empty PDF")
        if len(pdf_bytes) > MAX_OUTPUT_SIZE:
            raise RuntimeError("Conversion produced an oversized PDF")
        if not pdf_bytes.startswith(b"%PDF-"):
            raise RuntimeError("Conversion did not produce a valid PDF")

        output_stem = _safe_output_stem(file.filename or "output")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{output_stem}.pdf"',
                "X-Request-ID": request_id,
                "X-Convert-Time": f"{elapsed:.2f}",
            },
        )

    except TimeoutError as exc:
        logger.error("[%s] Timeout: %s", request_id, exc)
        raise HTTPException(status_code=503, detail=str(exc))
    except RuntimeError as exc:
        logger.error("[%s] Conversion error: %s", request_id, exc)
        raise HTTPException(status_code=500, detail=str(exc))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[%s] Unexpected error", request_id)
        raise HTTPException(status_code=500, detail=f"Internal error: {exc}")
    finally:
        # Always clean up temp files
        for p in (input_path, output_path):
            if p:
                try:
                    os.unlink(p)
                except OSError:
                    pass


@app.get("/health")
async def health():
    """
    Returns 200 only if conversion engine can actually perform a conversion.
    Uses a small temporary text file as a probe.
    """
    probe_id = uuid.uuid4().hex[:8]
    tmp_dir = tempfile.gettempdir()
    probe_input = os.path.join(tmp_dir, f"probe_in_{probe_id}.txt")
    probe_output = os.path.join(tmp_dir, f"probe_in_{probe_id}.pdf")

    try:
        with open(probe_input, "w", encoding="utf-8") as f:
            f.write("Health check test document.")
        await asyncio.wait_for(
            _convert(probe_input, probe_output), timeout=15
        )
        if not Path(probe_output).exists() or Path(probe_output).stat().st_size == 0:
            raise RuntimeError("Probe conversion produced empty output")
        return {"status": "healthy"}
    except Exception as exc:
        logger.error("Health check failed: %s", exc)
        raise HTTPException(status_code=503, detail=f"Unhealthy: {exc}")
    finally:
        for path in (probe_input, probe_output):
            try:
                os.unlink(path)
            except OSError:
                pass
