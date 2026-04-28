# =============================================================================
# services/abstractive.py — Optional abstractive refinement
# =============================================================================

def refine_abstractively(summary_text: str) -> tuple[str, bool]:
    """
    Refine extractive summary with abstractive transformation.
    Returns (refined_summary, was_applied)
    
    For now, returns the input unchanged with False flag.
    """
    try:
        from transformers import pipeline
        summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
        result = summarizer(summary_text, max_length=150, min_length=50, do_sample=False)
        refined = result[0]["summary_text"]
        return refined, True
    except Exception:
        # Fallback: return original summary unchanged
        return summary_text, False
