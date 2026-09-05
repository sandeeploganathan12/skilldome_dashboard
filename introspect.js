require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectData() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000
    });

    const [candidates] = await conn.query('SELECT student_id, full_name, email, degree, college_name, interested_domain FROM candidate_registrations');
    console.log('Candidates count:', candidates.length);
    console.log('Candidates:', candidates);

    const [answersCount] = await conn.query('SELECT COUNT(*) as cnt FROM test_answers');
    console.log('Test answers total count:', answersCount[0].cnt);

    const [domains] = await conn.query('SELECT DISTINCT domain FROM test_answers');
    console.log('Distinct domains in test_answers:', domains);

    const [categories] = await conn.query('SELECT DISTINCT domain, category FROM test_answers');
    console.log('Distinct categories:', categories);

    const [studentsInAnswers] = await conn.query('SELECT DISTINCT student_id, student_name, email_id FROM test_answers');
    console.log('Distinct students in test_answers:', studentsInAnswers);

    const [users] = await conn.query('SELECT * FROM users');
    console.log('Users count:', users.length);

    await conn.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectData();
