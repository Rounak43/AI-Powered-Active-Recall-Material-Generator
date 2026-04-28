# =============================================================================
# services/exceptions.py — Custom exception types
# =============================================================================

class ExtractionError(Exception):
    """Raised when text extraction from PDF/DOCX/TXT fails."""

class ValidationError(Exception):
    """Raised when uploaded text is too short or too noisy."""

class PipelineError(Exception):
    """Raised when the NLP summarization pipeline cannot produce output."""
