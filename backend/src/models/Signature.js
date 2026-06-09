const pool = require('../config/db');

const Signature = {
  async create({ documentId, userId, x, y, page }) {
    const result = await pool.query(
      `INSERT INTO signatures (document_id, user_id, x, y, page, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [documentId, userId, x, y, page]
    );
    return result.rows[0];
  },

  async findByDocument(documentId) {
    const result = await pool.query(
      `SELECT s.*, u.name AS signer_name, u.email AS signer_email
       FROM signatures s
       JOIN users u ON s.user_id = u.id
       WHERE s.document_id = $1
       ORDER BY s.created_at ASC`,
      [documentId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM signatures WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE signatures
       SET status = $1, signed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },
};

module.exports = Signature;
