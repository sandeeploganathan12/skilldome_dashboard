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

  const [candidates] = await pool.query("SELECT * FROM candidate_registrations WHERE full_name LIKE '%harshini%' OR email LIKE '%harshini%'");
  console.log('Candidates matching Harshini:', JSON.stringify(candidates, null, 2));

  const [all] = await pool.query("SELECT id, student_id, full_name, email, department, college_name, interested_domain FROM candidate_registrations");
  console.log('All candidates:', JSON.stringify(all, null, 2));

  await pool.end();
}

check().catch(console.error);
