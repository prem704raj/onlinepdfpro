"""
Gateway — thin FastAPI router for onlinepdfpro.com.

POST /api/convert  {direction: "docx-to-pdf" | "pdf-to-docx", file}
    Routes to Service A or Service B.

Features: per-IP rate limiting, max file size, request IDs, structured JSON logs,
           clear error classification.
"""

import asyncio
import hmac
import io
import json
import logging
import os
import re
import time
import uuid
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# ---------------------------------------------------------------------------
# Config (all from env vars)
# ---------------------------------------------------------------------------
DOCX2PDF_URL = os.getenv("DOCX2PDF_URL", "http://127.0.0.1:8001")
DOCX2PDF_API_TOKEN = os.getenv("DOCX2PDF_API_TOKEN", "")
PDF2DOCX_MODAL_URL = os.getenv("PDF2DOCX_MODAL_URL", "https://prem736raj--pdf2docx-convert.modal.run")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_OUTPUT_SIZE = 100 * 1024 * 1024
API_KEY = os.getenv("API_KEY", "")  # Optional: if set, require X-API-Key header
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
MODAL_API_TOKEN = os.getenv("MODAL_API_TOKEN", "")
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS",
    "https://onlinepdfpro.com,https://www.onlinepdfpro.com",
).split(",") if origin.strip()]

VALID_DIRECTIONS = {"docx-to-pdf", "pdf-to-docx"}

DOCX_EXTENSIONS = {".docx", ".doc", ".odt", ".rtf"}
PDF_EXTENSIONS = {".pdf"}

# ---------------------------------------------------------------------------
# Logging — structured JSON
# ---------------------------------------------------------------------------
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)

handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger = logging.getLogger("gateway")
logger.setLevel(logging.INFO)
logger.addHandler(handler)
logger.propagate = False

# ---------------------------------------------------------------------------
# Rate limiter (in-memory, sliding window per IP)
# ---------------------------------------------------------------------------
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.monotonic()
        # Prune old entries
        self._requests[ip] = [
            t for t in self._requests[ip] if now - t < self.window
        ]
        if len(self._requests[ip]) >= self.max_requests:
            return False
        self._requests[ip].append(now)
        return True

rate_limiter = RateLimiter(RATE_LIMIT_PER_MINUTE)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="PDF Conversion Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _classify_extension(filename: str, direction: str) -> None:
    """Raise 415 if the file extension doesn't match the direction."""
    ext = os.path.splitext(filename.lower())[1]

    if direction == "docx-to-pdf":
        if ext not in DOCX_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "error": "unsupported_type",
                    "message": f"For docx-to-pdf, accepted types are: {', '.join(sorted(DOCX_EXTENSIONS))}. Got: '{ext}'",
                },
            )
    elif direction == "pdf-to-docx":
        if ext not in PDF_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail={
                    "error": "unsupported_type",
                    "message": f"For pdf-to-docx, accepted types are: .pdf. Got: '{ext}'",
                },
            )



def _validate_pdf_early(contents: bytes) -> None:
    """
    Quick validation of PDF bytes at the gateway level.
    Detects corrupt files and encrypted/password-protected PDFs before forwarding.
    """
    # Check PDF header
    if len(contents) < 5 or not contents[:5].startswith(b"%PDF-"):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "corrupt_file",
                "message": "Not a valid PDF file (missing PDF header).",
            },
        )

    # Try to check for encryption (if pymupdf is available)
    try:
        import fitz
        doc = fitz.open(stream=contents, filetype="pdf")
        if doc.is_encrypted:
            doc.close()
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "encrypted_pdf",
                    "message": "PDF is password-protected/encrypted. Please remove the password and try again.",
                },
            )
        doc.close()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "corrupt_file",
                "message": "PDF file is corrupt or unreadable.",
            },
        )


def _validate_document_early(contents: bytes, filename: str) -> None:
    """Validate the container signature instead of trusting MIME/extension."""
    ext = Path(filename).suffix.lower()
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
        valid = bool(re.match(br"^\s*\{\\rtf[0-9]", contents[:64], re.I))
    if not valid:
        raise HTTPException(
            status_code=415,
            detail={
                "error": "unsupported_type",
                "message": "The file contents do not match the selected document type.",
            },
        )


def _is_docx_output(contents: bytes) -> bool:
    """Check that a conversion response is a real DOCX package."""
    if not contents.startswith(b"PK"):
        return False
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as archive:
            names = set(archive.namelist())
            return "[Content_Types].xml" in names and "word/document.xml" in names
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile):
        return False


def _validate_conversion_output(contents: bytes, media_type: str) -> None:
    """Reject an upstream 200 response unless it is the expected document."""
    if not contents or len(contents) > MAX_OUTPUT_SIZE:
        raise HTTPException(
            status_code=502,
            detail={"error": "invalid_output", "message": "Conversion returned an empty or oversized file."},
        )
    if media_type == "application/pdf" and not contents.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=502,
            detail={"error": "invalid_output", "message": "Conversion returned an invalid PDF."},
        )
    if media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" and not _is_docx_output(contents):
        raise HTTPException(
            status_code=502,
            detail={"error": "invalid_output", "message": "Conversion returned an invalid DOCX file."},
        )


def _safe_output_stem(filename: str) -> str:
    """Prevent user filenames from creating response-header injection."""
    stem = Path(os.path.basename(filename or "output")).stem
    stem = re.sub(r'[\x00-\x1f\x7f"\\/:*?<>|]+', "_", stem)
    stem = re.sub(r"[^A-Za-z0-9._() -]", "_", stem).strip(" .")[:120]
    return stem or "output"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.post("/api/convert")
