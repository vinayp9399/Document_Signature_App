const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const Document = require('../models/Document');

router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err) return next(err); // Pass multer errors to global handler
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file is not a PDF' });
    }

    const doc = await Document.create({
      userId: req.userId,
      originalName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      document: doc,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const docs = await Document.findAllByUser(req.userId);
    res.json({ documents: docs });
  } catch (err) {
    console.error('List docs error:', err);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ document: doc });
  } catch (err) {
    console.error('Get doc error:', err);
    res.status(500).json({ message: 'Server error fetching document' });
  }
});

module.exports = router;
