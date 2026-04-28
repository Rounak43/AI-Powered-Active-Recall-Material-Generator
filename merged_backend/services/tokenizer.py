# =============================================================================
# services/tokenizer.py — Sentence + word tokenisation and NLP preprocessing
#
# Uses NLTK for sentence splitting and spaCy for lemmatisation.
# =============================================================================

import re

import nltk
import spacy

from services.config import SPACY_MODEL, MIN_SENTENCE_WORDS, MAX_SENTENCE_WORDS

# ── One-time downloads ─────────────────────────────────────────────────────────
nltk.download("punkt",                      quiet=True)
nltk.download("punkt_tab",                  quiet=True)
nltk.download("stopwords",                  quiet=True)
nltk.download("averaged_perceptron_tagger", quiet=True)

from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords

# ── Lazy-loaded spaCy model ────────────────────────────────────────────────────
_nlp: spacy.language.Language | None = None


def get_nlp() -> spacy.language.Language:
    global _nlp
    if _nlp is None:
        try:
            _nlp = spacy.load(SPACY_MODEL)
        except OSError:
            raise RuntimeError(
                f"spaCy model '{SPACY_MODEL}' not found. "
                f"Run: python -m spacy download {SPACY_MODEL}"
            )
    return _nlp


STOPWORDS: frozenset[str] = frozenset(stopwords.words("english"))


def split_sentences(text: str) -> list[str]:
    """
    Split text into clean sentences using NLTK's sent_tokenize.

    Filters out sentences that are too short (fragments), too long
    (likely table rows), or mostly non-alphabetic noise.

    Returns:
        Original-case sentences — not lowercased.
    """
    filtered: list[str] = []
    for sent in sent_tokenize(text):
        sent = sent.strip()
        word_count = len(sent.split())

        if word_count < MIN_SENTENCE_WORDS:
            continue
        if word_count > MAX_SENTENCE_WORDS:
            continue

        alpha_ratio = sum(c.isalpha() for c in sent) / max(len(sent), 1)
        if alpha_ratio < 0.60:
            continue

        filtered.append(sent)

    return filtered


def preprocess_sentence(sentence: str) -> list[str]:
    """
    Preprocess a single sentence for NLP scoring.

    Steps: lowercase → spaCy tokenise → remove stop-words, punctuation,
    spaces, and very short tokens → lemmatise → keep alphabetic lemmas only.

    Returns:
        List of clean lemmatised tokens.
    """
    nlp = get_nlp()
    doc = nlp(sentence.lower())

    tokens: list[str] = []
    for token in doc:
        if token.is_stop or token.is_punct or token.is_space:
            continue
        if len(token.text) < 2:
            continue
        lemma = token.lemma_.strip()
        if lemma.isalpha() and lemma not in STOPWORDS:
            tokens.append(lemma)

    return tokens


def preprocess_all(sentences: list[str]) -> list[list[str]]:
    """
    Preprocess every sentence.

    Returns:
        List of token lists, index-aligned with the input sentences.
    """
    return [preprocess_sentence(s) for s in sentences]


def get_all_tokens(preprocessed: list[list[str]]) -> list[str]:
    """Flatten all preprocessed token lists into a single list."""
    return [token for sent_tokens in preprocessed for token in sent_tokens]
