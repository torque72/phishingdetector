# phishing-detection/python_api/app.py
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import joblib, os

# ---- Load model ONCE at startup (adjust paths/names to your artifacts) ----
# Example: python/artifacts/vectorizer.pkl and python/artifacts/model.pkl
VEC_PATH   = "python/artifacts/vectorizer.pkl"
MODEL_PATH = "python/artifacts/model.pkl"
vectorizer = joblib.load(VEC_PATH)
model      = joblib.load(MODEL_PATH)

app = FastAPI()

# ---- CORS (put your real Netlify URL) ----
ALLOWED_ORIGINS = ["https://aiphishingdetector.netlify.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
async def analyze(
    emailContent: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    # Decide what text to analyze
    text = None
    if url:
        # TODO: If you had special URL processing before, call it here.
        # For now, just analyze the URL string itself or fetch the page.
        text = url
    elif file:
        # UploadFile is spooled to disk; read small files into memory here
        contents = await file.read()
        text = contents.decode(errors="ignore")
    elif emailContent:
        text = emailContent
    else:
        return {"status": "error", "message": "No input provided"}

    # Transform + predict
    X = vectorizer.transform([text])
    pred = model.predict(X)[0]
    label = "Phishing" if int(pred) == 1 else "Safe"

    return {
        "text_prediction": label,
        "final_prediction": label
    }

# If you want to run locally: uvicorn python_api.app:app --reload
