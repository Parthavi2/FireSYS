const { db } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

// GET /api/stations
async function getStations(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM trucks t WHERE t.station_id = s.id) AS truck_count,
        (SELECT COUNT(*) FROM firefighters f WHERE f.station_id = s.id) AS firefighter_count
      FROM stations s
      ORDER BY s.id
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/stations
async function createStation(req, res, next) {
  try {
    const { name, address, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const [result] = await db.query(
      'INSERT INTO stations (name, address, phone) VALUES (?, ?, ?)',
      [name, address || null, phone || null]
    );
    await logActivity(req.user?.id, 'Created station', 'station', result.insertId, name);
    res.status(201).json({ id: result.insertId, name, address, phone });
  } catch (err) {
    next(err);
  }
}

// PUT /api/stations/:id
async function updateStation(req, res, next) {
  try {
    const { id } = req.params;
    const { name, address, phone } = req.body;

    const [result] = await db.query(
      'UPDATE stations SET name = COALESCE(?, name), address = COALESCE(?, address), phone = COALESCE(?, phone) WHERE id = ?',
      [name, address, phone, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Station not found' });

    await logActivity(req.user?.id, 'Updated station', 'station', id, name);
    res.json({ message: 'Station updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/stations/:id
async function deleteStation(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM stations WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Station not found' });

    await logActivity(req.user?.id, 'Deleted station', 'station', id, null);
    res.json({ message: 'Station deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStations, createStation, updateStation, deleteStation };
