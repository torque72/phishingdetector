import sys
import os
from PIL import Image
import pytesseract
import PyPDF2

# Ensure tesseract is in PATH, comment out the line below if not necessary
# pytesseract.pytesseract.tesseract_cmd = r'<full_path_to_your_tesseract_executable>'

def extract_text_from_image(image_path):
    """ Extract text from an image file using OCR. """
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error processing image file {image_path}: {str(e)}", file=sys.stderr)
        return None

def extract_text_from_pdf(pdf_path):
    """ Extract text from a PDF file. """
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        print(f"Error processing PDF file {pdf_path}: {str(e)}", file=sys.stderr)
        return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_text.py <file_path>", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    print("Processing file:", file_path)  # Debugging output

    # Ensure the file exists
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}", file=sys.stderr)
        sys.exit(1)
    
    file_extension = os.path.splitext(file_path)[1].lower()
    print("Detected file extension:", file_extension)  # Debugging output

    text = None
    if file_extension in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        text = extract_text_from_image(file_path)
    elif file_extension == '.pdf':
        text = extract_text_from_pdf(file_path)
    else:
        print(f"Unsupported file type: {file_extension}", file=sys.stderr)
        sys.exit(1)

    if text:
        print(text)
    else:
        print("No text extracted from file.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
