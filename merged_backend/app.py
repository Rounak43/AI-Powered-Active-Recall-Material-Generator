# =============================================================================
# app.py — Merged Backend: Academic Summarizer + Active Recall Generator
#
# Endpoints:
#   GET  /                    — health check
#   POST /api/summarize       — upload PDF/DOCX/TXT → get full summary
#   POST /api/summarize-text  — paste raw text → get summary
#   POST /api/flashcards      — upload file → get flashcards
#   POST /api/quiz            — upload file → get MCQ quiz
#   POST /api/full            — upload file → summary + flashcards + quiz
#
# Summarizer: 01's advanced hybrid NLP pipeline (TF-IDF + TextRank + NER)
# Flashcards: rule-based NLP (no API key needed), optional local transformer
# =============================================================================

import os
import uuid
import tempfile

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# ── Services: best summarizer from 01 ─────────────────────────────────────────
from services.extractor  import extract_text
from services.cleaner    import clean_text, is_text_valid
from services.extractive import run_extractive_pipeline
from services.abstractive import refine_abstractively
from services.exceptions import ExtractionError, PipelineError

# ── Services: flashcard generator from 02 (no API needed) ────────────────────
from services.flashcard_generator import (
    generate_flashcards,
    generate_quiz_questions,
)

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx"}
MAX_FILE_MB = 20


# ── Helpers ───────────────────────────────────────────────────────────────────

def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _save_and_extract(file) -> tuple[str, str, str]:
    """
    Save uploaded file to uploads/, extract and clean text.
    Returns (cleaned_text, file_ext, tmp_path).
    Raises ValueError if file is invalid or text is unreadable.
    """
    filename = file.filename or "upload"
    if not _allowed(filename):
        raise ValueError(f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = file.read()
    if len(contents) / (1024 * 1024) > MAX_FILE_MB:
        raise ValueError(f"File too large. Maximum: {MAX_FILE_MB} MB")

    ext = filename.rsplit(".", 1)[1].lower()
    tmp_name = f"{uuid.uuid4()}.{ext}"
    tmp_path = os.path.join(UPLOAD_FOLDER, tmp_name)

    with open(tmp_path, "wb") as f:
        f.write(contents)

    try:
        raw_text = extract_text(tmp_path)
    except ExtractionError as e:
        os.remove(tmp_path)
        raise ValueError(str(e))

    cleaned = clean_text(raw_text)

    if not is_text_valid(cleaned):
        os.remove(tmp_path)
        raise ValueError("Extracted text is too short or too noisy to process.")

    os.remove(tmp_path)   # clean up immediately after extraction
    return cleaned, ext, filename


def _run_summary(cleaned_text: str, mode: str, ratio: float | None, use_abstractive: bool) -> dict:
    """Run the full summarization pipeline and return result dict."""
    if mode not in {"short", "medium", "long"}:
        mode = "medium"

    try:
        result = run_extractive_pipeline(
            cleaned_text=cleaned_text,
            summary_mode=mode,
            summary_ratio=ratio,
        )
    except PipelineError as e:
        raise ValueError(str(e))

    summary_text = result["summary"]
    used_abstractive = False

    if use_abstractive:
        summary_text, used_abstractive = refine_abstractively(summary_text)

    return {
        "summary":                     summary_text,
        "detailedSummary":             result["summary"],
        "used_abstractive_refinement": used_abstractive,
        "keywords":                    result["keywords"],
        "entities":                    result["entities"],
        "original_word_count":         result["original_word_count"],
        "summary_word_count":          len(summary_text.split()),
        "compression_ratio":           round(
            len(summary_text.split()) / max(result["original_word_count"], 1), 4
        ),
        "top_sentences_count":         result["selected_sentences"],
        "total_sentences_found":       result["total_sentences"],
        "notes": (
            "Hybrid NLP: TF-IDF + Word Frequency + TextRank (PageRank) + "
            "Position + Keyword + NER scoring. Redundancy removed via cosine similarity."
        ),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Active Recall Material Generator API — running",
        "endpoints": {
            "POST /api/summarize":      "Upload PDF/DOCX/TXT → summary + keywords + entities",
            "POST /api/summarize-text": "Raw text input → summary",
            "POST /api/flashcards":     "Upload file → flashcards (no API key needed)",
            "POST /api/quiz":           "Upload file → MCQ quiz (no API key needed)",
            "POST /api/full":           "Upload file → summary + flashcards + quiz",
            "POST /api/full-text":      "Raw text input → summary + flashcards + quiz",
        }
    })


