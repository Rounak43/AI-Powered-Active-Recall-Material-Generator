# =============================================================================
# services/redundancy.py — Redundancy removal from selected sentences
#
# After extractive selection, near-duplicate sentences are removed.
# Uses cosine similarity between TF-IDF vectors; keeps the higher-scored
# sentence from each redundant pair (candidates must be pre-sorted by score).
# =============================================================================

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from services.config import REDUNDANCY_THRESHOLD

# (sentence_text, score, original_index)
_Candidate = tuple[str, float, int]


def remove_redundant_sentences(
    candidates: list[_Candidate],
    threshold: float = REDUNDANCY_THRESHOLD,
) -> list[_Candidate]:
    """
    Remove near-duplicate sentences from the candidate list.

    Args:
        candidates: List of (sentence, score, original_index) tuples,
                    already sorted by score descending.
        threshold:  Cosine similarity at or above this → redundant (default 0.72).

    Returns:
        Filtered list of (sentence, score, original_index), still sorted
        by score descending.
    """
    if len(candidates) <= 1:
        return candidates

    selected: list[_Candidate] = []
    selected_texts: list[str] = []

    for candidate in candidates:
        sentence, _score, _idx = candidate
        if not selected or not _is_redundant_with(sentence, selected_texts, threshold):
            selected.append(candidate)
            selected_texts.append(sentence)

    return selected


def _is_redundant_with(
    sentence: str,
    existing: list[str],
    threshold: float,
) -> bool:
    """
    Return True if sentence is too similar to any sentence in existing.
    Uses TF-IDF cosine similarity; falls back to exact string match on error.
    """
    try:
        corpus = existing + [sentence]
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(corpus)
        similarities = cosine_similarity(matrix[-1], matrix[:-1]).flatten()
        return bool(any(sim >= threshold for sim in similarities))
    except Exception:
        sentence_lower = sentence.lower().strip()
        return any(sentence_lower == ex.lower().strip() for ex in existing)
