import sys
import json
import os
import joblib
import re
import pandas as pd

script_dir = os.path.dirname(os.path.abspath(__file__))

# Load models
text_model_path = os.path.join(script_dir, 'svm_phishing_model.joblib')
text_vectorizer_path = os.path.join(script_dir, 'vectorizer.joblib')
url_model_path = os.path.join(script_dir, 'url_phishing_model.joblib')
url_scaler_path = os.path.join(script_dir, 'url_scaler.joblib')

try:
    text_model = joblib.load(text_model_path)
    text_vectorizer = joblib.load(text_vectorizer_path)
    url_model = joblib.load(url_model_path)
    url_scaler = joblib.load(url_scaler_path)
except Exception as e:
    print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
    sys.exit(1)

url_pattern = re.compile(r'https?://\S+|www\.\S+')

def preprocess_email_text(text):
    urls = url_pattern.findall(text)
    text = url_pattern.sub(" linkurl ", text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower(), urls

def preprocess_url(url):
    return [
        int(bool(re.search(r'(\d{1,3}\.){3}\d{1,3}', url))),  # IP presence
        len(url),
        url.count('.'),
        int('https' in url),
        len(re.findall(r'\W', url)),
        sum(s in url for s in ['login', 'verify', 'account', 'secure', 'banking', 'confirm'])
    ]

def predict(email_content):
    try:
        email_content, urls = preprocess_email_text(email_content)
        email_vector = text_vectorizer.transform([email_content])
        text_prediction = text_model.predict(email_vector)[0]

        url_prediction = False
        if urls:
            url_features = [preprocess_url(url) for url in urls]
            df_url_features = pd.DataFrame(url_features, columns=['has_ip', 'length', 'subdomains', 'https', 'special_chars', 'suspicious_strings'])
            url_features_scaled = url_scaler.transform(df_url_features)
            url_predictions = url_model.predict(url_features_scaled)
            url_prediction = any(pred == 1 for pred in url_predictions)

        response = {
            "text_prediction": "Phishing" if text_prediction == 1 else "Safe",
            "url_prediction": "Phishing" if url_prediction else "Safe",
            "final_prediction": "Phishing" if text_prediction == 1 or url_prediction else "Safe"
        }

        print(json.dumps(response))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1 and os.path.isfile(sys.argv[1]):
            with open(sys.argv[1], 'r') as file:
                email_content = file.read()
        else:
            email_content = sys.argv[1] if len(sys.argv) > 1 else ""

        predict(email_content)
    except Exception as e:
        print(json.dumps({"error": f"Script execution error: {str(e)}"}))
        sys.exit(1)
