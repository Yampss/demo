const pool = require('../db');

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type VARCHAR(30) NOT NULL DEFAULT 'general',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const create = async ({ user_id, type, title, message, metadata }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, type || 'general', title, message, metadata ? JSON.stringify(metadata) : '{}']
  );
  return result.rows[0];
};

const findByUserId = async (user_id, limit = 50, offset = 0) => {
  const result = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [user_id, limit, offset]
  );
  return result.rows;
};

const markAsRead = async (id, user_id) => {
  const result = await pool.query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, user_id]
  );
  return result.rows[0];
};

const markAllAsRead = async (user_id) => {
  await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [user_id]);
};

const getUnreadCount = async (user_id) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [user_id]
  );
  return parseInt(result.rows[0].count);
};

const deleteById = async (id, user_id) => {
  await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, user_id]);
};

module.exports = { initDB, create, findByUserId, markAsRead, markAllAsRead, getUnreadCount, deleteById };
