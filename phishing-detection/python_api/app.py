from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pathlib import Path
import tempfile
import json
import subprocess
import joblib
import os

# ----------------------------
# Config: paths to your artifacts
# ----------------------------
# Email classifier artifacts (loaded once at startup)
VEC_PATH   = "python/vectorizer.joblib"
MODEL_PATH = "python/phishing_model.joblib"   # or "python/best_phishing_model.joblib"

# Existing helper scripts you already have
EXTRACT_SCRIPT = "python/extract_text.py"     # takes <filepath>, prints extracted text
PREDICT_SCRIPT = "python/predict_email.py"    # supports: --mode email <txtfile> | --mode url <url>

# ----------------------------
# Load email model once
# ----------------------------
vectorizer = joblib.load(VEC_PATH)
email_model = joblib.load(MODEL_PATH)

app = FastAPI()

# ----------------------------
# CORS: allow your Netlify site
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aiphishingdetector.netlify.app"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

# ----------------------------
# Helpers
# ----------------------------
def _run_subprocess(args: list[str], input_bytes: bytes | None = None, timeout: int = 30):
    """
    Run a short-lived subprocess (for your existing Python helpers).
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
    Returns a payload matching your old API keys.
    """
    X = vectorizer.transform([text])
    pred = int(email_model.predict(X)[0])
    label = "Phishing" if pred == 1 else "Safe"
    return {
        "text_prediction": label,
        "final_prediction": label
    }

def _predict_email_via_script(tmp_txt_path: str) -> dict:
    """
    If you prefer to keep parity with the old script for 'email' mode,
    you can switch to using predict_email.py here instead of in-process.
    Currently unused (we use in-process for memory/perf).
    """
    args = ["python", PREDICT_SCRIPT, "--mode", "email", tmp_txt_path]
    out, err, code = _run_subprocess(args)
    if code != 0:
        raise RuntimeError(f"predict_email.py failed: {err.strip()}")
    try:
        return json.loads(out.strip())
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from predict_email.py: {e}")

def _extract_text_with_script(file_path: str) -> str:
    """
    Reuse your existing extractor so PDF/DOCX etc. keep working.
    """
    args = ["python", EXTRACT_SCRIPT, file_path]
    out, err, code = _run_subprocess(args)
    if code != 0:
        raise RuntimeError(f"extract_text.py failed: {err.strip()}")
    return out.strip()

def _predict_url_with_script(url: str) -> dict:
    """
    Keep URL mode exactly as before (don’t lose functionality).
    """
    args = ["python", PREDICT_SCRIPT, "--mode", "url", url]
    out, err, code = _run_subprocess(args)
    if code != 0:
        raise RuntimeError(f"predict_email.py --mode url failed: {err.strip()}")
    try:
        return json.loads(out.strip())
    except Exception as e:
        raise RuntimeError(f"Invalid JSON from predict_email.py (url): {e}")

# ----------------------------
# Main endpoint
# ----------------------------
@app.post("/analyze")
async def analyze(
    emailContent: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    try:
        # 1) URL mode (keep old logic 1:1 via script)
        if url:
            url = url.strip()
            if not url:
                return {"status": "error", "message": "Empty URL"}
            url_result = _predict_url_with_script(url)
            # Ensure keys mirror old response
            if "final_prediction" not in url_result:
                # normalize if the script returns a different shape
                label = url_result.get("url_prediction") or url_result.get("prediction") or "Unknown"
                url_result = {"url_prediction": label, "final_prediction": label}
            return url_result

        # 2) File upload -> extract text via your script -> in-process email prediction
        if file is not None:
            # Save to a temp file
            suffix = Path(file.filename or "upload").suffix
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                data = await file.read()
                tmp.write(data)
                tmp_path = tmp.name

            try:
                extracted_text = _extract_text_with_script(tmp_path)
            finally:
                # clean the temp file
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

            if not extracted_text:
                return {"status": "error", "message": "No text could be extracted from file"}

            return _predict_email_text(extracted_text)

        # 3) Raw email text -> in-process email prediction
        if emailContent:
            return _predict_email_text(emailContent)

        return {"status": "error", "message": "No input provided"}

    except Exception as e:
        # unified error payload (keeps your old style)
        return {"status": "error", "message": str(e)}
