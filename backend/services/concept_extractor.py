import spacy
from collections import Counter
import re

# Load spaCy model once
nlp = spacy.load("en_core_web_sm")

BAD_PHRASES = {
    "the system", "this system", "the project", "this project",
    "manual effort", "learning efficiency", "study fatigue",
    "high quality revision materials", "various computational tasks",
    "traditional systems", "special biological cell"
}

# Domain-specific priority keywords for your kind of project/docs
PRIORITY_TERMS = {
    "ai", "nlp", "ml", "ann", "cnn", "rnn", "lstm", "bert", "bart", "t5",
    "transformer", "transformers", "flask", "react", "spacy", "nltk",
    "pdf", "docx", "summarization", "summary", "flashcards", "quiz",
    "question generation", "active recall", "backend", "frontend",
    "neural network", "artificial neural network", "input layer",
    "hidden layer", "output layer", "activation function", "weights",
    "learning rate", "training", "inference", "api", "aws", "mlops"
}

GENERIC_SINGLE_WORDS = {
    "system", "step", "function", "output", "input", "process", "model",
    "text", "data", "learning", "layer", "network"
}

def normalize_phrase(text):
    text = text.lower().strip()
    text = re.sub(r'[^a-zA-Z0-9\s\-]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def is_valid_phrase(text):
    text = normalize_phrase(text)

    if not text or len(text) < 2:
        return False

    words = text.split()

    # Keep phrases of 1 to 3 words
    if len(words) > 3:
        return False

    if text in BAD_PHRASES:
        return False

    # Avoid very generic single words unless important
    if len(words) == 1 and text in GENERIC_SINGLE_WORDS and text not in PRIORITY_TERMS:
        return False

    # Avoid phrases starting or ending with stopwords
    stop_words = nlp.Defaults.stop_words
    if words[0] in stop_words or words[-1] in stop_words:
        return False

    return True

def extract_key_concepts(text, top_n=10):
    doc = nlp(text[:50000])  # safe limit for very long docs
    candidates = []

    # 1. Priority term boost (scan raw text)
    lowered_text = text.lower()
    for term in PRIORITY_TERMS:
        if term in lowered_text:
            candidates.extend([term] * 3)  # boost

    # 2. Named entities
    for ent in doc.ents:
        ent_text = normalize_phrase(ent.text)
        if is_valid_phrase(ent_text):
            candidates.append(ent_text)

    # 3. Noun chunks
    for chunk in doc.noun_chunks:
        chunk_text = normalize_phrase(chunk.text)

        # Remove leading determiners
        words = chunk_text.split()
        if words and words[0] in {"the", "a", "an", "this", "that"}:
            chunk_text = " ".join(words[1:])

        if is_valid_phrase(chunk_text):
            candidates.append(chunk_text)

    # 4. Important tokens (only if in priority terms)
    for token in doc:
        token_text = normalize_phrase(token.text)

        if token_text in PRIORITY_TERMS:
            candidates.append(token_text)

        # Uppercase abbreviations like ANN, NLP, AI
        if token.text.isupper() and len(token.text) >= 2:
            candidates.append(token.text.lower())

    # Count
    counts = Counter(candidates)

    # Rank with preference for multi-word meaningful phrases
    ranked = []
    for phrase, _ in counts.most_common():
        if phrase not in ranked:
            ranked.append(phrase)

    # Prefer multi-word concepts first, then singles
    multi_word = [p for p in ranked if len(p.split()) >= 2]
    single_word = [p for p in ranked if len(p.split()) == 1]

    final = multi_word + single_word

    return final[:top_n]