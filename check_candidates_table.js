require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [candidates] = await conn.query('SELECT id, student_id, full_name, email FROM candidate_registrations');
  console.log('Candidates in candidate_registrations:');
  console.table(candidates);

  const [answers] = await conn.query('SELECT DISTINCT student_id, student_name, email_id FROM test_answers');
  console.log('\nDistinct students in test_answers:');
  console.table(answers);

  await conn.end();
}

main().catch(console.error);
