const { db } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

// GET /api/firefighters — joined with the user + station for display
async function getFirefighters(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT f.id, f.user_id, u.name, u.email, f.station_id, s.name AS station_name,
             f.rank_title, f.status, f.phone, f.created_at
      FROM firefighters f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN stations s ON s.id = f.station_id
      ORDER BY f.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/firefighters/:id — update duty status / station / rank
async function updateFirefighter(req, res, next) {
  try {
    const { id } = req.params;
    const { status, stationId, rankTitle, phone } = req.body;

    const validStatuses = ['Available', 'Busy', 'Standby', 'Off Duty'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of ${validStatuses.join(', ')}` });
    }

    const [result] = await db.query(
      `UPDATE firefighters
       SET status = COALESCE(?, status), station_id = COALESCE(?, station_id),
           rank_title = COALESCE(?, rank_title), phone = COALESCE(?, phone)
       WHERE id = ?`,
      [status ?? null, stationId ?? null, rankTitle ?? null, phone ?? null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Firefighter not found' });

    await logActivity(req.user?.id, 'Updated firefighter', 'firefighter', id, status);
    res.json({ message: 'Firefighter updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFirefighters, updateFirefighter };