async def convert(
    request: Request,
    direction: str = Form(...),
    file: UploadFile = File(...),
):
    request_id = uuid.uuid4().hex[:12]

    # Rate limit
    client_ip = _get_client_ip(request)
    if not rate_limiter.is_allowed(client_ip):
        logger.warning("Rate limit exceeded", extra={"request_id": request_id})
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limited",
                "message": f"Too many requests. Max {RATE_LIMIT_PER_MINUTE}/minute.",
            },
        )

    # API key check (if configured)
    if API_KEY or ENVIRONMENT == "production":
        provided_key = request.headers.get("x-api-key", "")
        if not API_KEY or not hmac.compare_digest(provided_key, API_KEY):
            raise HTTPException(
                status_code=401,
                detail={"error": "unauthorized", "message": "Invalid or missing API key."},
            )

    # Validate direction
    if direction not in VALID_DIRECTIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_direction",
                "message": f"Direction must be one of: {', '.join(sorted(VALID_DIRECTIONS))}",
            },
        )

    # Validate extension
    _classify_extension(file.filename or "upload.bin", direction)

    # Read file with size check
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "message": f"File is {len(contents)/1024/1024:.1f} MB. Maximum: {MAX_FILE_SIZE_MB} MB.",
            },
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "empty_file", "message": "Uploaded file is empty."},
        )

    # Early PDF validation for pdf-to-docx direction
    if direction == "pdf-to-docx":
        _validate_pdf_early(contents)
    else:
        _validate_document_early(contents, file.filename or "input.docx")

    logger.info(
        "Convert request: direction=%s file=%s size=%d ip=%s",
        direction, file.filename, len(contents), client_ip,
        extra={"request_id": request_id},
    )

    t0 = time.monotonic()

    try:
        if direction == "docx-to-pdf":
            result_bytes, result_media_type, result_ext = await _route_docx2pdf(
                contents, file.filename or "input.docx", request_id
            )
        else:
            result_bytes, result_media_type, result_ext = await _route_pdf2docx(
                contents, request_id
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Conversion failed", extra={"request_id": request_id})
        raise HTTPException(
            status_code=500,
            detail={"error": "conversion_failed", "message": str(exc)},
        )

    elapsed = time.monotonic() - t0
    logger.info(
        "Conversion completed in %.2fs", elapsed,
        extra={"request_id": request_id},
    )

    stem = _safe_output_stem(file.filename or "output")
    return Response(
        content=result_bytes,
        media_type=result_media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{stem}{result_ext}"',
            "X-Request-ID": request_id,
            "X-Convert-Time": f"{elapsed:.2f}",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


async def _route_docx2pdf(contents: bytes, filename: str, request_id: str):
    """Forward to Service A (DOCX→PDF)."""
    url = f"{DOCX2PDF_URL}/convert/docx-to-pdf"

    if ENVIRONMENT == "production" and not DOCX2PDF_API_TOKEN:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "not_configured",
                "message": "DOCX→PDF service authentication is not configured.",
            },
        )

    upstream_headers = {}
    if DOCX2PDF_API_TOKEN:
        upstream_headers["Authorization"] = f"Bearer {DOCX2PDF_API_TOKEN}"

    async with httpx.AsyncClient(timeout=150.0) as client:
        try:
            resp = await client.post(
                url,
                files={"file": (filename, contents)},
                headers=upstream_headers,
            )
        except (httpx.Timeout, TimeoutError):
            raise HTTPException(
                status_code=504,
                detail={"error": "timeout", "message": "DOCX→PDF service timed out."},
            )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=502,
                detail={"error": "service_unavailable", "message": "DOCX→PDF service is not reachable."},
            )

    if resp.status_code != 200:
        # Forward the error from Service A
        try:
            detail = resp.json()
        except Exception:
            detail = {"error": "upstream_error", "message": resp.text}
        raise HTTPException(status_code=resp.status_code, detail=detail)

    _validate_conversion_output(resp.content, "application/pdf")
    return resp.content, "application/pdf", ".pdf"


async def _route_pdf2docx(contents: bytes, request_id: str):
    """Forward to Service B (PDF→DOCX on Modal)."""
    if not PDF2DOCX_MODAL_URL:
        raise HTTPException(
            status_code=501,
            detail={
                "error": "not_configured",
                "message": "PDF→DOCX service URL not configured. Set PDF2DOCX_MODAL_URL.",
            },
        )
    if not MODAL_API_TOKEN:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "not_configured",
                "message": "PDF→DOCX service authentication is not configured.",
            },
        )

    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            resp = await client.post(
                PDF2DOCX_MODAL_URL,
                data=contents,
                headers={"Content-Type": "application/pdf", "Authorization": f"Bearer {MODAL_API_TOKEN}"},
            )
        except (httpx.Timeout, TimeoutError):
            raise HTTPException(
                status_code=504,
                detail={"error": "timeout", "message": "PDF→DOCX service timed out."},
            )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=502,
                detail={"error": "service_unavailable", "message": "PDF→DOCX service is not reachable."},
            )

    if resp.status_code != 200:
        try:
            detail = resp.json()
        except Exception:
            detail = {"error": "upstream_error", "message": resp.text}
        raise HTTPException(status_code=resp.status_code, detail=detail)

    _validate_conversion_output(resp.content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return (
        resp.content,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".docx",
    )


@app.get("/health")
async def health():
    """Gateway health — also pings Service A."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{DOCX2PDF_URL}/health")
            docx2pdf_healthy = resp.status_code == 200
    except Exception:
        docx2pdf_healthy = False

    if not docx2pdf_healthy:
        raise HTTPException(status_code=503, detail={"status": "degraded", "docx2pdf": "down"})

    return {"status": "healthy", "docx2pdf": "up"}
