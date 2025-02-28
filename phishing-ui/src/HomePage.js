import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import Dropzone from "react-dropzone";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import "./Global.css";

const typingPlaceholder = ["Enter email content...", "Paste phishing email here...", "Analyze suspicious emails..."];

const HomePage = () => {
  const [emailText, setEmailText] = useState("");
  const [urlText, setUrlText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [checkUrl, setCheckUrl] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const navigate = useNavigate();

  // Typing animation for placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderText(typingPlaceholder[currentPlaceholder].substring(0, charIndex));
      if (charIndex === typingPlaceholder[currentPlaceholder].length) {
        setTimeout(() => {
          setCharIndex(0);
          setCurrentPlaceholder((prev) => (prev + 1) % typingPlaceholder.length);
        }, 2000);
      } else {
        setCharIndex((prev) => prev + 1);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [charIndex, currentPlaceholder]);

  // Clears result when toggling between Email & URL mode
  const handleToggle = () => {
    setCheckUrl(!checkUrl);
    setResult(null); // Clear result on toggle
  };

  // Handle form submission
  const handleSubmit = async () => {
    if ((!emailText && !file && !checkUrl) || (checkUrl && !urlText)) {
      setError("Please enter an email body, upload a file, or paste a URL.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();

    if (checkUrl) {
      formData.append("url", urlText);
    } else {
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("emailContent", emailText);
      }
    }

    try {
      const response = await axios.post("http://localhost:3001/analyze", formData);
      setResult(response.data);
    } catch (err) {
      setError("Error analyzing input. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="page-container">
      <div className="background-overlay"></div>
      <Container maxWidth="md" className="homepage-container">
        {/* Animated Title */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="h4" className="title">
            AI Phishing Detection Tool
          </Typography>
        </motion.div>

        {/* "How It Works" Button */}
        <motion.div whileHover={{ scale: 1.05 }}>
          <Button className="how-it-works-button" onClick={() => navigate("/how-it-works")}>
            How It Works
          </Button>
        </motion.div>

        {/* Input Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Paper elevation={3} className="input-paper">
            {/* Toggle Switch */}
            <FormControlLabel
              control={<Switch checked={checkUrl} onChange={handleToggle} color="primary" />}
              label={<Typography className="toggle-switch">{checkUrl ? "Check URL Safety" : "Check Email Body"}</Typography>}
              className="toggle-container"
            />

            {/* Animated Input Swap */}
            <AnimatePresence mode="wait">
              {!checkUrl ? (
                <motion.div key="email-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4 }}>
                  <TextField fullWidth placeholder={placeholderText} multiline rows={6} value={emailText} onChange={(e) => setEmailText(e.target.value)} variant="outlined" className="input-text" />
                </motion.div>
              ) : (
                <motion.div key="url-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.4 }}>
                  <TextField fullWidth placeholder="Enter URL to analyze..." value={urlText} onChange={(e) => setUrlText(e.target.value)} variant="outlined" className="input-text" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload Section */}
          {!checkUrl && (
            <Dropzone
              onDrop={(acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                  setFile(acceptedFiles[0]);
                  console.log("File selected:", acceptedFiles[0]);
                }
              }}
            >
              {({ getRootProps, getInputProps }) => (
                <motion.div {...getRootProps()} className="dropzone" whileHover={{ scale: 1.05 }}>
                  <input {...getInputProps()} />
                  <CloudUpload className="upload-icon" />
                  <Typography variant="body2">
                    Drag & drop a file or click to select
                  </Typography>
                </motion.div>
              )}
            </Dropzone>
          )}

          {/* Show file name when selected */}
          {file && (
            <Typography variant="body2" className="file-selected">
              Selected File: {file.name}
            </Typography>
          )}


            {/* Analyze Button */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button onClick={handleSubmit} className="analyze-button" disabled={loading}>
                {loading ? <CircularProgress size={24} className="loading-spinner" /> : "Analyze"}
              </Button>
            </motion.div>
          </Paper>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <Paper elevation={3} className={`result-paper ${result.final_prediction === "Phishing" ? "phishing" : "safe"}`}>
                <Typography variant="h6" className="result-title">Analysis Result</Typography>
                <Typography variant="body1" className="result-text">{checkUrl ? "URL Analysis" : "Email Analysis"}: {result.text_prediction || result.url_prediction}</Typography>
                <Typography variant="h5" className="final-result">{result.final_prediction}</Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default HomePage;
