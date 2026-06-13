const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initDB = require('./config/initDB');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/docs', require('./routes/documents'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/signing', require('./routes/signingLinks'));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: 'Only PDF files are allowed.' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})
