# =============================================================================
# services/extractor.py — Text extraction from PDF, DOCX, and TXT files
# =============================================================================

import os
import pdfplumber
from services.exceptions import ExtractionError

try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return _extract_pdf(file_path)
    if ext == ".txt":
        return _extract_txt(file_path)
    if ext == ".docx":
        return _extract_docx(file_path)
    raise ExtractionError(f"Unsupported file type: {ext}. Allowed: .pdf, .txt, .docx")


def _extract_pdf(file_path: str) -> str:
    text = _pdfplumber_extract(file_path)
    if not text or len(text.strip()) < 50:
        if not PYMUPDF_AVAILABLE:
            raise ExtractionError("PDF extraction failed and PyMuPDF is not installed.")
        text = _pymupdf_extract(file_path)
    if not text or len(text.strip()) < 50:
        raise ExtractionError("Could not extract readable text from this PDF.")
    return text


def _pdfplumber_extract(file_path: str) -> str:
    pages = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    pages.append(page_text.strip())
    except Exception as exc:
        raise ExtractionError(f"pdfplumber error: {exc}") from exc
    return "\n\n".join(pages)


def _pymupdf_extract(file_path: str) -> str:
    pages = []
    try:
        doc = fitz.open(file_path)
        for page in doc:
            pages.append(page.get_text("text").strip())
        doc.close()
    except Exception as exc:
        raise ExtractionError(f"PyMuPDF error: {exc}") from exc
    return "\n\n".join(pages)


def _extract_docx(file_path: str) -> str:
    if not DOCX_AVAILABLE:
        raise ExtractionError("python-docx not installed. Run: pip install python-docx")
    try:
        doc = Document(file_path)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)
    except Exception as exc:
        raise ExtractionError(f"DOCX extraction error: {exc}") from exc


def _extract_txt(file_path: str) -> str:
    for encoding in ("utf-8", "latin-1", "cp1252"):
        try:
            with open(file_path, "r", encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue
    raise ExtractionError("Could not decode TXT file.")
