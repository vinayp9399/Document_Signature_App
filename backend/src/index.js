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

app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/docs', require('./routes/documents'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


