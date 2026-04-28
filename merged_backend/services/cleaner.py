# =============================================================================
# services/cleaner.py — Text cleaning and normalization pipeline
#
# Handles PDF artifacts: broken lines, hyphenation, noise symbols.
# Preserves sentence punctuation and abbreviations.
# =============================================================================

import re
import unicodedata


# ── Compiled regex patterns ────────────────────────────────────────────────────
_HYPHEN_LINEBREAK  = re.compile(r"-\n\s*")
_PARA_BREAK        = re.compile(r"\n{3,}")
_SINGLE_NEWLINE    = re.compile(r"(?<![.!?:;])\n(?=[a-z])")
_MULTI_SPACE       = re.compile(r" {2,}")
_BULLET_SYMBOL     = re.compile(r"^[\s]*[•·‣▸▪●◦■□▶\-\*]\s+", re.MULTILINE)
_PAGE_NUMBER       = re.compile(r"\bPage\s*\d+\b|\b\d+\s*/\s*\d+\b", re.IGNORECASE)
_HEADER_FOOTER_NUM = re.compile(r"^\s*\d{1,4}\s*$", re.MULTILINE)
_URL               = re.compile(r"https?://\S+|www\.\S+")
_EMAIL             = re.compile(r"\S+@\S+\.\S+")
_CITATION_BRACKET  = re.compile(r"\[\d+(?:[,\s]*\d+)*\]")
_CITATION_PAREN    = re.compile(r"\(\s*\d{4}\s*\)")
_SPECIAL_JUNK      = re.compile(r"[^\w\s.,!?;:()\-'\"/&%@#]")
_MULTI_DOTS        = re.compile(r"\.{3,}")
_TRAILING_SPACE    = re.compile(r"[ \t]+$", re.MULTILINE)
_SPACE_BEFORE_PUNCT = re.compile(r" ([.,;:!?])")
_SECTION_HEADING   = re.compile(r"^(step\s*\d+[\s\-–:]|syllabus:|phase\s*\d+)", re.IGNORECASE | re.MULTILINE)
_NUMBERED_STEP     = re.compile(r"^\s*\d+\s*[–\-]\s*", re.MULTILINE)
_MATH_EXPR      = re.compile(r"\b[a-zA-Z]{1,3}\s*[=\+\-\*\/\^]\s*[a-zA-Z0-9]")
_SUBSCRIPT_EXPR = re.compile(r"[a-zA-Z]+[_\(\)][a-zA-Z0-9\(\)]+")
_INLINE_FORMULA = re.compile(r"\b\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}\b")

def clean_text(raw_text: str) -> str:
    """
    Full cleaning pipeline for academic PDF/TXT content.

    Pipeline stages:
        1.  Unicode normalisation (é → e, etc.)
        2.  Fix PDF hyphenated line breaks ("algo-\\nrithm" → "algorithm")
        3.  Mid-sentence single newlines → space
        4.  3+ consecutive newlines → double newline (paragraph separator)
        5.  Remove URLs and e-mail addresses
        6.  Remove citation markers ([1], (2020), etc.)
        7.  Remove bullet symbols (keep text, strip marker)
        8.  Remove page numbers and standalone header/footer digits
        9.  Normalise ellipses and strip non-standard characters
        10. Normalise whitespace (trailing spaces, multi-space runs)
        11. Remove space before punctuation

    Returns:
        Clean, readable string ready for NLP processing, preserving original
        sentence order and punctuation.
    """
    text = raw_text

    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = _HYPHEN_LINEBREAK.sub("", text)
    text = _SINGLE_NEWLINE.sub(" ", text)
    text = _PARA_BREAK.sub("\n\n", text)
    text = _URL.sub(" ", text)
    text = _EMAIL.sub(" ", text)
    text = _SECTION_HEADING.sub("", text) 
    text = _NUMBERED_STEP.sub("", text)
    text = _CITATION_BRACKET.sub(" ", text)
    text = _CITATION_PAREN.sub(" ", text)
    text = _BULLET_SYMBOL.sub("", text)
    text = _PAGE_NUMBER.sub(" ", text)
    text = _HEADER_FOOTER_NUM.sub("", text)
    text = _MULTI_DOTS.sub(".", text)
    text = _SPECIAL_JUNK.sub(" ", text)
    text = _MATH_EXPR.sub(" ", text)
    text = _SUBSCRIPT_EXPR.sub(" ", text)
    text = _INLINE_FORMULA.sub(" ", text)
    text = _TRAILING_SPACE.sub("", text)
    text = _MULTI_SPACE.sub(" ", text)
    text = _SPACE_BEFORE_PUNCT.sub(r"\1", text)

    return text.strip()


def is_text_valid(text: str, min_words: int = 100) -> bool:
    """
    Check whether extracted text is meaningful enough to summarize.

    Returns False if the text is too short or mostly non-alphabetic noise.
    """
    words = text.split()
    if len(words) < min_words:
        return False

    alpha_ratio = sum(c.isalpha() for c in text) / max(len(text), 1)
    return alpha_ratio >= 0.4
