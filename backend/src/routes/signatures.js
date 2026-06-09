const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Signature = require('../models/Signature');
const Document = require('../models/Document');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { documentId, x, y, page } = req.body;

    if (!documentId || x === undefined || y === undefined) {
      return res.status(400).json({ message: 'documentId, x, and y are required' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signature = await Signature.create({
      documentId,
      userId: req.userId,
      x,
      y,
      page: page || 1,
    });

    res.status(201).json({
      message: 'Signature position saved',
      signature,
    });
  } catch (err) {
    console.error('Save signature error:', err);
    res.status(500).json({ message: 'Server error saving signature' });
  }
});

router.get('/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signatures = await Signature.findByDocument(documentId);
    res.json({ signatures });
  } catch (err) {
    console.error('Get signatures error:', err);
    res.status(500).json({ message: 'Server error fetching signatures' });
  }
});

module.exports = router;