@app.route("/api/summarize", methods=["POST"])
def summarize_file():
    """
    Upload a PDF, DOCX, or TXT file and receive a structured academic summary.

    Form fields:
        file                       — required
        summary_mode               — 'short' | 'medium' | 'long'  (default: medium)
        summary_ratio              — float override e.g. 0.25
        use_abstractive_refinement — true/false (default: false)
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400
        file = request.files["file"]
        if not file.filename:
            return jsonify({"success": False, "error": "No file selected"}), 400

        mode     = request.form.get("summary_mode", "medium")
        ratio    = request.form.get("summary_ratio", None)
        ratio    = float(ratio) if ratio else None
        use_abs  = request.form.get("use_abstractive_refinement", "false").lower() == "true"

        cleaned, ext, fname = _save_and_extract(file)
        result = _run_summary(cleaned, mode, ratio, use_abs)

        return jsonify({
            "success":   True,
            "file_name": fname,
            "file_type": ext,
            **result,
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/summarize-text", methods=["POST"])
def summarize_text():
    """
    Summarize raw text input directly (no file upload).

    JSON body:
        text           — required
        summary_mode   — optional
        summary_ratio  — optional float
    """
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()

        if not text or len(text.split()) < 50:
            return jsonify({"success": False, "error": "Text too short (minimum 50 words)"}), 400

        mode  = data.get("summary_mode", "medium")
        ratio = data.get("summary_ratio", None)
        ratio = float(ratio) if ratio else None

        cleaned = clean_text(text)
        if not is_text_valid(cleaned):
            return jsonify({"success": False, "error": "Text is too noisy to summarize"}), 400

        result = _run_summary(cleaned, mode, ratio, False)

        return jsonify({"success": True, "file_name": "text_input", **result})

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/flashcards", methods=["POST"])
def generate_flashcards_endpoint():
    """
    Generate active recall flashcards from an uploaded document.
    No API key required.

    Form fields:
        file             — required (PDF/DOCX/TXT)
        count            — number of flashcards (default 10, max 20)
        use_transformer  — true/false; uses local QG model if installed (default false)
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files["file"]
        count = min(int(request.form.get("count", 10)), 20)
        use_transformer = request.form.get("use_transformer", "false").lower() == "true"

        cleaned, ext, fname = _save_and_extract(file)
        flashcards = generate_flashcards(cleaned, count=count, use_transformer=use_transformer)

        return jsonify({
            "success":    True,
            "file_name":  fname,
            "file_type":  ext,
            "count":      len(flashcards),
            "flashcards": flashcards,
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/quiz", methods=["POST"])
def generate_quiz_endpoint():
    """
    Generate multiple-choice quiz questions from an uploaded document.
    No API key required.

    Form fields:
        file   — required (PDF/DOCX/TXT)
        count  — number of questions (default 5, max 15)
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files["file"]
        count = min(int(request.form.get("count", 5)), 15)

        cleaned, ext, fname = _save_and_extract(file)
        questions = generate_quiz_questions(cleaned, count=count)

        return jsonify({
            "success":   True,
            "file_name": fname,
            "file_type": ext,
            "count":     len(questions),
            "questions": questions,
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/full", methods=["POST"])
def full_pipeline():
    """
    All-in-one endpoint: summary + flashcards + quiz from a single upload.

    Form fields:
        file             — required (PDF/DOCX/TXT)
        summary_mode     — optional (default: medium)
        flashcard_count  — optional (default 10)
        quiz_count       — optional (default 5)
        use_transformer  — optional (default false)
    """
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"}), 400

        file = request.files["file"]
        mode            = request.form.get("summary_mode", "medium")
        flashcard_count = min(int(request.form.get("flashcard_count", 10)), 20)
        quiz_count      = min(int(request.form.get("quiz_count", 5)), 15)
        use_transformer = request.form.get("use_transformer", "false").lower() == "true"

        cleaned, ext, fname = _save_and_extract(file)

        # Run all three pipelines on the same cleaned text
        summary_result = _run_summary(cleaned, mode, None, False)
        flashcards     = generate_flashcards(cleaned, count=flashcard_count, use_transformer=use_transformer)
        questions      = generate_quiz_questions(cleaned, count=quiz_count)

        return jsonify({
            "success":      True,
            "file_name":    fname,
            "file_type":    ext,
            **summary_result,
            "flashcards":   flashcards,
            "quizQuestions": questions,
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route("/api/full-text", methods=["POST"])
def full_text_pipeline():
    """
    All-in-one endpoint for raw text: summary + flashcards + quiz.

    JSON body:
        text             — required
        summary_mode     — optional (default: medium)
        flashcard_count  — optional (default 10)
        quiz_count       — optional (default 5)
        use_transformer  — optional (default false)
    """
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()

        if not text or len(text.split()) < 50:
            return jsonify({"success": False, "error": "Text too short (minimum 50 words)"}), 400

        mode            = data.get("summary_mode", "medium")
        flashcard_count = min(int(data.get("flashcard_count", 10)), 20)
        quiz_count      = min(int(data.get("quiz_count", 5)), 15)
        use_transformer = str(data.get("use_transformer", "false")).lower() == "true"

        cleaned = clean_text(text)
        if not is_text_valid(cleaned):
            return jsonify({"success": False, "error": "Text is too noisy to process"}), 400

        # Run all three pipelines
        summary_result = _run_summary(cleaned, mode, None, False)
        flashcards     = generate_flashcards(cleaned, count=flashcard_count, use_transformer=use_transformer)
        questions      = generate_quiz_questions(cleaned, count=quiz_count)

        return jsonify({
            "success":       True,
            "file_name":     "text_input",
            "inputType":     "text",
            **summary_result,
            "flashcards":    flashcards,
            "quizQuestions": questions,
        })

    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500



if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"Starting server on http://localhost:{port}")
    app.run(debug=debug, port=port)
