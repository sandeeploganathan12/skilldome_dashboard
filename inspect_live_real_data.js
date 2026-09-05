require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectAllRealData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('=== CANDIDATE REGISTRATIONS ===');
  const [candidates] = await conn.query('SELECT * FROM candidate_registrations');
  console.log(`Count: ${candidates.length}`);
  console.log(JSON.stringify(candidates, null, 2));

  console.log('\n=== TEST ANSWERS ===');
  const [answers] = await conn.query('SELECT * FROM test_answers');
  console.log(`Count: ${answers.length}`);
  console.log(JSON.stringify(answers.slice(0, 10), null, 2)); // show first 10

  // Distinct students in test_answers vs candidate_registrations
  const [distinctAnswerStudents] = await conn.query('SELECT DISTINCT student_id, student_name, email_id, batch_id FROM test_answers');
  console.log('\n=== DISTINCT STUDENTS IN TEST ANSWERS ===');
  console.log(distinctAnswerStudents);

  // Group test answers by student, domain, category
  const [categoryBreakdown] = await conn.query(`
    SELECT student_id, email_id, domain, category, COUNT(*) as question_count
    FROM test_answers
    GROUP BY student_id, email_id, domain, category
    ORDER BY student_id, domain, category
  `);
  console.log('\n=== CATEGORY BREAKDOWN IN TEST ANSWERS ===');
  console.log(categoryBreakdown);

  // Inspect answer columns to see how score is determined
  const [sampleQ] = await conn.query('SELECT qid, question, answer, output, level, domain, category FROM test_answers LIMIT 5');
  console.log('\n=== SAMPLE QUESTIONS & ANSWERS ===');
  console.log(sampleQ);

  await conn.end();
}

inspectAllRealData().catch(console.error);
