const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function findUserWithRoleByEmail(email) {
  const [rows] = await db.query(
    `SELECT u.*, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

// POST /api/auth/register
// Public self-registration is intentionally limited to the Firefighter
// role. Admin/Dispatcher accounts are provisioned by an Admin via the
// Manage Users screen (not built in this phase).
async function register(req, res, next) {
  try {
    const { name, email, password, stationId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await findUserWithRoleByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const [[firefighterRole]] = await db.query(`SELECT id FROM roles WHERE name = 'Firefighter'`);
    if (!firefighterRole) {
      return res.status(500).json({ message: 'Roles are not seeded. Run the schema + seed scripts first.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash, role_id, station_id) VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, firefighterRole.id, stationId || null]
    );

    await db.query(
      `INSERT INTO firefighters (user_id, station_id, status) VALUES (?, ?, 'Off Duty')`,
      [result.insertId, stationId || null]
    );

    const user = { id: result.insertId, name, email, role: 'Firefighter' };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await findUserWithRoleByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.station_id
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/forgot-password
// Always responds with a generic success message so the endpoint can't be
// used to enumerate which emails have accounts. The raw token is only
// ever logged server-side / returned in dev — a real deploy would email it.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });

    const user = await findUserWithRoleByEmail(email);
    const generic = { message: 'If an account exists for that email, a reset link has been sent.' };

    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30);

    await db.query(
      `UPDATE users
       SET reset_token_hash = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL ? MINUTE)
       WHERE id = ?`,
      [tokenHash, ttlMinutes, user.id]
    );

    // Dev-mode convenience: in production this line is replaced by an
    // email send and rawToken must never be returned in the response.
    console.log(`[FireSYS] Password reset token for ${email}: ${rawToken}`);
    const devPayload = process.env.NODE_ENV === 'production' ? generic : { ...generic, devToken: rawToken };

    res.json(devPayload);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      `SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires > NOW()`,
      [tokenHash]
    );
    const user = rows[0];
    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query(
      `UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?`,
      [passwordHash, user.id]
    );

    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };
