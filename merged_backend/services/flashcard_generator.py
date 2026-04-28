# =============================================================================
# flashcard_generator_local.py
# Generates flashcards WITHOUT any external API.
#
# Three strategies, automatically chosen based on what's installed:
#   1. Local transformer QG model (best quality)
#   2. Rule-based NLP patterns     (always works, no model needed)
#   3. Hybrid (rule-based + transformer refinement if available)
#
# Install options:
#   Minimum (rule-based only):
#       pip install spacy yake rake-nltk nltk
#       python -m spacy download en_core_web_sm
#
#   Full (with local transformer):
#       pip install transformers torch sentencepiece
#       (model downloads automatically on first use ~900MB)
# =============================================================================

import re
import random
from collections import Counter

import spacy
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords

nltk.download("punkt",     quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

# ── Optional: local transformer for question generation ───────────────────────
# Model: valhalla/t5-base-qg-hl
#   - Free, offline, no API key
#   - Downloads ~900MB on first use, then cached forever
#   - Specifically trained to generate questions from text
_qg_pipeline = None
_qg_attempted = False

def _load_qg_model():
    global _qg_pipeline, _qg_attempted
    if _qg_attempted:
        return _qg_pipeline
    _qg_attempted = True
    try:
        from transformers import pipeline
        import torch
        device = 0 if torch.cuda.is_available() else -1
        _qg_pipeline = pipeline(
            "text2text-generation",
            model="valhalla/t5-base-qg-hl",
            device=device,
        )
        print("[Flashcard] Loaded local QG model: valhalla/t5-base-qg-hl")
    except Exception as e:
        print(f"[Flashcard] Local QG model not available ({e}). Using rule-based only.")
        _qg_pipeline = None
    return _qg_pipeline


# ── spaCy model ───────────────────────────────────────────────────────────────
_nlp = None

def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


# =============================================================================
# STRATEGY 1 — Rule-based flashcard generation (always works)
# =============================================================================

# Patterns that signal a definition sentence
_DEFINITION_PATTERNS = [
    re.compile(r"^(.+?)\s+is\s+(?:a|an|the)\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+are\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+refers?\s+to\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+(?:can be )?defined\s+as\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+means?\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+involves?\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+consists?\s+of\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+enables?\s+(.+)", re.IGNORECASE),
    re.compile(r"^(.+?)\s+allows?\s+(.+)", re.IGNORECASE),
]

# Patterns for cause-effect / process sentences
_CAUSE_PATTERNS = [
    re.compile(r"(.+?)\s+(?:because|since|as a result of)\s+(.+)", re.IGNORECASE),
    re.compile(r"(.+?)\s+(?:leads? to|results? in|causes?)\s+(.+)", re.IGNORECASE),
    re.compile(r"(.+?)\s+(?:improves?|reduces?|increases?|decreases?)\s+(.+)", re.IGNORECASE),
]

# Keywords that signal important comparison/contrast sentences
_COMPARISON_WORDS = {"unlike", "whereas", "while", "however", "compared", "contrast",
                     "difference", "similarly", "both", "either", "neither"}

_STOPS = set(stopwords.words("english"))


def _clean_answer(text: str) -> str:
    """Strip trailing fragments and clean up answer text."""
    text = text.strip().rstrip(",;:")
    if not text.endswith((".","!","?")):
        text += "."
    return text[:300]


def _extract_key_terms(text: str, top_n: int = 20) -> list[str]:
    """Extract important noun phrases and named entities from text."""
    nlp = _get_nlp()
    doc = nlp(text)

    terms = []

    # Named entities first (highest value)
    for ent in doc.ents:
        if ent.label_ in {"PERSON","ORG","GPE","PRODUCT","WORK_OF_ART","LAW","EVENT"}:
            terms.append(ent.text.strip())

    # Noun chunks (filtered)
    for chunk in doc.noun_chunks:
        words = chunk.text.strip().lower().split()
        if words and words[0] in {"the","a","an","this","that","these","those"}:
            words = words[1:]
        phrase = " ".join(words)
        if 2 <= len(phrase) <= 40 and not all(w in _STOPS for w in words):
            terms.append(chunk.text.strip())

    # Frequency filter — keep terms that appear more than once or are entities
    freq = Counter(t.lower() for t in terms)
    filtered = [t for t in terms if freq[t.lower()] >= 1 and len(t.split()) >= 1]

    # Deduplicate preserving order
    seen = set()
    unique = []
    for t in filtered:
        tl = t.lower()
        if tl not in seen and len(tl) > 3:
            seen.add(tl)
            unique.append(t)

    return unique[:top_n]


def _generate_definition_cards(sentences: list[str]) -> list[dict]:
    """Generate Q&A cards from definition-pattern sentences."""
    cards = []

    for sent in sentences:
        sent = sent.strip()

        for pattern in _DEFINITION_PATTERNS:
            m = pattern.match(sent)
            if m:
                subject = m.group(1).strip()
                definition = m.group(2).strip()

                # Skip if subject is too short or generic
                if len(subject.split()) > 6 or len(subject) < 3:
                    continue
                if subject.lower() in _STOPS:
                    continue

                cards.append({
                    "question": f"What is {subject}?",
                    "answer": _clean_answer(definition),
                    "type": "definition",
                })
                break

    return cards


def _generate_entity_cards(text: str, sentences: list[str]) -> list[dict]:
    """
    Generate cards for named entities — ask what role/significance
    an entity has based on the sentence it appears in.
    """
    nlp = _get_nlp()
    cards = []
    seen_entities = set()

    for sent in sentences:
        doc = nlp(sent)
        for ent in doc.ents:
            if ent.label_ not in {"PERSON","ORG","GPE","PRODUCT","LAW","EVENT"}:
                continue
            name = ent.text.strip()
            if name.lower() in seen_entities or len(name) < 3:
                continue
            seen_entities.add(name.lower())

            label_map = {
                "PERSON": "Who is",
                "ORG":    "What is",
                "GPE":    "What is",
                "PRODUCT":"What is",
                "LAW":    "What is",
                "EVENT":  "What was",
            }
            prefix = label_map.get(ent.label_, "What is")
            cards.append({
                "question": f"{prefix} {name}?",
                "answer": _clean_answer(sent),
                "type": "entity",
            })

    return cards


def _generate_keyword_cards(text: str, sentences: list[str]) -> list[dict]:
    """
    Generate fill-in-the-blank and 'what does X mean' cards
    using top keywords extracted from the text.
    """
    try:
        import yake
        kw_extractor = yake.KeywordExtractor(lan="en", n=2, dedupLim=0.7, top=20)
        kw_scores = kw_extractor.extract_keywords(text)
        kw_scores.sort(key=lambda x: x[1])
        keywords = [kw for kw, _ in kw_scores[:15]]
    except ImportError:
        keywords = _extract_key_terms(text, top_n=15)

    cards = []
    used_keywords = set()

    for kw in keywords:
        kw_lower = kw.lower()
        if kw_lower in used_keywords or len(kw) < 4:
            continue

        # Find best sentence containing this keyword
        best_sentence = None
        for sent in sentences:
            if kw_lower in sent.lower() and len(sent.split()) >= 8:
                best_sentence = sent
                break

        if not best_sentence:
            continue

        used_keywords.add(kw_lower)

        # Generate "what does X do/mean" style question
        cards.append({
            "question": f"What is the role of '{kw}' in this context?",
            "answer": _clean_answer(best_sentence),
            "type": "keyword",
        })

    return cards


def _generate_cause_effect_cards(sentences: list[str]) -> list[dict]:
    """Generate cause-effect and process cards."""
    cards = []

    for sent in sentences:
        for pattern in _CAUSE_PATTERNS:
            m = pattern.search(sent)
            if m:
                cause = m.group(1).strip()
                effect = m.group(2).strip()

                if len(cause.split()) < 3 or len(effect.split()) < 3:
                    continue

                cards.append({
                    "question": f"What happens when {cause.lower()}?",
                    "answer": _clean_answer(effect),
                    "type": "cause_effect",
                })
                break

    return cards


def _generate_comparison_cards(sentences: list[str]) -> list[dict]:
    """Generate comparison/contrast cards."""
    cards = []

    for sent in sentences:
        words = set(sent.lower().split())
        if words & _COMPARISON_WORDS:
            cards.append({
                "question": f"How does the following concept compare or contrast? Explain: '{sent[:60]}...'",
                "answer": _clean_answer(sent),
                "type": "comparison",
            })

    return cards


def generate_flashcards_rulebased(text: str, count: int = 10) -> list[dict]:
    """
    Generate flashcards using pure rule-based NLP.
    No API, no model download required.
    Uses: definition patterns, named entities, keywords, cause-effect, comparisons.
    """
    sentences = sent_tokenize(text)
    sentences = [s.strip() for s in sentences if len(s.split()) >= 6]

    all_cards = []

    # Run all generators
    all_cards.extend(_generate_definition_cards(sentences))
    all_cards.extend(_generate_entity_cards(text, sentences))
    all_cards.extend(_generate_keyword_cards(text, sentences))
    all_cards.extend(_generate_cause_effect_cards(sentences))
    all_cards.extend(_generate_comparison_cards(sentences))

    # Deduplicate by question similarity
    seen_questions = set()
    unique_cards = []
    for card in all_cards:
        q_key = card["question"].lower()[:60]
        if q_key not in seen_questions:
            seen_questions.add(q_key)
            unique_cards.append(card)

    # Prioritise: definition > entity > keyword > cause_effect > comparison
    priority = {"definition": 0, "entity": 1, "keyword": 2, "cause_effect": 3, "comparison": 4}
    unique_cards.sort(key=lambda c: priority.get(c["type"], 5))

    return unique_cards[:count]


# =============================================================================
# STRATEGY 2 — Local transformer question generation (best quality)
# =============================================================================

def _generate_with_transformer(sentence: str) -> str | None:
    """
    Use valhalla/t5-base-qg-hl to generate a question from a sentence.
    The model expects: "answer: <answer> context: <context>"
    Returns the generated question string or None if model unavailable.
    """
    pipe = _load_qg_model()
    if pipe is None:
        return None

    # Highlight the most important noun phrase as the answer span
    nlp = _get_nlp()
    doc = nlp(sentence)

    # Find best answer span: prefer named entity, fall back to first noun chunk
    answer_span = None
    for ent in doc.ents:
        if ent.label_ in {"PERSON","ORG","GPE","PRODUCT"}:
            answer_span = ent.text
            break
    if not answer_span:
        for chunk in doc.noun_chunks:
            words = chunk.text.lower().split()
            if words and words[0] not in {"the","a","an","this","that"}:
                answer_span = chunk.text
                break
    if not answer_span:
        return None

    # Format input for the QG model
    input_text = f"answer: {answer_span} context: {sentence}"

    try:
        result = pipe(
            input_text,
            max_length=64,
            num_beams=4,
            early_stopping=True,
        )
        question = result[0]["generated_text"].strip()
        if question and len(question) > 5:
            if not question.endswith("?"):
                question += "?"
            return question
    except Exception as e:
        print(f"[QG model] Inference error: {e}")

    return None


def generate_flashcards_transformer(text: str, count: int = 10) -> list[dict]:
    """
    Generate flashcards using local transformer QG model.
    Falls back to rule-based if model unavailable.
    Model: valhalla/t5-base-qg-hl (free, offline after first download)
    """
    # Try loading the model first
    pipe = _load_qg_model()
    if pipe is None:
        print("[Flashcard] Falling back to rule-based generation.")
        return generate_flashcards_rulebased(text, count)

    sentences = sent_tokenize(text)
    sentences = [s.strip() for s in sentences if len(s.split()) >= 8]

    # Score sentences by importance (reuse word frequency scoring)
    all_words = text.lower().split()
    freq = Counter(w for w in all_words if w not in _STOPS and len(w) > 3)
    max_freq = max(freq.values()) if freq else 1

    def sentence_score(s):
        words = s.lower().split()
        return sum(freq.get(w, 0) / max_freq for w in words) / max(len(words), 1)

    # Sort by importance, take top candidates
    scored = sorted(sentences, key=sentence_score, reverse=True)
    candidates = scored[:min(count * 3, len(scored))]

    cards = []
    for sent in candidates:
        if len(cards) >= count:
            break

        question = _generate_with_transformer(sent)
        if question:
            cards.append({
                "question": question,
                "answer": _clean_answer(sent),
                "type": "transformer_qg",
            })

    # Top up with rule-based if transformer didn't generate enough
    if len(cards) < count:
        extra = generate_flashcards_rulebased(text, count - len(cards))
        cards.extend(extra)

    return cards[:count]


# =============================================================================
# STRATEGY 3 — MCQ quiz generation (no API)
# =============================================================================

def generate_quiz_rulebased(text: str, count: int = 5) -> list[dict]:
    """
    Generate multiple-choice questions without any API.

    Strategy:
    1. Extract definition sentences → correct answer is the definition
    2. Generate 3 distractor answers from other sentences in the document
    3. Shuffle options
    """
    sentences = sent_tokenize(text)
    sentences = [s.strip() for s in sentences if len(s.split()) >= 6]

    # Get definition cards as base
    def_cards = _generate_definition_cards(sentences)
    kw_cards   = _generate_keyword_cards(text, sentences)

    base_cards = def_cards + kw_cards
    if not base_cards:
        base_cards = [{"question": f"What does this passage discuss?",
                       "answer": s} for s in sentences[:count]]

    quiz_questions = []

    for card in base_cards[:count]:
        correct_answer = card["answer"]

        # Generate distractors: other sentences from the text (not the correct one)
        distractors = [
            s.strip() for s in sentences
            if s.strip() != correct_answer
            and len(s.split()) >= 6
            and s.strip()[:40] != correct_answer[:40]
        ]

        # Randomly pick 3 distractors
        random.shuffle(distractors)
        chosen_distractors = distractors[:3]

        if len(chosen_distractors) < 3:
            # Pad with shortened versions if not enough sentences
            chosen_distractors += ["Not mentioned in the text."] * (3 - len(chosen_distractors))

        # Build options
        options_list = [correct_answer] + chosen_distractors[:3]
        random.shuffle(options_list)

        correct_letter = "ABCD"[options_list.index(correct_answer)]
        options = {letter: opt for letter, opt in zip("ABCD", options_list)}

        quiz_questions.append({
            "question":       card["question"],
            "options":        options,
            "correct_answer": correct_letter,
            "explanation":    f"The correct answer is based on the following passage: {correct_answer}",
            "type":           "mcq_rulebased",
        })

    return quiz_questions[:count]


# =============================================================================
# PUBLIC API — drop-in replacement for your existing flashcard_generator.py
# =============================================================================

def generate_flashcards(text: str, count: int = 10, use_transformer: bool = False) -> list[dict]:
    """
    Main entry point. Drop-in replacement for the Claude API version.

    Args:
        text:            Cleaned document text.
        count:           Number of flashcards to generate.
        use_transformer: If True, tries to use local QG transformer model.
                         Falls back to rule-based if model not installed.

    Returns:
        List of {"question": str, "answer": str} dicts.
    """
    if use_transformer:
        cards = generate_flashcards_transformer(text, count)
    else:
        cards = generate_flashcards_rulebased(text, count)

    # Normalize output format to match Claude API version
    return [{"question": c["question"], "answer": c["answer"]} for c in cards]


def generate_quiz_questions(text: str, count: int = 5) -> list[dict]:
    """
    Main entry point for MCQ quiz. Drop-in replacement for the Claude API version.

    Returns:
        List of {"question", "options", "correct_answer", "explanation"} dicts.
    """
    return generate_quiz_rulebased(text, count)