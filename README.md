# AI Phishing Detection Tool

## Overview

The AI Phishing Detection Tool is a machine learning-powered system designed to detect phishing emails and malicious URLs. It allows users to:

- Analyze email content for phishing indicators
- Scan URLs to determine their safety
- Upload email files for automated text extraction and classification

This project is built to demonstrate the integration of machine learning in a full-stack web application.

---

## Tech Stack

### Frontend

- React
- Material UI
- Framer Motion

### Backend

- Node.js & Express
- Multer (File Uploads)
- Python (Machine Learning Processing)

### Machine Learning

- Scikit-Learn (Support Vector Machine & Random Forest Models)
- Tesseract OCR (Text Extraction from Images)
- PyPDF2 (Text Extraction from PDFs)

---

## Installation & Setup

### Prerequisites

- Node.js (v16+)
- Python 3.x
- Tesseract OCR installed

### Steps to Run

```sh
# Clone repository
git clone https://github.com/YOUR_USERNAME/phishing-detection-tool.git
cd phishing-detection-tool

# Install frontend dependencies
cd phishing-ui
npm install
npm start  # Runs React frontend at localhost:3000

# Install backend dependencies
cd ../phishing-detection
npm install
node server.js  # Runs backend at localhost:3001

## Machine Learning Models

### Email Analysis Model
- **Dataset:** 80,000+ phishing and safe emails
- **Vectorization:** TF-IDF (1-2 ngrams)
- **Trained Models:**
  - Naïve Bayes (**92% accuracy**)
  - Logistic Regression (**94% accuracy**)
  - Support Vector Machine (**97% accuracy**)

### URL Analysis Model
- **Dataset:** 87,000+ phishing and safe URLs
- **Model:** Random Forest (**86% accuracy**)
- **Features:**
  - **Subdomains** – Multiple subdomains may indicate phishing
  - **IP Address in URL** – Raw IPs are often suspicious
  - **HTTPS vs HTTP** – HTTPS is preferred
  - **Suspicious Keywords** – Detects words like *verify, secure, login*

---

## Features & Highlights

- **Modern UI** – Responsive dark mode interface
- **Live Machine Learning Predictions** – Real-time phishing detection
- **File Upload Support** – OCR and PDF parsing for email attachments
- **Optimized Performance** – 97% accuracy in email classification

---

## Future Improvements

- **Integrate Deep Learning** – LSTMs for better phishing detection
- **Add WHOIS API** – Domain verification for enhanced URL analysis
- **Expand Dataset** – Improve model generalization with more data

---

## License

This project is licensed under the **MIT License**.

---

## Contact
- **Developer:** Ben Sadler
```
