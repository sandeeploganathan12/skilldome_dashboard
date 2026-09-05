const mysql = require('mysql2/promise');
require('dotenv').config();

async function showColumns() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [cols] = await conn.query('SHOW COLUMNS FROM candidate_registrations');
  console.log(cols.map(c => c.Field));
  await conn.end();
}

showColumns();
