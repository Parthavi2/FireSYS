const { db } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

// GET /api/maintenance
async function getMaintenance(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT m.*, t.code AS truck_code
      FROM maintenance m
      JOIN trucks t ON t.id = m.truck_id
      ORDER BY m.scheduled_date DESC, m.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/maintenance
async function createMaintenance(req, res, next) {
  try {
    const { truckId, description, scheduledDate, cost } = req.body;
    if (!truckId || !description) {
      return res.status(400).json({ message: 'truckId and description are required' });
    }

    const [result] = await db.query(
      `INSERT INTO maintenance (truck_id, description, scheduled_date, status, cost) VALUES (?, ?, ?, 'Scheduled', ?)`,
      [truckId, description, scheduledDate || null, cost || null]
    );
    await db.query(`UPDATE trucks SET status = 'Maintenance' WHERE id = ?`, [truckId]);

    await logActivity(req.user?.id, 'Scheduled maintenance', 'maintenance', result.insertId, description);
    res.status(201).json({ id: result.insertId, truckId, description, status: 'Scheduled' });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/maintenance/:id
async function updateMaintenance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, completedDate, cost } = req.body;

    const validStatuses = ['Scheduled', 'In Progress', 'Completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of ${validStatuses.join(', ')}` });
    }

    const [rows] = await db.query('SELECT truck_id FROM maintenance WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Maintenance record not found' });

    await db.query(
      `UPDATE maintenance SET status = COALESCE(?, status), completed_date = COALESCE(?, completed_date), cost = COALESCE(?, cost) WHERE id = ?`,
      [status ?? null, completedDate ?? null, cost ?? null, id]
    );

    if (status === 'Completed') {
      await db.query(`UPDATE trucks SET status = 'Available' WHERE id = ?`, [rows[0].truck_id]);
    }

    await logActivity(req.user?.id, 'Updated maintenance record', 'maintenance', id, status);
    res.json({ message: 'Maintenance record updated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMaintenance, createMaintenance, updateMaintenance };
