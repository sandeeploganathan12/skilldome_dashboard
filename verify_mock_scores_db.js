const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDb() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('=== Mock Interview Table records ===');
    const [interviews] = await conn.query('SELECT id, student_id, student_name, total_score, evaluation_scores_json FROM mock_interviews');
    for (const row of interviews) {
      console.log(`\nInterview ID: ${row.id} | Student: ${row.student_id} (${row.student_name}) | Total: ${row.total_score}`);
      const parsed = JSON.parse(row.evaluation_scores_json || '[]');
      console.table(parsed.map(p => ({
        Area: p.area,
        'Max Score': p.max_score,
        'Given Score': p.given_score,
        '%': p.percentage + '%'
      })));
    }

    console.log('\n=== Mock Interview Marks Companion Table (first 14 rows) ===');
    const [marks] = await conn.query('SELECT mock_interview_id, student_id, student_name, area_number, evaluation_area, max_score, given_score, percentage FROM mock_interview_marks LIMIT 14');
    console.table(marks);

  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

checkDb();
