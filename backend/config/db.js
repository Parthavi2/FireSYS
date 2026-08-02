const mysql = require('mysql2');

// Connection pool instead of a single connection: handles concurrent
// requests safely and reconnects automatically if a connection drops.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fire_dispatch',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Promise-based interface so controllers can use async/await
// instead of callback-style queries.
const db = pool.promise();

// Fail fast on startup if the database is unreachable, rather than
// discovering it on the first incoming request.
async function verifyConnection() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL connected');
    connection.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
}

module.exports = { db, verifyConnection };
