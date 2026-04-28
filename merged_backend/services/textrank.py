# =============================================================================
# services/textrank.py — TextRank / PageRank based sentence ranking
#
# Algorithm:
#   1. Vectorise sentences with TF-IDF.
#   2. Compute pairwise cosine similarity (n × n matrix).
#   3. Build a weighted graph: nodes = sentences, edges = similarity.
#   4. Apply NetworkX PageRank.
#   5. Normalise scores to [0, 1].
# =============================================================================

import numpy as np
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from services.config import TEXTRANK_DAMPING, SIMILARITY_THRESHOLD


def compute_textrank_scores(
    sentences: list[str],
    preprocessed: list[list[str]],
) -> list[float]:
    """
    Compute TextRank (PageRank on similarity graph) scores per sentence.

    Args:
        sentences:    Original sentence strings (used for TF-IDF vectorisation).
        preprocessed: Token lists (used as Jaccard fallback for very short docs).

    Returns:
        Normalised scores in [0.0, 1.0], index-aligned with sentences.
    """
    n = len(sentences)
    if n < 2:
        return [1.0] * n

    tfidf_matrix = _build_tfidf_matrix(sentences)
    if tfidf_matrix is None:
        return _jaccard_textrank(preprocessed)

    sim_matrix = cosine_similarity(tfidf_matrix)
    np.fill_diagonal(sim_matrix, 0.0)   # remove self-loops

    graph = nx.from_numpy_array(
        np.where(sim_matrix >= SIMILARITY_THRESHOLD, sim_matrix, 0.0)
    )

    try:
        scores = nx.pagerank(
            graph,
            alpha=TEXTRANK_DAMPING,
            max_iter=200,
            tol=1e-5,
            weight="weight",
        )
    except nx.PowerIterationFailedConvergence:
        scores = nx.degree_centrality(graph)

    raw_scores = [scores.get(i, 0.0) for i in range(n)]
    return _normalize(raw_scores)


def _build_tfidf_matrix(sentences: list[str]):
    """Return a TF-IDF sparse matrix, or None if vectorisation fails."""
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
        )
        return vectorizer.fit_transform(sentences)
    except Exception:
        return None


def _jaccard_textrank(preprocessed: list[list[str]]) -> list[float]:
    """
    Fallback TextRank using Jaccard similarity between token sets.
    Used when TF-IDF vectorisation fails (very short or sparse documents).
    """
    n = len(preprocessed)
    sets = [set(tokens) for tokens in preprocessed]
    sim_matrix = np.zeros((n, n))

    for i in range(n):
        for j in range(n):
            if i != j:
                union = sets[i] | sets[j]
                if union:
                    sim_matrix[i][j] = len(sets[i] & sets[j]) / len(union)

    graph = nx.from_numpy_array(sim_matrix)
    try:
        scores = nx.pagerank(graph, alpha=TEXTRANK_DAMPING, max_iter=200, weight="weight")
    except Exception:
        scores = {i: 1.0 / n for i in range(n)}

    return _normalize([scores.get(i, 0.0) for i in range(n)])


def _normalize(scores: list[float]) -> list[float]:
    max_s = max(scores) if scores else 1.0
    if max_s == 0.0:
        return [0.0] * len(scores)
    return [s / max_s for s in scores]
