const AuditLog = require('../models/AuditLog');

const auditLogger = (action) => {
  return async (req, res, next) => {
    // Run the next middleware/route first, then log after response
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only log on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const documentId =
            req.params.docId ||
            req.params.documentId ||
            req.params.id ||
            req.body?.documentId ||
            body?.document?.id ||
            body?.signature?.document_id ||
            null;

          const ipAddress =
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            null;

          if (documentId) {
            await AuditLog.create({
              documentId,
              userId: req.userId || null,
              action,
              ipAddress,
            });
          }
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = auditLogger;
