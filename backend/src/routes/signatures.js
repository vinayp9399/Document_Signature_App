const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
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

router.post('/finalize', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ message: 'documentId is required' });
    }

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (doc.user_id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const signatures = await Signature.findByDocument(documentId);
    if (signatures.length === 0) {
      return res.status(400).json({ message: 'No signatures found for this document' });
    }

    // Read the original PDF from disk
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const originalPath = path.join(uploadsDir, doc.file_path);

    if (!fs.existsSync(originalPath)) {
      return res.status(404).json({ message: 'Original PDF file not found on server' });
    }

    const existingPdfBytes = fs.readFileSync(originalPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    // Embed each signature onto its respective page
    for (const sig of signatures) {
      const pageIndex = (sig.page || 1) - 1;
      if (pageIndex < 0 || pageIndex >= pages.length) continue;

      const pdfPage = pages[pageIndex];
      const { width, height } = pdfPage.getSize();

      // Convert percentage coordinates to absolute PDF coordinates
      // PDF origin is bottom-left, browser origin is top-left — flip Y axis
      const absX = (sig.x / 100) * width;
      const absY = height - (sig.y / 100) * height;

      const signerLabel = sig.signer_name || 'Signed';
      const signedAt = sig.signed_at
        ? new Date(sig.signed_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          });

      const labelText = `✍ ${signerLabel}`;
      const dateText = signedAt;

      // Draw signature box background
      pdfPage.drawRectangle({
        x: absX - 2,
        y: absY - 28,
        width: 160,
        height: 36,
        color: rgb(1, 0.98, 0.8),
        borderColor: rgb(0.85, 0.65, 0),
        borderWidth: 1,
        opacity: 0.9,
      });

      // Draw signer name
      pdfPage.drawText(labelText, {
        x: absX + 2,
        y: absY - 12,
        size: 10,
        font,
        color: rgb(0.4, 0.3, 0),
      });

      // Draw signed date
      pdfPage.drawText(dateText, {
        x: absX + 2,
        y: absY - 24,
        size: 8,
        font,
        color: rgb(0.5, 0.4, 0.1),
      });

      // Mark signature as signed
      await Signature.updateStatus(sig.id, 'signed');
    }

    // Save the signed PDF with a new filename
    const signedFileName = `signed_${Date.now()}_${doc.file_path}`;
    const signedFilePath = path.join(uploadsDir, signedFileName);
    const signedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(signedFilePath, signedPdfBytes);

    // Update document status to signed
    await Document.updateStatus(documentId, 'signed');

    res.json({
      message: 'PDF signed and exported successfully',
      signedFile: signedFileName,
      downloadUrl: `/uploads/${signedFileName}`,
    });
  } catch (err) {
    console.error('Finalize error:', err);
    res.status(500).json({ message: 'Server error generating signed PDF' });
  }
});

module.exports = router;
