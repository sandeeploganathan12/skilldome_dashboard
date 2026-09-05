const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [candidate] = await pool.query("SELECT * FROM candidate_registrations WHERE student_id = 'SDC00003' OR full_name LIKE '%Harshini%'");
  console.log('Candidate Harshini row:', JSON.stringify(candidate, null, 2));

  // Check test_answers or any assessment rows for Harshini
  const [testAnswers] = await pool.query("SELECT * FROM test_answers WHERE student_id = 'SDC00003' OR email = ? LIMIT 10", [candidate[0]?.email]);
  console.log('Test answers for Harshini count:', testAnswers.length);

  await pool.end();
}

check().catch(console.error);
