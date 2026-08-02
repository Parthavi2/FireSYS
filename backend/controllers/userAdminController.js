const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { logActivity } = require('../utils/activityLog');

// GET /api/users
async function getUsers(req, res, next) {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, r.name AS role, u.station_id, s.name AS station_name,
             u.is_active, u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN stations s ON s.id = u.station_id
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/users  — Admin provisions an Admin/Dispatcher/Firefighter account directly
async function createUser(req, res, next) {
  try {
    const { name, email, password, role, stationId } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const [[roleRow]] = await db.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRow) return res.status(400).json({ message: `Unknown role "${role}"` });

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ message: 'A user with that email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id, station_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, roleRow.id, stationId || null]
    );

    if (role === 'Firefighter') {
      await db.query(
        `INSERT INTO firefighters (user_id, station_id, status) VALUES (?, ?, 'Off Duty')`,
        [result.insertId, stationId || null]
      );
    }

    await logActivity(req.user.id, `Created ${role} account`, 'user', result.insertId, email);
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/:id — update name/station/active status (not password/role here)
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, stationId, isActive } = req.body;

    const [result] = await db.query(
      'UPDATE users SET name = COALESCE(?, name), station_id = COALESCE(?, station_id), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name ?? null, stationId ?? null, typeof isActive === 'boolean' ? isActive : null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

    await logActivity(req.user.id, 'Updated user', 'user', id, name);
    res.json({ message: 'User updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id — soft delete (deactivate) rather than hard delete
async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: "You can't deactivate your own account" });
    }

    const [result] = await db.query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

    await logActivity(req.user.id, 'Deactivated user', 'user', id, null);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, createUser, updateUser, deactivateUser };
