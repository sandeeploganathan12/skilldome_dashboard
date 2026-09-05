const mysql = require('mysql2/promise');
require('dotenv').config();

async function listCandidates() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await conn.query('SELECT student_id, full_name, email FROM candidate_registrations LIMIT 10');
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

listCandidates();
