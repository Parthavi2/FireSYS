// Creates one demo account per role so the redesigned login screen has
// something to authenticate against out of the box.
// Run with: npm run seed:users  (after schema.sql + seed.sql have been applied)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');

const DEMO_PASSWORD = 'FireSys@2026';

const demoUsers = [
  { name: 'Ava Admin', email: 'admin@firesys.dev', role: 'Admin', stationId: 1 },
  { name: 'Dev Dispatcher', email: 'dispatcher@firesys.dev', role: 'Dispatcher', stationId: 1 },
  { name: 'Felix Firefighter', email: 'firefighter@firesys.dev', role: 'Firefighter', stationId: 1 },
];

async function run() {
  try {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    for (const u of demoUsers) {
      const [[role]] = await db.query('SELECT id FROM roles WHERE name = ?', [u.role]);
      if (!role) {
        console.error(`Role "${u.role}" not found — run schema.sql + seed.sql first.`);
        continue;
      }

      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length) {
        console.log(`Skipping ${u.email} (already exists)`);
        continue;
      }

      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, role_id, station_id) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, passwordHash, role.id, u.stationId]
      );

      if (u.role === 'Firefighter') {
        await db.query(
          `INSERT INTO firefighters (user_id, station_id, rank_title, status) VALUES (?, ?, 'Firefighter I', 'Available')`,
          [result.insertId, u.stationId]
        );
      }

      console.log(`Created ${u.role} account: ${u.email}`);
    }

    console.log(`\nDemo password for all seeded accounts: ${DEMO_PASSWORD}`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
