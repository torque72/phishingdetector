const express = require('express');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 3000;

// Set up storage engine with multer to preserve file extension
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        // Generate a unique name with the original file extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Configure multer with the storage engine
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/analyze', upload.single('file'), (req, res) => {
    if (req.file) {
        // Process the file using Python scripts
        const filePath = req.file.path;
        console.log('Received file on /analyze with file path:', filePath);

        // First, extract text from the uploaded file
        const extractProcess = spawn('python3', ['./python/extract_text.py', filePath]);

        extractProcess.stdout.on('data', (data) => {
            const extractedText = data.toString();
            console.log('Extracted text:', extractedText);

            // Write the extracted text to a temporary file
            const tempTextFilePath = path.join(os.tmpdir(), uuidv4() + '.txt');
            fs.writeFile(tempTextFilePath, extractedText, (err) => {
                if (err) {
                    console.error(`Failed to write extracted text to a temp file: ${err}`);
                    return res.status(500).json({ status: 'error', message: 'Failed to process the extracted text' });
                }

                // Now, send the path of the temp text file to the prediction script
                const pythonProcess = spawn('python3', ['./python/predict_email.py', tempTextFilePath]);

                pythonProcess.stdout.on('data', (data) => {
                    const prediction = data.toString().trim();
                    console.log('Prediction output:', prediction);
                    if (!res.headersSent) {
                        res.json({ status: 'success', prediction: prediction });
                    }
                });

                pythonProcess.stderr.on('data', (data) => {
                    console.error(`Prediction stderr: ${data}`);
                    if (!res.headersSent) {
                        res.status(500).json({ status: 'error', message: 'An error occurred in the prediction script' });
                    }
                });

                pythonProcess.on('close', (code) => {
                    // Delete the temp file after prediction
                    fs.unlink(tempTextFilePath, (err) => {
                        if (err) console.error(`Failed to delete temp file: ${err}`);
                    });
                    if (code !== 0) {
                        console.error(`Prediction script exited with code ${code}`);
                        if (!res.headersSent) {
                            res.status(500).json({ status: 'error', message: 'Prediction script exited with an error' });
                        }
                    }
                });
            });
        });

        extractProcess.stderr.on('data', (data) => {
            console.error(`Extraction stderr: ${data}`);
            if (!res.headersSent) {
                res.status(500).json({ status: 'error', message: 'An error occurred in the text extraction script' });
            }
        });

    } else if (req.body.emailContent) {
        // Handle plain text input directly
        const emailContent = req.body.emailContent;
        console.log('Received request on /analyze with data:', emailContent);

        // Write the plain text to a temporary file
        const tempTextFilePath = path.join(os.tmpdir(), uuidv4() + '.txt');
        fs.writeFile(tempTextFilePath, emailContent, (err) => {
            if (err) {
                console.error(`Failed to write plain text to a temp file: ${err}`);
                return res.status(500).json({ status: 'error', message: 'Failed to process the plain text' });
            }

            // Send the path of the temp text file to the prediction script
            const pythonProcess = spawn('python3', ['./python/predict_email.py', tempTextFilePath]);

            pythonProcess.stdout.on('data', (data) => {
                const prediction = data.toString().trim();
                console.log('Prediction output:', prediction);
                if (!res.headersSent) {
                    res.json({ status: 'success', prediction: prediction });
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Prediction stderr: ${data}`);
                if (!res.headersSent) {
                    res.status(500).json({ status: 'error', message: 'An error occurred in the prediction script' });
                }
            });

            pythonProcess.on('close', (code) => {
                // Delete the temp file after prediction
                fs.unlink(tempTextFilePath, (err) => {
                    if (err) console.error(`Failed to delete temp file: ${err}`);
                });
                if (code !== 0) {
                    console.error(`Prediction script exited with code ${code}`);
                    if (!res.headersSent) {
                        res.status(500).json({ status: 'error', message: 'Prediction script exited with an error' });
                    }
                }
            });
        });
    } else {
        // No file or text was submitted
        return res.status(400).json({ status: 'error', message: 'No input provided' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
