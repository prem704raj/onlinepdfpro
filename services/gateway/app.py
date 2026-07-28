"""
Gateway — thin FastAPI router for onlinepdfpro.com.

POST /api/convert  {direction: "docx-to-pdf" | "pdf-to-docx", file}
    Routes to Service A or Service B.

Features: per-IP rate limiting, max file size, request IDs, structured JSON logs,
           clear error classification.
"""

import asyncio
import json
import logging
import os
import time
import uuid
from collections import defaultdict
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# ---------------------------------------------------------------------------
# Config (all from env vars)
# ---------------------------------------------------------------------------
DOCX2PDF_URL = os.getenv("DOCX2PDF_URL", "http://127.0.0.1:8001")
PDF2DOCX_MODAL_URL = os.getenv("PDF2DOCX_MODAL_URL", "https://prem736raj--pdf2docx-convert.modal.run")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "10"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024
API_KEY = os.getenv("API_KEY", "")  # Optional: if set, require X-API-Key header
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

VALID_DIRECTIONS = {"docx-to-pdf", "pdf-to-docx"}

DOCX_EXTENSIONS = {".docx", ".doc", ".odt", ".rtf", ".txt"}
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
    if API_KEY:
        provided_key = request.headers.get("x-api-key", "")
        if provided_key != API_KEY:
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

    stem = os.path.splitext(file.filename or "output")[0]
    return Response(
        content=result_bytes,
        media_type=result_media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{stem}{result_ext}"',
            "X-Request-ID": request_id,
            "X-Convert-Time": f"{elapsed:.2f}",
        },
    )


async def _route_docx2pdf(contents: bytes, filename: str, request_id: str):
    """Forward to Service A (DOCX→PDF)."""
    url = f"{DOCX2PDF_URL}/convert/docx-to-pdf"

    async with httpx.AsyncClient(timeout=150.0) as client:
        try:
            resp = await client.post(
                url,
                files={"file": (filename, contents)},
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

    async with httpx.AsyncClient(timeout=600.0) as client:
        try:
            resp = await client.post(
                PDF2DOCX_MODAL_URL,
                data=contents,
                headers={"Content-Type": "application/pdf"},
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
