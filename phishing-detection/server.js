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

/* --- Setup --- */

// Ensure uploads dir exists (Render’s disk is empty each deploy)
fs.mkdirSync('uploads', { recursive: true });

// Allow your Netlify site to call this API
app.use(
  cors({
    origin: ['https://aiphishingdetector.netlify.app'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* --- Multer for file uploads --- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) =>
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

/* --- Routes --- */

// Simple health check
app.get('/health', (_req, res) => res.send('ok'));

// Main analyze endpoint
app.post('/analyze', upload.single('file'), (req, res) => {
  let tempTextFilePath = null;

  try {
    // URL mode
    if (req.body.url) {
      const py = spawn('python3', ['./python/predict_email.py', '--mode', 'url', req.body.url]);

      let out = '';
      let responded = false;

      py.stdout.on('data', (d) => (out += d.toString()));
      py.stderr.on('data', (d) => console.error('Prediction stderr:', d.toString()));

      py.on('close', () => {
        if (responded) return;
        try {
          const prediction = JSON.parse(out.trim());
          responded = true;
          return res.json(prediction);
        } catch {
          responded = true;
          return res
            .status(500)
            .json({ status: 'error', message: 'Invalid JSON response from Python' });
        }
      });

      return; // important: don’t fall through
    }

    // File upload mode
    if (req.file) {
      const extract = spawn('python3', ['./python/extract_text.py', req.file.path]);

      let extracted = '';
      let responded = false;

      extract.stdout.on('data', (d) => (extracted += d.toString()));
      extract.stderr.on('data', (d) => console.error('Extraction stderr:', d.toString()));

      extract.on('close', () => {
        if (responded) return;
        const text = (extracted || '').toString().trim();

        tempTextFilePath = path.join(os.tmpdir(), `${uuidv4()}.txt`);
        fs.writeFileSync(tempTextFilePath, text);
        return runPrediction(tempTextFilePath, res, 'email');
      });

      return;
    }

    // Raw text mode
    if (req.body.emailContent) {
      tempTextFilePath = path.join(os.tmpdir(), `${uuidv4()}.txt`);
      fs.writeFileSync(tempTextFilePath, req.body.emailContent);
      return runPrediction(tempTextFilePath, res, 'email');
    }

    // No input provided
    return res.status(400).json({ status: 'error', message: 'No input provided' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ status: 'error', message: 'Server processing failed' });
  }
});

function runPrediction(tempTextFilePath, res, mode) {
  const py = spawn('python3', ['./python/predict_email.py', '--mode', mode, tempTextFilePath]);

  let out = '';
  let responded = false;

  py.stdout.on('data', (d) => (out += d.toString()));
  py.stderr.on('data', (d) => console.error('Prediction stderr:', d.toString()));

  py.on('close', () => {
    try {
      if (!responded) {
        const prediction = JSON.parse(out.trim());
        responded = true;
        res.json(prediction);
      }
    } catch {
      if (!responded) {
        responded = true;
        res.status(500).json({ status: 'error', message: 'Invalid JSON response from Python' });
      }
    } finally {
      // Cleanup temp file
      fs.unlink(tempTextFilePath, () => {});
    }
  });
}

/* --- Start server --- */
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});