import os
os.environ["USE_TF"] = "0"

import re
from collections import Counter
from transformers import pipeline

# Optional transformer short summarizer (used only for short summary enhancement)
try:
    transformer_summarizer = pipeline(
        "summarization",
        model="sshleifer/distilbart-cnn-12-6",
        framework="pt"
    )
except Exception as e:
    print(f"Transformer model load failed: {e}")
    transformer_summarizer = None


STOPWORDS = {
    "the", "is", "are", "was", "were", "a", "an", "and", "or", "of", "to", "in",
    "on", "for", "with", "as", "by", "that", "this", "it", "from", "at", "be",
    "can", "will", "into", "using", "used", "such", "than", "their", "its"
}

def sentence_tokenize(text):
    """
    Simple sentence splitter (stable, no extra nltk download needed).
    """
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]

def word_frequency(text):
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    words = [w for w in words if w not in STOPWORDS]
    return Counter(words)

def score_sentence(sentence, freq_map):
    words = re.findall(r'\b[a-zA-Z]{3,}\b', sentence.lower())
    if not words:
        return 0

    score = sum(freq_map.get(word, 0) for word in words)
    return score / len(words)

def extractive_summary_from_chunk(chunk, max_sentences=2):
    """
    Extractive summary: choose top scoring sentences.
    Much better for technical/academic docs than forcing full generative summarization.
    """
    sentences = sentence_tokenize(chunk)

    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    freq_map = word_frequency(chunk)

    scored = [(sentence, score_sentence(sentence, freq_map)) for sentence in sentences]
    scored_sorted = sorted(scored, key=lambda x: x[1], reverse=True)

    top_sentences = [s[0] for s in scored_sorted[:max_sentences]]

    # Preserve original order
    ordered = [s for s in sentences if s in top_sentences]

    return " ".join(ordered)

def transformer_shorten(text):
    """
    Optional short summary using transformer on already-clean extractive summary.
    """
    if not transformer_summarizer:
        return None

    safe_text = " ".join(text.split()[:250])

    if len(safe_text.split()) < 40:
        return safe_text

    try:
        result = transformer_summarizer(
            safe_text,
            max_length=120,
            min_length=40,
            do_sample=False,
            truncation=True
        )
        return result[0]["summary_text"].strip()
    except Exception as e:
        print(f"Transformer shortening failed: {e}")
        return None

def summarize_chunks(chunks):
    """
    Hybrid summarization:
    1. Use extractive summary for each chunk (stable)
    2. Join chunk summaries as detailed summary
    3. Optionally create a short summary using transformer
    """
    partial_summaries = []

    for chunk in chunks:
        chunk_summary = extractive_summary_from_chunk(chunk, max_sentences=2)
        if chunk_summary:
            partial_summaries.append(chunk_summary)

    detailed_summary = " ".join(partial_summaries).strip()

    # If very long, trim detailed summary to keep it usable
    detailed_words = detailed_summary.split()
    if len(detailed_words) > 500:
        detailed_summary = " ".join(detailed_words[:500]) + " ..."

    # Create short summary
    short_summary = transformer_shorten(detailed_summary)

    # Fallback if transformer unavailable or returns bad output
    if not short_summary:
        detailed_sentences = sentence_tokenize(detailed_summary)
        short_summary = " ".join(detailed_sentences[:3])

    return {
        "detailed_summary": detailed_summary,
        "short_summary": short_summary
    }