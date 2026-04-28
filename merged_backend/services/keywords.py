# =============================================================================
# services/keywords.py — Keyword extraction using YAKE and RAKE
# =============================================================================

import re
from collections import Counter

import nltk
from nltk.corpus import stopwords

from services.config import YAKE_MAX_NGRAM, YAKE_TOP_N, RAKE_TOP_N

nltk.download("stopwords", quiet=True)

try:
    import yake
    YAKE_AVAILABLE = True
except ImportError:
    YAKE_AVAILABLE = False

try:
    from rake_nltk import Rake
    RAKE_AVAILABLE = True
except ImportError:
    RAKE_AVAILABLE = False

_KEYWORD_BLACKLIST: frozenset[str] = frozenset({
    "cid", "http", "https", "www",
    "true", "false", "null", "none",
    "def", "class", "import", "return", "const", "var", "let",
    "function", "async", "await", "new",
})

_GENERIC_SINGLE_WORDS: frozenset[str] = frozenset({
    "text", "document", "documents", "system", "systems", "method", "methods",
    "approach", "result", "results", "output", "outputs", "data", "input",
    "model", "models", "process", "processing", "task", "tasks", "paper",
    "study", "work", "using", "used", "widely", "reduce", "often", "may",
    "also", "well", "based", "way", "type", "value", "example", "case",
    "issue", "issues", "problem", "problems", "section", "content", "quality",
    "level", "step", "steps", "set", "part", "include", "included", "make",
    "use", "need", "provide", "improve", "apply", "require",
})

_CODE_IDENTIFIER: re.Pattern[str] = re.compile(r"^[a-z]+_[a-z]|[a-z][A-Z]|[a-z]+\(")

_STOP_WORDS: set[str] = set(stopwords.words("english"))


def _is_valid_keyword(kw: str) -> bool:
    kw = kw.strip().lower()
    if len(kw) < 3:
        return False
    if kw in _KEYWORD_BLACKLIST:
        return False
    if _CODE_IDENTIFIER.search(kw):
        return False
    if not any(c.isalpha() for c in kw):
        return False

    noise_chars = sum(1 for c in kw if c.isdigit() or c == "_")
    if noise_chars / max(len(kw), 1) > 0.33:
        return False

    words = kw.split()
    if len(words) == 1 and kw in _GENERIC_SINGLE_WORDS:
        return False
    if len(words) > 1:
        has_specific = any(
            w not in _GENERIC_SINGLE_WORDS and len(w) > 3 for w in words
        )
        if not has_specific:
            return False

    return True


def _deduplicate_keywords(keywords: list[str]) -> list[str]:
    accepted: list[str] = []
    for candidate in keywords:
        c = candidate.lower().strip()
        is_redundant = any(
            c in e or (e in c and len(c.split()) - len(e.split()) <= 1)
            for e in (ex.lower().strip() for ex in accepted)
        )
        if not is_redundant:
            accepted.append(candidate)
    return accepted


def extract_keywords(text: str) -> list[str]:
    """
    Extract domain-relevant keywords from text using YAKE and/or RAKE.
    Falls back to simple frequency counting when neither library is available.

    Returns:
        Deduplicated list of keyword strings (lower-cased).
    """
    keywords: list[str] = []
    if YAKE_AVAILABLE:
        keywords.extend(_yake_keywords(text))
    if RAKE_AVAILABLE:
        keywords.extend(_rake_keywords(text))
    if not keywords:
        keywords = _frequency_fallback(text)

    seen: set[str] = set()
    unique: list[str] = []
    for kw in keywords:
        kw_clean = kw.lower().strip()
        if kw_clean not in seen and _is_valid_keyword(kw_clean):
            seen.add(kw_clean)
            unique.append(kw_clean)

    return _deduplicate_keywords(unique)[:YAKE_TOP_N]


def _yake_keywords(text: str) -> list[str]:
    kw_extractor = yake.KeywordExtractor(
        lan="en", n=YAKE_MAX_NGRAM, dedupLim=0.75,
        top=YAKE_TOP_N * 3, features=None,
    )
    keywords_scores = kw_extractor.extract_keywords(text)
    keywords_scores.sort(key=lambda x: x[1])
    return [kw for kw, _ in keywords_scores]


def _rake_keywords(text: str) -> list[str]:
    rake = Rake()
    rake.extract_keywords_from_text(text)
    return rake.get_ranked_phrases()[:RAKE_TOP_N]


def _frequency_fallback(text: str) -> list[str]:
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    filtered = [
        w for w in words
        if w not in _STOP_WORDS and _is_valid_keyword(w)
    ]
    return [w for w, _ in Counter(filtered).most_common(YAKE_TOP_N)]
