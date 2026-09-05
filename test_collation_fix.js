require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const sql = `
    SELECT m.id, m.student_id, m.student_name, c.photo
    FROM mock_interviews m
    LEFT JOIN candidate_registrations c ON (m.student_id COLLATE utf8mb4_unicode_ci = c.student_id COLLATE utf8mb4_unicode_ci)
  `;
  const [rows] = await conn.query(sql);
  console.log('Success! Rows:', rows.length);
  if (rows.length > 0) {
    console.log('Row 0:', rows[0].student_name, 'Photo len:', rows[0].photo ? rows[0].photo.length : 0);
  }

  await conn.end();
}

test().catch(console.error);
