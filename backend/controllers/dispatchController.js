const { db } = require('../config/db');

// POST /api/dispatch
// Assigns a truck to an incident and updates both records' status.
// All three writes are wrapped in a transaction so a failure partway
// through can't leave the truck and incident in an inconsistent state.
async function createDispatch(req, res, next) {
  const { incidentId, truckId } = req.body;

  if (!incidentId || !truckId) {
    return res.status(400).json({ message: 'incidentId and truckId are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO dispatch (incident_id, truck_id, status) VALUES (?, ?, "Assigned")',
      [incidentId, truckId]
    );
    await connection.query('UPDATE trucks SET status = "Busy" WHERE id = ?', [truckId]);
    await connection.query('UPDATE incidents SET status = "In Progress" WHERE id = ?', [incidentId]);

    await connection.commit();
    res.status(201).json({ message: 'Dispatched', incidentId, truckId });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = { createDispatch };
