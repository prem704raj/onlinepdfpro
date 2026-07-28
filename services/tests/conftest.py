"""
Shared pytest configuration and fixtures for the verification suite.
"""

import os
import pytest

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8080")
DOCX2PDF_URL = os.getenv("DOCX2PDF_URL", "http://localhost:8001")
FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
GROUND_TRUTH_DIR = os.path.join(FIXTURES_DIR, "ground_truth")


@pytest.fixture
def gateway_url():
    return GATEWAY_URL


@pytest.fixture
def docx2pdf_url():
    return DOCX2PDF_URL


@pytest.fixture
def fixtures_dir():
    return FIXTURES_DIR


@pytest.fixture
def ground_truth_dir():
    return GROUND_TRUTH_DIR
