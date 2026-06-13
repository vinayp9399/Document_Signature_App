const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const SignatureToken = require('../models/SignatureToken');
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const { sendSigningLink } = require('../config/mailer');

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { documentId, signerEmail, signerName } = req.body;

    if (!documentId || !signerEmail) {
      return res.status(400).json({ message: 'documentId and signerEmail are required' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(48).toString('hex');

    // Token expires in 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const signingToken = await SignatureToken.create({
      documentId,
      token,
      signerEmail,
      expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const signingUrl = `${clientUrl}/sign/${token}`;

    // Send email — if email config missing, skip and return link directly
    let emailSent = false;
    try {
      await sendSigningLink({
        toEmail: signerEmail,
        signerName: signerName || '',
        documentName: doc.original_name,
        signingUrl,
      });
      emailSent = true;
    } catch (emailErr) {
      console.warn('Email sending failed (check EMAIL_* env vars):', emailErr.message);
    }

    res.status(201).json({
      message: emailSent
        ? `Signing link sent to ${signerEmail}`
        : 'Signing link generated (email not sent — check EMAIL_* env vars)',
      signingUrl,
      token: signingToken.token,
      expiresAt: signingToken.expires_at,
      emailSent,
    });
  } catch (err) {
    console.error('Generate signing link error:', err);
    res.status(500).json({ message: 'Server error generating signing link' });
  }
});

router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const signingToken = await SignatureToken.findByToken(token);

    if (!signingToken) {
      return res.status(404).json({ message: 'Signing link not found or invalid' });
    }
    if (signingToken.used) {
      return res.status(410).json({ message: 'This signing link has already been used' });
    }
    if (new Date(signingToken.expires_at) < new Date()) {
      return res.status(410).json({ message: 'This signing link has expired' });
    }

    res.json({
      documentId: signingToken.document_id,
      documentName: signingToken.original_name,
      filePath: signingToken.file_path,
      signerEmail: signingToken.signer_email,
      expiresAt: signingToken.expires_at,
    });
  } catch (err) {
    console.error('Verify token error:', err);
    res.status(500).json({ message: 'Server error verifying signing link' });
  }
});

router.post('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { x, y, page } = req.body;

    if (x === undefined || y === undefined) {
      return res.status(400).json({ message: 'x and y coordinates are required' });
    }

    const signingToken = await SignatureToken.findByToken(token);

    if (!signingToken) {
      return res.status(404).json({ message: 'Signing link not found or invalid' });
    }
    if (signingToken.used) {
      return res.status(410).json({ message: 'This signing link has already been used' });
    }
    if (new Date(signingToken.expires_at) < new Date()) {
      return res.status(410).json({ message: 'This signing link has expired' });
    }

    // Save signature using document owner's context (no auth required for public signing)
    const doc = await Document.findById(signingToken.document_id);

    const signature = await Signature.create({
      documentId: signingToken.document_id,
      userId: doc.user_id,
      x,
      y,
      page: page || 1,
    });

    // Mark token as used
    await SignatureToken.markUsed(token);

    res.status(201).json({
      message: 'Document signed successfully',
      signature,
    });
  } catch (err) {
    console.error('Public sign error:', err);
    res.status(500).json({ message: 'Server error processing signature' });
  }
});

router.get('/links/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const links = await SignatureToken.findByDocument(documentId);
    res.json({ links });
  } catch (err) {
    console.error('Get links error:', err);
    res.status(500).json({ message: 'Server error fetching signing links' });
  }
});

module.exports = router;
