const pool = require('../config/db');

const AuditLog = {
  async create({ documentId, userId, action, ipAddress }) {
    const result = await pool.query(
      `INSERT INTO audit_logs (document_id, user_id, action, ip_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [documentId, userId || null, action, ipAddress || null]
    );
    return result.rows[0];
  },

  async findByDocument(documentId) {
    const result = await pool.query(
      `SELECT a.*, u.name AS user_name, u.email AS user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.document_id = $1
       ORDER BY a.created_at DESC`,
      [documentId]
    );
    return result.rows;
  },
};

module.exports = AuditLog;
