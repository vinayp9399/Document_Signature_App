const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');

router.get('/:docId', authMiddleware, async (req, res) => {
  try {
    const { docId } = req.params;

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const logs = await AuditLog.findByDocument(docId);

    res.json({ logs });
  } catch (err) {
    console.error('Audit fetch error:', err);
    res.status(500).json({ message: 'Server error fetching audit logs' });
  }
});

module.exports = router;
