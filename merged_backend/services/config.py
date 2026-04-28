# =============================================================================
# config.py — All tunable constants for the merged backend
# =============================================================================

# ── Scoring weights (must sum to 1.0) ─────────────────────────────────────────
SCORING_WEIGHTS: dict[str, float] = {
    "tfidf":     0.30,
    "frequency": 0.20,
    "textrank":  0.20,
    "position":  0.10,
    "keyword":   0.10,
    "entity":    0.10,
}

SUMMARY_RATIOS: dict[str, float] = {
    "short":  0.20,
    "medium": 0.35,
    "long":   0.50,
}

SUMMARY_MIN_SENTENCES: int = 4
SUMMARY_MAX_SENTENCES: int = 15
REDUNDANCY_THRESHOLD: float = 0.72

YAKE_MAX_NGRAM: int = 2
YAKE_TOP_N: int = 12
RAKE_TOP_N: int = 8

TEXTRANK_DAMPING: float = 0.85
SIMILARITY_THRESHOLD: float = 0.10

ABSTRACTIVE_MODEL: str = "sshleifer/distilbart-cnn-12-6"
ABSTRACTIVE_MAX_TOKENS: int = 200
ABSTRACTIVE_MIN_TOKENS: int = 60

# Accepted file types
ALLOWED_EXTENSIONS: set[str] = {"pdf", "txt", "docx"}
MAX_FILE_SIZE_MB: int = 20

MIN_SENTENCE_WORDS: int = 6
MAX_SENTENCE_WORDS: int = 80
SPACY_MODEL: str = "en_core_web_sm"

LENGTH_SHORT_MIN: int = 8
LENGTH_SHORT_MAX: int = 12
LENGTH_IDEAL_MAX: int = 45
LENGTH_LONG_MAX: int = 60
LENGTH_SCORE_MIN_MULTIPLIER: float = 0.70
