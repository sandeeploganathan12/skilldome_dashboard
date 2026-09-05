const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateHarshini() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [res] = await pool.query(
    "UPDATE candidate_registrations SET interested_domain = 'Recruiter' WHERE student_id = 'SDC00003'"
  );
  console.log('Update result:', res);

  const [rows] = await pool.query("SELECT student_id, full_name, department, interested_domain FROM candidate_registrations WHERE student_id = 'SDC00003'");
  console.log('Updated Harshini:', rows);

  await pool.end();
}

updateHarshini().catch(console.error);
