const { db } = require('../config/db');

// Fire-and-forget audit log write. Never throws into the caller — a
// logging failure shouldn't fail the actual request.
async function logActivity(userId, action, entityType, entityId, details) {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, entityType || null, entityId || null, details || null]
    );
  } catch (err) {
    console.error('activity log write failed:', err.message);
  }
}

module.exports = { logActivity };
