# PDF↔Word Conversion Backend

Self-hosted backend for [onlinepdfpro.com](https://onlinepdfpro.com) providing two production conversion endpoints:

| Direction | Service | Stack |
|-----------|---------|-------|
| DOCX → PDF | Service A (`docx2pdf`) | FastAPI + LibreOffice/unoserver (Docker) |
| PDF → DOCX | Service B (`pdf2docx`) | Marker (Datalab) on Modal + pandoc |

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
                        └──────────────────┘     │  Marker + Modal │
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
| `PDF2DOCX_MODAL_URL` | _(required)_ | Modal endpoint for Service B |
| `RATE_LIMIT_PER_MINUTE` | `10` | Max requests per IP per minute |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload file size |
| `API_KEY` | _(empty)_ | Optional API key for authentication |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins (comma-separated) |

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

## License — Marker Model Weights

> **✅ License Status — PERMITTED**
>
> Marker is licensed under GPLv3 (source code). The model weights are free for research, personal use, and startups with under $2M in funding or revenue. **onlinepdfpro.com has $0 revenue and no funding — usage is fully permitted under the free tier.**
>
> If your revenue/funding situation changes and exceeds $2M, you must obtain a commercial license from [Datalab](https://datalab.to).

## Cost Estimates (Modal — Service B)

Assumes T4 GPU at $0.000164/sec, ~100s average per conversion:

| Conversions/month | GPU time | Estimated cost | vs $30 free credit |
|---|---|---|---|
| 100 | ~2.8 hrs | **~$1.64** | ✅ Well within |
| 1,000 | ~27.8 hrs | **~$16.40** | ✅ Within |
| 10,000 | ~277.8 hrs | **~$164.00** | ⚠️ Exceeds free tier |

Born-digital PDFs use the CPU path (no GPU cost), so real costs will be lower if most uploads are born-digital.

## Service Details

### Service A — DOCX → PDF
- LibreOffice runs persistently via unoserver (no cold start per request)
- Supervisor auto-restarts unoserver if it crashes
- 120s hard timeout per conversion; returns 503 on timeout
- Health endpoint performs a real probe conversion

### Service B — PDF → DOCX
- **Text path** (CPU): Born-digital PDFs (>100 chars/page avg), OCR disabled
- **OCR path** (GPU/T4): Scanned PDFs, OCR enabled
- Model weights cached in Modal Volume (fast warm starts)
- Scale to zero when idle (`min_containers=0`)
- Marker → HTML → pandoc → DOCX pipeline (HTML preserves tables better than markdown)

### Gateway
- Per-IP rate limiting (sliding window)
- Structured JSON logging with request IDs
- Clear error classification: encrypted, corrupt, unsupported, timeout
- All configuration via environment variables
