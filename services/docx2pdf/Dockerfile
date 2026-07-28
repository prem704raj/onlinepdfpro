FROM python:3.12-slim

# Avoid interactive prompts during package install
ENV DEBIAN_FRONTEND=noninteractive

# Install LibreOffice (writer only), fonts, supervisor, and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu \
    fonts-noto-cjk \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create a tiny test file for health-check probe conversions
RUN python -c "\
from pathlib import Path; \
Path('/app/healthcheck.txt').write_text('health probe', encoding='utf-8')"

# Expose FastAPI port
EXPOSE 8000

# Supervisor manages both unoserver and uvicorn
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
