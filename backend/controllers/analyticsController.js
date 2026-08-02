const { db } = require('../config/db');

// GET /api/analytics/summary — the KPI cards
async function getSummary(req, res, next) {
  try {
    const [[incidentCounts]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status IN ('Active','In Progress')) AS active,
        SUM(status = 'Resolved') AS resolved
      FROM incidents
    `);
    const [[firefighterCounts]] = await db.query(`
      SELECT COUNT(*) AS total, SUM(status = 'Available') AS available FROM firefighters
    `);
    const [[truckCounts]] = await db.query(`
      SELECT COUNT(*) AS total, SUM(status = 'Available') AS available FROM trucks
    `);
    const [[stationCount]] = await db.query('SELECT COUNT(*) AS total FROM stations');

    res.json({
      incidents: {
        total: Number(incidentCounts.total) || 0,
        active: Number(incidentCounts.active) || 0,
        resolved: Number(incidentCounts.resolved) || 0,
      },
      firefighters: {
        total: Number(firefighterCounts.total) || 0,
        available: Number(firefighterCounts.available) || 0,
      },
      trucks: {
        total: Number(truckCounts.total) || 0,
        available: Number(truckCounts.available) || 0,
      },
      stations: Number(stationCount.total) || 0,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/monthly-incidents — last 6 months, for the chart
async function getMonthlyIncidents(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
      FROM incidents
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/activity — recent activity feed
async function getRecentActivity(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const [rows] = await db.query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at, u.name AS user_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, getMonthlyIncidents, getRecentActivity };
