import os
import sys
import joblib

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load the model and vectorizer using the absolute path
model_path = os.path.join(script_dir, 'phishing_model.joblib')
vectorizer_path = os.path.join(script_dir, 'vectorizer.joblib')
model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

def predict(email_content):
    # Vectorize the email content
    email_vector = vectorizer.transform([email_content])
    # Make a prediction
    prediction = model.predict(email_vector)
    return prediction[0]

if __name__ == "__main__":
    email_content = sys.argv[1]
    prediction = predict(email_content)
    # Convert numeric prediction to a user-friendly message
    prediction_label = "Safe" if prediction == 1 else "Phishing"
    print(prediction_label)
