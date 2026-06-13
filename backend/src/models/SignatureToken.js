const pool = require('../config/db');

const SignatureToken = {
  async create({ documentId, token, signerEmail, expiresAt }) {
    const result = await pool.query(
      `INSERT INTO signature_tokens (document_id, token, signer_email, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [documentId, token, signerEmail, expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token) {
    const result = await pool.query(
      `SELECT st.*, d.original_name, d.file_path, d.status AS doc_status
       FROM signature_tokens st
       JOIN documents d ON st.document_id = d.id
       WHERE st.token = $1`,
      [token]
    );
    return result.rows[0] || null;
  },

  async markUsed(token) {
    const result = await pool.query(
      `UPDATE signature_tokens SET used = TRUE WHERE token = $1 RETURNING *`,
      [token]
    );
    return result.rows[0] || null;
  },

  async findByDocument(documentId) {
    const result = await pool.query(
      `SELECT * FROM signature_tokens WHERE document_id = $1 ORDER BY created_at DESC`,
      [documentId]
    );
    return result.rows;
  },
};

module.exports = SignatureToken;
