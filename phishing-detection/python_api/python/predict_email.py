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
    text = url_pattern.sub(" linkurl ", text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

def preprocess_url(url):
    return [
        int(bool(re.search(r'(\d{1,3}\.){3}\d{1,3}', url))),  # IP presence
        len(url),
        url.count('.'),
        int('https' in url),
        len(re.findall(r'\W', url)),
        sum(s in url for s in ['login', 'verify', 'account', 'secure', 'banking', 'confirm'])
    ]

def predict_email(email_content):
    try:
        email_content = preprocess_email_text(email_content)
        email_vector = text_vectorizer.transform([email_content])
        text_prediction = text_model.predict(email_vector)[0]

        response = {
            "text_prediction": "Phishing" if text_prediction == 1 else "Safe",
            "url_prediction": None,
            "final_prediction": "Phishing" if text_prediction == 1 else "Safe"
        }

        print(json.dumps(response))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": f"Email prediction failed: {str(e)}"}))
        sys.exit(1)

def predict_url(url):
    try:
        url_features = preprocess_url(url)
        df_url_features = pd.DataFrame([url_features], columns=['has_ip', 'length', 'subdomains', 'https', 'special_chars', 'suspicious_strings'])
        url_features_scaled = url_scaler.transform(df_url_features)
        url_prediction = url_model.predict(url_features_scaled)[0]

        response = {
            "text_prediction": None,
            "url_prediction": "Phishing" if url_prediction == 1 else "Safe",
            "final_prediction": "Phishing" if url_prediction == 1 else "Safe"
        }

        print(json.dumps(response))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"error": f"URL prediction failed: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    try:
        if len(sys.argv) > 2 and sys.argv[1] == "--mode":
            mode = sys.argv[2]
            input_data = sys.argv[3] if len(sys.argv) > 3 else ""

            if mode == "email":
                predict_email(input_data)
            elif mode == "url":
                predict_url(input_data)
            else:
                print(json.dumps({"error": "Invalid mode specified"}))
                sys.exit(1)
        else:
            print(json.dumps({"error": "Mode not specified"}))
            sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Script execution error: {str(e)}"}))
        sys.exit(1)
