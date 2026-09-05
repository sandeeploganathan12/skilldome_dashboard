const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAnswers() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await conn.query('SELECT DISTINCT student_id, student_name, email_id, COUNT(*) as count FROM test_answers GROUP BY student_id, student_name, email_id');
  console.log('Distinct students in test_answers:', rows);
  await conn.end();
}

checkAnswers();
