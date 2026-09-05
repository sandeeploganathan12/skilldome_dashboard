require('dotenv').config();
const mysql = require('mysql2/promise');

async function testJoin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [candidates] = await conn.query('SELECT * FROM candidate_registrations');
  const [testAnswers] = await conn.query('SELECT * FROM test_answers');

  console.log(`Candidates: ${candidates.length}, Answers: ${testAnswers.length}`);

  // Distinct students in test_answers
  const answerStudents = {};
  for (const a of testAnswers) {
    const key = (a.email_id || a.student_id).toLowerCase().trim();
    if (!answerStudents[key]) {
      answerStudents[key] = {
        student_id: a.student_id,
        full_name: a.student_name,
        email: a.email_id,
        answers: []
      };
    }
    answerStudents[key].answers.push(a);
  }

  console.log('\nStudents in test_answers:');
  for (const k in answerStudents) {
    const s = answerStudents[k];
    console.log(`- ${s.full_name} (${s.student_id}, ${s.email}): ${s.answers.length} answers`);
  }

  await conn.end();
}

testJoin().catch(console.error);
