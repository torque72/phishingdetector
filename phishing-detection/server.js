const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/analyze', upload.single('file'), (req, res) => {
    let tempTextFilePath = null;

    try {
        if (req.body.url) {
            console.log('Processing URL input:', req.body.url);
            const pythonProcess = spawn('python3', ['./python/predict_email.py', '--mode', 'url', req.body.url]);

            pythonProcess.stdout.on('data', (data) => {
                try {
                    const prediction = JSON.parse(data.toString().trim());
                    console.log('Prediction output:', prediction);
                    res.json(prediction);
                } catch (err) {
                    console.error('Error parsing Python response:', err);
                    res.status(500).json({ status: 'error', message: 'Invalid JSON response from Python' });
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Prediction error: ${data}`);
                res.status(500).json({ status: 'error', message: 'Prediction failed' });
            });

            return;
        }

        if (req.file) {
            console.log('Processing uploaded file:', req.file.path);
            const extractProcess = spawn('python3', ['./python/extract_text.py', req.file.path]);

            extractProcess.stdout.on('data', (data) => {
                const extractedText = data.toString().trim();
                console.log('Extracted text:', extractedText);

                tempTextFilePath = path.join(os.tmpdir(), uuidv4() + '.txt');
                fs.writeFileSync(tempTextFilePath, extractedText);
                runPrediction(tempTextFilePath, res, 'email');
            });

            extractProcess.stderr.on('data', (data) => {
                console.error(`Extraction error: ${data}`);
                res.status(500).json({ status: 'error', message: 'Text extraction failed' });
            });

        } else if (req.body.emailContent) {
            console.log('Processing text input:', req.body.emailContent);

            tempTextFilePath = path.join(os.tmpdir(), uuidv4() + '.txt');
            fs.writeFileSync(tempTextFilePath, req.body.emailContent);
            runPrediction(tempTextFilePath, res, 'email');
        } else {
            return res.status(400).json({ status: 'error', message: 'No input provided' });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ status: 'error', message: 'Server processing failed' });
    }
});

function runPrediction(tempTextFilePath, res, mode) {
    const pythonProcess = spawn('python3', ['./python/predict_email.py', '--mode', mode, tempTextFilePath]);

    pythonProcess.stdout.on('data', (data) => {
        try {
            const prediction = JSON.parse(data.toString().trim());
            console.log('Prediction output:', prediction);
            res.json(prediction);
        } catch (err) {
            console.error('Error parsing Python response:', err);
            res.status(500).json({ status: 'error', message: 'Invalid JSON response from Python' });
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Prediction error: ${data}`);
        res.status(500).json({ status: 'error', message: 'Prediction failed' });
    });

    pythonProcess.on('close', () => {
        fs.unlink(tempTextFilePath, (err) => {
            if (err) console.error(`Failed to delete temp file: ${err}`);
        });
    });
}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
