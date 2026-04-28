# =============================================================================
# services/entities.py — Named Entity Recognition using spaCy
# =============================================================================

import re
from collections import defaultdict

from services.tokenizer import get_nlp

RELEVANT_LABELS: frozenset[str] = frozenset(
    {"PERSON", "ORG", "GPE", "DATE", "LOC", "NORP", "WORK_OF_ART", "EVENT"}
)
def _is_valid_entity(text: str, label: str) -> bool:
    t = text.strip()
    if len(t) < 2:
        return False
    if _CODE_IN_ENTITY.search(t):
        return False

    # NEW: reject entities containing newlines (PDF extraction artifacts)
    if "\n" in t:
        return False

    # NEW: reject entities that are mostly non-alpha (math, symbols)
    alpha_ratio = sum(c.isalpha() for c in t) / max(len(t), 1)
    if alpha_ratio < 0.70:
        return False

    # NEW: reject single uppercase letter tokens (variables like Q, E, L)
    if len(t) <= 2 and t.isupper():
        return False

    if label in ("PERSON", "ORG") and t.lower() in _FALSE_ENTITY_WORDS:
        return False
    if label == "ORG" and len(t.split()) == 1 and t.islower() and len(t) < 5:
        return False
    if label == "PERSON":
        cap_ratio = sum(1 for c in t if c.isupper()) / max(len(t), 1)
        if cap_ratio < 0.1 and len(t.split()) < 2:
            return False
    if label == "DATE" and len(t.split()) == 1 and t.lower() in {
        "tomorrow", "today", "yesterday", "recently", "soon"
    }:
        return False
    if not any(c.isalpha() for c in t):
        return False
    return True
_FALSE_ENTITY_WORDS: frozenset[str] = frozenset({
    "creates", "displayed", "files", "returns", "handles", "reads",
    "saves", "validates", "enables", "allows", "runs", "sends",
    "shows", "parses", "uses", "builds", "converts", "detects",
    "checks", "extracts", "splits", "loads", "tomorrow", "today",
    "strong", "correct", "important", "useful", "direct", "recent",
    "modern", "traditional", "general", "specific", "final", "main",
    "ann", "bnn", "mlp", "relu", "sgd", "elu", "selu",
    "fig", "table", "figure", "section", "chapter",
    "network", "learning", "training", "algorithm",
    "linear", "model", "layer", "unit", "output", "input",
})

_CODE_IN_ENTITY: re.Pattern[str] = re.compile(
    r"[()=\[\]{}<>]|\.py\b|\bdef\b|\bclass\b|request\.|\bget\b"
)
_TRAILING_PAREN: re.Pattern[str] = re.compile(r"\s*\([^)]*$")
_STRIP_BRACKETS: re.Pattern[str] = re.compile(r"^[\s()\[\]]+|[\s()\[\]]+$")


def _clean_entity_text(text: str) -> str:
    """
    Remove dangling parentheses and bracket noise from entity spans.

    Examples:
        "Artificial Intelligence (AI"  →  "Artificial Intelligence"
        "(AI)"                          →  "AI"
    """
    text = _TRAILING_PAREN.sub("", text)
    text = _STRIP_BRACKETS.sub("", text)
    return text.strip()


def _is_valid_entity(text: str, label: str) -> bool:
    t = text.strip()
    if len(t) < 2:
        return False
    if _CODE_IN_ENTITY.search(t):
        return False
    if label in ("PERSON", "ORG") and t.lower() in _FALSE_ENTITY_WORDS:
        return False
    if label == "ORG" and len(t.split()) == 1 and t.islower() and len(t) < 5:
        return False
    if label == "PERSON":
        cap_ratio = sum(1 for c in t if c.isupper()) / max(len(t), 1)
        if cap_ratio < 0.1 and len(t.split()) < 2:
            return False
    if label == "DATE" and len(t.split()) == 1 and t.lower() in {
        "tomorrow", "today", "yesterday", "recently", "soon"
    }:
        return False
    if not any(c.isalpha() for c in t):
        return False
    return True


def extract_entities(text: str) -> dict[str, list[str]]:
    """
    Extract named entities from text using spaCy.

    Thread-safe: uses nlp() as a callable on a copy-like doc without
    mutating shared model state. max_length is passed via nlp.max_length
    only when strictly needed, guarded here per-call.

    Returns:
        Dict mapping entity label → sorted list of unique entity strings.
    """
    nlp = get_nlp()

    # Avoid mutating the singleton in a way that causes race conditions.
    # Instead, truncate the text if it exceeds the current limit.
    if len(text) > nlp.max_length:
        text = text[: nlp.max_length]

    doc = nlp(text)
    entities: dict[str, set[str]] = defaultdict(set)

    for ent in doc.ents:
        if ent.label_ in RELEVANT_LABELS:
            cleaned = _clean_entity_text(ent.text)
            if _is_valid_entity(cleaned, ent.label_):
                entities[ent.label_].add(cleaned)

    return {label: sorted(ents) for label, ents in entities.items()}


def get_entity_sentences(sentences: list[str]) -> list[set[str]]:
    """Return per-sentence sets of lower-cased entity strings."""
    nlp = get_nlp()
    result: list[set[str]] = []
    for sent in sentences:
        doc = nlp(sent)
        ents: set[str] = set()
        for ent in doc.ents:
            if ent.label_ in RELEVANT_LABELS:
                cleaned = _clean_entity_text(ent.text)
                if _is_valid_entity(cleaned, ent.label_):
                    ents.add(cleaned.lower())
        result.append(ents)
    return result


def entity_score_per_sentence(
    sentences: list[str],
    all_entities: dict[str, list[str]],
) -> list[float]:
    """
    Score each sentence by how many document-level entities it contains.

    Returns:
        Normalised list of floats in [0.0, 1.0].
    """
    all_ent_set = {e.lower() for ents in all_entities.values() for e in ents}
    if not all_ent_set:
        return [0.0] * len(sentences)

    sentence_ents = get_entity_sentences(sentences)
    raw_scores    = [len(ent_set & all_ent_set) for ent_set in sentence_ents]
    max_score     = max(raw_scores) if max(raw_scores) > 0 else 1
    return [s / max_score for s in raw_scores]
