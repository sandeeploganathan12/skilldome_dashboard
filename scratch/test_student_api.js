const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [candidates] = await pool.query("SELECT * FROM candidate_registrations WHERE student_id = 'SDC00003'");
  const cand = candidates[0];
  console.log('Candidate:', {
    student_id: cand.student_id,
    full_name: cand.full_name,
    department: cand.department,
    interested_domain: cand.interested_domain,
    college_name: cand.college_name
  });

  // Check test_answers table schema
  const [cols] = await pool.query("DESCRIBE test_answers");
  console.log('test_answers columns:', cols.map(c => c.Field));

  const [answers] = await pool.query("SELECT * FROM test_answers WHERE student_id = 'SDC00003'");
  console.log('answers count for SDC00003:', answers.length);

  await pool.end();
}

test().catch(console.error);
