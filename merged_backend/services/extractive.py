# =============================================================================
# services/extractive.py — Main extractive summarization orchestrator
# =============================================================================

from services.config import SUMMARY_RATIOS, SUMMARY_MIN_SENTENCES, SUMMARY_MAX_SENTENCES
from services.exceptions import ExtractionError, ValidationError, PipelineError
from services.tokenizer import split_sentences, preprocess_all
from services.keywords import extract_keywords
from services.entities import extract_entities, entity_score_per_sentence
from services.textrank import compute_textrank_scores
from services.scoring import compute_all_scores
from services.redundancy import remove_redundant_sentences


# ── Types ──────────────────────────────────────────────────────────────────────
# (sentence_text, score, original_index)
_Candidate = tuple[str, float, int]

PipelineResult = dict  # typed via TypedDict below for IDE support

from typing import TypedDict


class PipelineResult(TypedDict):
    summary: str
    keywords: list[str]
    entities: dict[str, list[str]]
    total_sentences: int
    selected_sentences: int
    original_word_count: int
    summary_word_count: int
    compression_ratio: float


# ── Internal helpers ───────────────────────────────────────────────────────────

def _compute_n_select(n_sentences: int, ratio: float) -> int:
    """
    Adaptive sentence count based on document size.

    Very short  (≤ 10)  → 2–3 sentences  (~25–30 %)
    Short       (11–20) → 4–6 sentences  (~30–35 %)
    Medium      (21–50) → 6–12 sentences (ratio-based)
    Long        (50+)   → ratio × n_sentences
    """
    base = int(n_sentences * ratio)

    if n_sentences <= 10:
        target = max(2, min(3, int(n_sentences * 0.30)))
    elif n_sentences <= 20:
        target = max(4, min(6, base))
    elif n_sentences <= 50:
        target = max(6, base)
    else:
        target = base

    return max(SUMMARY_MIN_SENTENCES, min(SUMMARY_MAX_SENTENCES, target))


def _finalise_sentence(sentence: str) -> str:
    """Ensure every selected sentence ends with terminal punctuation."""
    sentence = sentence.strip()
    if sentence and sentence[-1] not in ".!?":
        sentence += "."
    return sentence


# ── Public API ─────────────────────────────────────────────────────────────────

def run_extractive_pipeline(
    cleaned_text: str,
    summary_mode: str = "medium",
    summary_ratio: float | None = None,
) -> PipelineResult:
    """
    Run the full extractive summarization pipeline.

    Args:
        cleaned_text:  Pre-cleaned document text.
        summary_mode:  'short' | 'medium' | 'long' — controls compression ratio.
        summary_ratio: Optional explicit ratio that overrides summary_mode.

    Returns:
        PipelineResult dict with summary text, keywords, entities, and stats.

    Raises:
        PipelineError: If the document contains too few valid sentences.
    """
    sentences = split_sentences(cleaned_text)
    if len(sentences) < 3:
        raise PipelineError(
            "Document has fewer than 3 valid sentences after filtering. "
            "Ensure the file contains readable academic text."
        )

    preprocessed    = preprocess_all(sentences)
    keywords        = extract_keywords(cleaned_text)
    entities        = extract_entities(cleaned_text)
    ent_scores      = entity_score_per_sentence(sentences, entities)
    textrank_scores = compute_textrank_scores(sentences, preprocessed)

    final_scores = compute_all_scores(
        sentences=sentences,
        preprocessed=preprocessed,
        textrank_scores=textrank_scores,
        keywords=keywords,
        entity_scores=ent_scores,
    )

    ranked: list[_Candidate] = sorted(
        [(sentences[i], final_scores[i], i) for i in range(len(sentences))],
        key=lambda x: x[1],
        reverse=True,
    )

    ratio    = summary_ratio if summary_ratio is not None else SUMMARY_RATIOS.get(summary_mode, 0.35)
    n_select = _compute_n_select(len(sentences), ratio)

    top_candidates  = ranked[: n_select * 2]
    deduplicated    = remove_redundant_sentences(top_candidates)
    final_candidates = deduplicated[:n_select]

    # Restore original document order before joining
    final_candidates.sort(key=lambda x: x[2])

    # Post-processing: sentence clean-up lives here, not in the route handler
    summary_sentences = [_finalise_sentence(sent) for sent, _score, _idx in final_candidates]
    summary_text      = " ".join(summary_sentences)

    original_words = len(cleaned_text.split())
    summary_words  = len(summary_text.split())

    return PipelineResult(
        summary=summary_text,
        keywords=keywords,
        entities=entities,
        total_sentences=len(sentences),
        selected_sentences=len(final_candidates),
        original_word_count=original_words,
        summary_word_count=summary_words,
        compression_ratio=round(summary_words / original_words, 4) if original_words else 0.0,
    )
