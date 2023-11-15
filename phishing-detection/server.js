const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing application/json
app.use(express.json());

// Middleware for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Middleware for serving static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// POST route for '/analyze'
app.post('/analyze', (req, res) => {
    // This is where you will receive the email content from the frontend
    const emailContent = req.body.emailContent;
    console.log(emailContent);

    // Placeholder for where you would add your phishing detection logic
    // ...

    // Sending back a dummy response to the frontend
    res.json({ status: 'success', message: 'Email received and analyzed', result: 'safe' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
