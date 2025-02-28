import React from "react";
import { Container, Typography, Paper, Button, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./HowItWorks.css";
import "./Global.css";

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="background-overlay"></div>
      <Container maxWidth="lg" className="how-it-works-container">
        
        {/* Header Section */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="h3" className="title">
            How Our AI Phishing Detection Works
          </Typography>
          <Typography variant="h6" className="subtitle">
            Leveraging machine learning for accurate phishing detection.
          </Typography>
        </motion.div>

        {/* Three-Step Process */}
        <Grid container spacing={4} className="steps-section">
          
          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
              <Paper elevation={3} className="step-card dark-card">
                <Typography variant="h6" className="step-title">Data Collection</Typography>
                <Typography variant="body2">
                  We trained on over 80,000 emails and 87,000 URLs using real-world phishing datasets.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
              <Paper elevation={3} className="step-card dark-card">
                <Typography variant="h6" className="step-title">Model Training</Typography>
                <Typography variant="body2">
                  We tested Naïve Bayes, Logistic Regression, and SVM for classification, achieving 97% accuracy with SVM.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={4}>
            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
              <Paper elevation={3} className="step-card dark-card">
                <Typography variant="h6" className="step-title">Real-Time Analysis</Typography>
                <Typography variant="body2">
                  Our model processes email text and URLs to detect phishing attempts in real-time.
                </Typography>
              </Paper>
            </motion.div>
          </Grid>

        </Grid>

        {/* Model Performance Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Typography variant="h5" className="section-title">Model Performance</Typography>
          <TableContainer component={Paper} className="model-table dark-card">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell>Accuracy</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Naïve Bayes</TableCell><TableCell>92%</TableCell></TableRow>
                <TableRow><TableCell>Logistic Regression</TableCell><TableCell>94%</TableCell></TableRow>
                <TableRow className="highlight-row"><TableCell><b>Support Vector Machine (SVM)</b></TableCell><TableCell><b>97%</b></TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>

        {/* URL Feature Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <Typography variant="h5" className="section-title">URL Analysis Features</Typography>
          <Paper elevation={3} className="feature-card dark-card">
            <ul className="feature-list">
              <li><strong>Subdomains</strong> – Multiple subdomains can indicate phishing attempts.</li>
              <li><strong>IP Address Presence</strong> – Phishing URLs often use raw IPs instead of domains.</li>
              <li><strong>URL Length</strong> – Longer URLs with unnecessary paths are suspicious.</li>
              <li><strong>HTTPS vs HTTP</strong> – Secure HTTPS is preferred.</li>
              <li><strong>Keyword Analysis</strong> – Detects words commonly associated with spam or phishing attempts.</li>
            </ul>
          </Paper>
        </motion.div>

        {/* Back Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <Button className="back-button" onClick={() => navigate("/home")}>
            Back to Tool
          </Button>
        </motion.div>

      </Container>
    </div>
  );
};

export default HowItWorks;