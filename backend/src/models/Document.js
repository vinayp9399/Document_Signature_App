const pool = require('../config/db');

const Document = {
  async create({ userId, originalName, filePath, fileSize }) {
    const result = await pool.query(
      `INSERT INTO documents (user_id, original_name, file_path, file_size, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, originalName, filePath, fileSize]
    );
    return result.rows[0];
  },

  async findAllByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT * FROM documents WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },
};

module.exports = Document;
