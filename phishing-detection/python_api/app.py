# phishing-detection/python_api/app.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pathlib import Path
import tempfile
import subprocess
import json
import joblib
import os

# ------------------------------------------------------------
# Paths (absolute, so it works no matter the working directory)
# ------------------------------------------------------------
# BASE_DIR = .../phishing-detection
BASE_DIR = Path(__file__).resolve().parent.parent

# Artifacts for EMAIL model
VEC_PATH   = BASE_DIR / "python" / "vectorizer.joblib"
MODEL_PATH = BASE_DIR / "python" / "phishing_model.joblib"   # or "best_phishing_model.joblib"

# Existing helper scripts you already have
EXTRACT_SCRIPT = BASE_DIR / "python" / "extract_text.py"     # CLI: python extract_text.py <filepath>
PREDICT_SCRIPT = BASE_DIR / "python" / "predict_email.py"    # CLI: python predict_email.py --mode email|url <arg>

# ------------------------------------------------------------
# Load email model/vectorizer ONCE (fast & memory-friendly)
# ------------------------------------------------------------
vectorizer = joblib.load(VEC_PATH)
email_model = joblib.load(MODEL_PATH)

app = FastAPI()

# ------------------------------------------------------------
# CORS: allow your Netlify frontend
# ------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aiphishingdetector.netlify.app"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def _run_subprocess(args: list[str], input_bytes: bytes | None = None, timeout: int = 30):
    """
    Run a short-lived subprocess (for your existing helper scripts).
    Returns (stdout_text, stderr_text, return_code).
    """
    proc = subprocess.Popen(
        args,
        stdin=subprocess.PIPE if input_bytes is not None else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    try:
        out, err = proc.communicate(input=input_bytes, timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        return "", "Subprocess timed out", -9
    return out.decode(errors="ignore"), err.decode(errors="ignore"), proc.returncode


def _predict_email_text(text: str) -> dict:
    """
    Use the in-process email pipeline: vectorizer + model.
    Mirrors your old response shape.
    """
    X = vectorizer.transform([text])
    pred = int(email_model.predict(X)[0])
    label = "Phishing" if pred == 1 else "Safe"
    return {
        "text_prediction": label,
        "final_prediction": label,
    }


def _extract_text_with_script(file_path: str) -> str:
    """
    Reuse your existing extractor so PDF/DOCX/etc. keep working.
    """
    args = ["python", str(EXTRACT_SCRIPT), file_path]
    out, err, code = _run_subprocess(args)
    if code != 0:
        raise RuntimeError(f"extract_text.py failed: {err.strip()}")
    return out.strip()


def _predict_url_with_script(url: str) -> dict:
    """
    Keep URL mode exactly as before via your predict_email.py --mode url.
    """
    args = ["python", str(PREDICT_SCRIPT), "--mode", "url", url]
    out, err, code = _run_subprocess(args)
    if code != 0:
        raise RuntimeError(f"predict_email.py --mode url failed: {err.strip()}")
    try:
        data = json.loads(out.strip())
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from predict_email.py (url): {e}")
    # Normalize keys if needed
    if "final_prediction" not in data:
        label = data.get("url_prediction") or data.get("prediction") or "Unknown"
        data = {"url_prediction": label, "final_prediction": label}
    return data


# ------------------------------------------------------------
# Main endpoint (email text, file upload, or URL)
# ------------------------------------------------------------
@app.post("/analyze")
async def analyze(
    emailContent: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        # 1) URL mode (keep old behavior via helper script)
        if url:
            url = url.strip()
            if not url:
                return {"status": "error", "message": "Empty URL"}
            return _predict_url_with_script(url)

        # 2) File upload -> extract text via your script -> in-process prediction
        if file is not None:
            suffix = Path(file.filename or "upload").suffix
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                data = await file.read()
                tmp.write(data)
                tmp_path = tmp.name

            try:
                extracted_text = _extract_text_with_script(tmp_path)
            finally:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

            if not extracted_text:
                return {"status": "error", "message": "No text could be extracted from file"}

            return _predict_email_text(extracted_text)

        # 3) Raw email text
        if emailContent:
            return _predict_email_text(emailContent)

        # No input
        return {"status": "error", "message": "No input provided"}

    except Exception as e:
        # unified error payload
        return {"status": "error", "message": str(e)}
