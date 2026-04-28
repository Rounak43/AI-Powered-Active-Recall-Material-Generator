# =============================================================================
# services/scoring.py — Hybrid multi-signal sentence scoring engine
# =============================================================================

from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer

from services.config import (
    SCORING_WEIGHTS,
    LENGTH_SHORT_MIN,
    LENGTH_SHORT_MAX,
    LENGTH_IDEAL_MAX,
    LENGTH_LONG_MAX,
    LENGTH_SCORE_MIN_MULTIPLIER,
)


def compute_all_scores(
    sentences: list[str],
    preprocessed: list[list[str]],
    textrank_scores: list[float],
    keywords: list[str],
    entity_scores: list[float],
) -> list[float]:
    """
    Combine all scoring signals into a single final score per sentence.

    Args:
        sentences:       Original sentence strings.
        preprocessed:    Token lists (lemmatised, stop-words removed).
        textrank_scores: PageRank-based scores, index-aligned with sentences.
        keywords:        Extracted keyword strings from the full document.
        entity_scores:   Per-sentence NER density scores.

    Returns:
        List of floats, index-aligned with sentences.
    """
    n = len(sentences)
    if n == 0:
        return []

    tfidf_s = _normalize(_tfidf_scores(sentences))
    freq_s  = _normalize(_frequency_scores(preprocessed))
    pos_s   = _position_scores(n)
    kw_s    = _keyword_scores(preprocessed, keywords)
    ent_s   = entity_scores if entity_scores else [0.0] * n
    tr_s    = textrank_scores if textrank_scores else [0.0] * n
    len_s   = _length_scores(sentences)

    w = SCORING_WEIGHTS
    final_scores: list[float] = []
    for i in range(n):
        score = (
            w["tfidf"]     * tfidf_s[i] +
            w["frequency"] * freq_s[i]  +
            w["textrank"]  * tr_s[i]    +
            w["position"]  * pos_s[i]   +
            w["keyword"]   * kw_s[i]    +
            w["entity"]    * ent_s[i]
        ) * len_s[i]
        final_scores.append(round(score, 6))

    return final_scores


def _tfidf_scores(sentences: list[str]) -> list[float]:
    if len(sentences) < 2:
        return [1.0] * len(sentences)
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform(sentences)
        return matrix.mean(axis=1).A1.tolist()
    except Exception:
        return [0.0] * len(sentences)


def _frequency_scores(preprocessed: list[list[str]]) -> list[float]:
    all_words = [token for sent in preprocessed for token in sent]
    freq = Counter(all_words)
    max_freq = max(freq.values()) if freq else 1
    norm_freq = {w: f / max_freq for w, f in freq.items()}
    scores: list[float] = []
    for tokens in preprocessed:
        if not tokens:
            scores.append(0.0)
        else:
            scores.append(sum(norm_freq.get(t, 0) for t in tokens) / len(tokens))
    return scores


def _position_scores(n: int) -> list[float]:
    """
    Reward introduction (≤10%) and conclusion (>85%) sentences with a
    score of 1.0. Body sentences receive lower scores.
    """
    scores: list[float] = []
    for i in range(n):
        ratio = i / max(n - 1, 1)
        if ratio <= 0.10:
            score = 1.00   # Introduction
        elif ratio <= 0.25:
            score = 0.80
        elif ratio <= 0.70:
            score = 0.50   # Body
        elif ratio <= 0.85:
            score = 0.75
        else:
            score = 1.00   # Conclusion
        scores.append(score)
    return scores


def _keyword_scores(preprocessed: list[list[str]], keywords: list[str]) -> list[float]:
    """
    Token-level keyword matching — splits multi-word keywords so that any
    sentence containing any constituent word scores positively.
    """
    kw_tokens: set[str] = set()
    for kw in keywords:
        for word in kw.lower().split():
            if len(word) > 3:
                kw_tokens.add(word)

    if not kw_tokens:
        return [0.0] * len(preprocessed)

    scores: list[float] = []
    for tokens in preprocessed:
        overlap = len(set(tokens) & kw_tokens)
        scores.append(overlap / len(kw_tokens))

    return _normalize(scores)


def _length_scores(sentences: list[str]) -> list[float]:
    """
    Return a multiplier based on sentence word count using the breakpoints
    defined in config.py.  The minimum multiplier (LENGTH_SCORE_MIN_MULTIPLIER)
    prevents good short sentences from being fully suppressed.
    """
    scores: list[float] = []
    for sent in sentences:
        wc = len(sent.split())
        if wc < LENGTH_SHORT_MIN:
            raw = 0.25
        elif wc < LENGTH_SHORT_MAX:
            raw = 0.65
        elif wc <= LENGTH_IDEAL_MAX:
            raw = 1.00
        elif wc <= LENGTH_LONG_MAX:
            raw = 0.80
        else:
            raw = 0.55
        # Clamp so even the weakest sentence retains some influence
        scores.append(max(raw, LENGTH_SCORE_MIN_MULTIPLIER))
    return scores


def _normalize(scores: list[float]) -> list[float]:
    max_s = max(scores) if scores else 1
    if max_s == 0:
        return [0.0] * len(scores)
    return [s / max_s for s in scores]
