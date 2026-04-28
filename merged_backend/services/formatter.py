# =============================================================================
# services/formatter.py — Build the final API JSON response
# =============================================================================


def build_response(
    file_name: str,
    pipeline_result: dict,
    summary_mode: str,
    used_abstractive: bool,
    summary_text: str,
    notes: str = "",
) -> dict:
    """
    Assemble the final JSON response dictionary.
    """
    return {
        "success":                     True,
        "file_name":                   file_name,
        "document_type":               "academic",
        "summary_mode":                summary_mode,
        "used_abstractive_refinement": used_abstractive,
        "original_word_count":         pipeline_result.get("original_word_count", 0),
        "summary_word_count":          len(summary_text.split()),
        "compression_ratio":           round(
            len(summary_text.split()) / max(pipeline_result.get("original_word_count", 1), 1),
            4
        ),
        "summary":                     summary_text,
        "keywords":                    pipeline_result.get("keywords", []),
        "entities":                    pipeline_result.get("entities", {}),
        "top_sentences_count":         pipeline_result.get("selected_sentences", 0),
        "total_sentences_found":       pipeline_result.get("total_sentences", 0),
        "notes":                       notes or _auto_note(used_abstractive),
    }


def build_error_response(message: str, detail: str = "") -> dict:
    """Standard error response structure."""
    return {
        "success": False,
        "error":   message,
        "detail":  detail,
    }


def _auto_note(used_abstractive: bool) -> str:
    if used_abstractive:
        return (
            "Summary generated using Hybrid NLP pipeline: "
            "TF-IDF + Word Frequency + TextRank (PageRank) + Position + Keyword + NER scoring, "
            "followed by local transformer abstractive refinement."
        )
    return (
        "Summary generated using Hybrid Extractive NLP pipeline: "
        "TF-IDF + Word Frequency + TextRank (PageRank) + Position + Keyword + NER scoring. "
        "Redundant sentences removed via cosine similarity filtering."
    )