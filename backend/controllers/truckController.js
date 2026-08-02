const { db } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

// GET /api/trucks
async function getTrucks(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT t.*, s.name AS station_name
      FROM trucks t
      LEFT JOIN stations s ON s.id = t.station_id
      ORDER BY t.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/trucks
async function createTruck(req, res, next) {
  try {
    const { code, type, stationId } = req.body;
    if (!code) return res.status(400).json({ message: 'code is required' });

    const [result] = await db.query(
      `INSERT INTO trucks (code, station_id, type, status) VALUES (?, ?, ?, 'Available')`,
      [code, stationId || null, type || null]
    );
    await logActivity(req.user?.id, 'Added truck', 'truck', result.insertId, code);
    res.status(201).json({ id: result.insertId, code, type, status: 'Available' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/trucks/:id
async function updateTruck(req, res, next) {
  try {
    const { id } = req.params;
    const { status, type, stationId } = req.body;

    const validStatuses = ['Available', 'Busy', 'Maintenance'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of ${validStatuses.join(', ')}` });
    }

    const [result] = await db.query(
      `UPDATE trucks SET status = COALESCE(?, status), type = COALESCE(?, type), station_id = COALESCE(?, station_id) WHERE id = ?`,
      [status ?? null, type ?? null, stationId ?? null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Truck not found' });

    await logActivity(req.user?.id, 'Updated truck', 'truck', id, status);
    res.json({ message: 'Truck updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/trucks/:id
async function deleteTruck(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM trucks WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Truck not found' });

    await logActivity(req.user?.id, 'Removed truck', 'truck', id, null);
    res.json({ message: 'Truck deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTrucks, createTruck, updateTruck, deleteTruck };
