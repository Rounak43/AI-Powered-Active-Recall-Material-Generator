from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid

from services.extractor import extract_text_from_file
from services.preprocess import clean_text, chunk_text
from services.summarizer import summarize_chunks
from services.concept_extractor import extract_key_concepts

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "docx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "PDF/DOCX Active Recall Backend Running"})

# =========================
# 1) FILE UPLOAD SUMMARY
# =========================
@app.route("/api/summarize", methods=["POST"])
def summarize_file():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF and DOCX files are allowed"}), 400

        ext = file.filename.rsplit(".", 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(file_path)

        raw_text = extract_text_from_file(file_path)

        if not raw_text or len(raw_text.strip()) < 50:
            return jsonify({"error": "Could not extract enough text from the file"}), 400

        cleaned_text = clean_text(raw_text)
        chunks = chunk_text(cleaned_text, max_words=250)
        summary_result = summarize_chunks(chunks)
        key_concepts = extract_key_concepts(cleaned_text, top_n=10)

        return jsonify({
            "message": "File summarization successful",
            "fileType": ext,
            "extractedTextLength": len(cleaned_text),
            "chunkCount": len(chunks),
            "summary": summary_result["short_summary"],
            "detailedSummary": summary_result["detailed_summary"],
            "keyConcepts": key_concepts
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================
# 2) DIRECT TEXT SUMMARY
# =========================
@app.route("/api/summarize-text", methods=["POST"])
def summarize_text():
    try:
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({"error": "No text provided"}), 400

        raw_text = data["text"]

        if not raw_text or len(raw_text.strip()) < 50:
            return jsonify({"error": "Please enter at least 50 characters of text"}), 400

        cleaned_text = clean_text(raw_text)
        chunks = chunk_text(cleaned_text, max_words=250)
        summary_result = summarize_chunks(chunks)
        key_concepts = extract_key_concepts(cleaned_text, top_n=10)

        return jsonify({
            "message": "Text summarization successful",
            "inputType": "text",
            "textLength": len(cleaned_text),
            "chunkCount": len(chunks),
            "summary": summary_result["short_summary"],
            "detailedSummary": summary_result["detailed_summary"],
            "keyConcepts": key_concepts
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)