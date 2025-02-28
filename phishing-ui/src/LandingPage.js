import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css"; // Custom styles

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      {/* Animated Background */}
      <div className="background-overlay"></div>

      <Container maxWidth="md" className="content">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Typography variant="h2" className="title">
            🛡️ AI-Powered Phishing Detection
          </Typography>
        </motion.div>

        {/* Animated Subtitle */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <Typography variant="h5" className="subtitle">
            Detect phishing emails & malicious URLs in seconds.
          </Typography>
        </motion.div>

        {/* Animated Start Button */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Button
            variant="contained"
            className="start-button"
            onClick={() => navigate("/home")}
          >
            Start Detection
          </Button>
        </motion.div>
      </Container>
    </div>
  );
};

export default LandingPage;