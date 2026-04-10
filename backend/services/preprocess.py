import re

def clean_text(text):
    """
    Clean extracted text for better summarization.
    """
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)  # remove weird unicode chars
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()

def chunk_text(text, max_words=250):
    """
    Split text into safe chunks for long documents.
    """
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words])
        chunks.append(chunk)

    return chunks