const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSanthosh() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [all] = await conn.query('SELECT * FROM mock_interviews ORDER BY id DESC LIMIT 10');
    console.log('Total mock interviews in DB:', all.length);
    console.table(all.map(r => ({
      id: r.id,
      student_id: r.student_id,
      student_name: r.student_name,
      total_score: r.total_score,
      created_at: r.created_at
    })));

    const [marks] = await conn.query('SELECT * FROM mock_interview_marks ORDER BY id DESC LIMIT 14');
    console.log('\nRecent mock_interview_marks in DB:');
    console.table(marks.map(m => ({
      mock_id: m.mock_interview_id,
      student_id: m.student_id,
      area: m.evaluation_area,
      max: m.max_score,
      given: m.given_score
    })));

  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

checkSanthosh();
