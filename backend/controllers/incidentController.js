const { db } = require('../config/db');

// GET /api/incidents
async function getIncidents(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM incidents ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/incidents
async function createIncident(req, res, next) {
  try {
    const { location, type, severity } = req.body;

    if (!location || !type || !severity) {
      return res.status(400).json({ message: 'location, type and severity are required' });
    }

    const [result] = await db.query(
      'INSERT INTO incidents (location, type, status, severity) VALUES (?, ?, "Active", ?)',
      [location, type, severity]
    );

    res.status(201).json({ id: result.insertId, location, type, status: 'Active', severity });
  } catch (err) {
    next(err);
  }
}

module.exports = { getIncidents, createIncident };
