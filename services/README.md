# PDF↔Word Conversion Backend

Self-hosted backend for [onlinepdfpro.com](https://onlinepdfpro.com) providing two production conversion endpoints:

| Direction | Service | Stack |
|-----------|---------|-------|
| DOCX → PDF | Service A (`docx2pdf`) | FastAPI + LibreOffice/unoserver (Docker) |
| PDF → DOCX | Service B (`pdf2docx`) | PyMuPDF validation/cleanup + `pdf2docx` on Modal |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  onlinepdfpro   │────▶│    Gateway       │────▶│  Service A      │
│  (your site)    │     │  (FastAPI)       │     │  docx2pdf       │
│                 │     │  :8080           │     │  LO + unoserver │
└─────────────────┘     │                  │     │  Docker :8001   │
                        │                  │     └─────────────────┘
                        │                  │
                        │                  │     ┌─────────────────┐
                        │                  │────▶│  Service B      │
                        │                  │     │  pdf2docx       │
                        └──────────────────┘     │  pdf2docx + Modal│
                                                 │  (serverless)   │
                                                 └─────────────────┘
```

## Quick Start

### Prerequisites
- Docker Desktop (for Service A + Gateway)
- Python 3.12+ (for tests and fixture generation)
- [Modal](https://modal.com) account + token (for Service B)

### 1. Local Setup (Service A + Gateway)

```bash
# Clone and enter the services directory
cd services

# Copy environment config
cp .env.example .env
# Edit .env with your settings

# Build and start
docker-compose up -d

# Verify
curl http://localhost:8080/health
# → {"status":"healthy","docx2pdf":"up"}
```

### 2. Deploy Service B (Modal)

```bash
# Install Modal CLI
pip install modal

# Authenticate
modal token new

# Deploy
cd services/pdf2docx
modal deploy modal_app.py

# Note your endpoint URL (e.g., https://youruser--pdf2docx-convert.modal.run)
# Add it to your .env file as PDF2DOCX_MODAL_URL
```

Before deploying either Modal conversion app, create a Modal Secret named
`onlinepdfpro-conversion` containing `MODAL_API_TOKEN`. Use the same random
value for the Cloudflare Worker `MODAL_API_TOKEN` secret. The conversion
functions reject requests without this bearer token; the public Modal URL is
not intended to be called directly.

### 3. Run Test Suite

```bash
# Install test dependencies
pip install reportlab pillow pypdf pymupdf python-docx httpx pytest

# Generate test fixtures
python tests/generate_fixtures.py

# Run the full suite (requires both services running)
pytest tests/test_quality.py -v --tb=short

# Results are written to tests/report.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCX2PDF_URL` | `http://docx2pdf:8000` | Internal URL for Service A |
| `DOCX2PDF_API_TOKEN` | _(required in production)_ | Bearer token shared by the gateway and Service A |
| `PDF2DOCX_MODAL_URL` | _(required)_ | Modal endpoint for Service B |
| `MODAL_API_TOKEN` | _(required in production)_ | Bearer token shared with both Modal functions |
| `ENVIRONMENT` | `development` | Set to `production` to require `API_KEY` on the gateway |
| `RATE_LIMIT_PER_MINUTE` | `10` | Max requests per IP per minute |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size |
| `API_KEY` | _(empty)_ | Optional API key for authentication |
| `ALLOWED_ORIGINS` | `https://onlinepdfpro.com,https://www.onlinepdfpro.com` | CORS allowed origins (comma-separated) |

The production Worker additionally requires `TURNSTILE_SECRET_KEY`,
`CONVERSION_SIGNING_SECRET`, and `MODAL_API_TOKEN` as Cloudflare secrets. Keep
all three out of source control and rotate them if they have ever been exposed.

## API Reference

### POST `/api/convert`

Convert a document between formats.

**Request** (multipart/form-data):
- `direction`: `"docx-to-pdf"` or `"pdf-to-docx"`
- `file`: The file to convert

**Response**: Binary file (PDF or DOCX) with headers:
- `Content-Disposition`: Filename
- `X-Request-ID`: Unique request identifier
- `X-Convert-Time`: Conversion duration in seconds

**Error responses** (JSON):
```json
{"error": "rate_limited", "message": "Too many requests. Max 10/minute."}
{"error": "file_too_large", "message": "File is 65.2 MB. Maximum: 50 MB."}
{"error": "unsupported_type", "message": "For docx-to-pdf, accepted types are: ..."}
{"error": "timeout", "message": "Service timed out."}
```

### GET `/health`

Returns gateway + Service A health status.

## Supported Formats

**DOCX → PDF**: `.docx`, `.doc`, `.odt`, `.rtf`, `.txt` (max 50 MB)
**PDF → DOCX**: `.pdf` (max 50 MB)

## Licensing and operating costs

Service B uses the open-source `pdf2docx` and PyMuPDF packages; no Marker
model weights or Datalab service are part of this deployment. Modal billing,
container duration and account limits vary over time, so measure them in the
Modal dashboard instead of relying on estimates in this repository.

## Service Details

### Service A — DOCX → PDF
- LibreOffice runs persistently via unoserver (no cold start per request)
- Supervisor auto-restarts unoserver if it crashes
- 120s hard timeout per conversion; returns 503 on timeout
- Health endpoint performs a real probe conversion

### Service B — PDF → DOCX
- PyMuPDF validates the PDF and removes annotations/widgets before conversion
- `pdf2docx==0.5.8` performs the conversion in a 2 vCPU/2 GB Modal container
- Password-protected, corrupt, empty and oversized PDFs are rejected before work
- Temporary files are removed after every request; the container scales down
- Forms, annotations and some complex layout may not survive conversion because
  the cleanup step deliberately removes them; this is disclosed in the UI

### Gateway
- Per-IP rate limiting (sliding window)
- Structured JSON logging with request IDs
- Clear error classification: encrypted, corrupt, unsupported, timeout
- All configuration via environment variables
