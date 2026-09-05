require('dotenv').config();
const mysql = require('mysql2/promise');

async function testStarterQueries() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  });

  console.log('Testing starter query 1: Categories for domain Coding...');
  const [q1] = await pool.query(
    'SELECT StudentID, Category, Domain, Score, AssessmentDate FROM assessment_scores WHERE Domain = ?',
    ['Coding']
  );
  console.log(`Q1 count: ${q1.length}`, q1[0]);

  console.log('Testing starter query 2: All scores for STU-1001...');
  const [q2] = await pool.query(
    'SELECT Category, Domain, Score, AssessmentDate FROM assessment_scores WHERE StudentID = ?',
    ['STU-1001']
  );
  console.log(`Q2 count: ${q2.length}`, q2);

  console.log('Testing starter query 3: Student profile for STU-1001...');
  const [q3] = await pool.query(
    'SELECT StudentID, Name, Email, Degree, College, GraduationYear, TargetCareer, PhotoURL FROM students WHERE StudentID = ?',
    ['STU-1001']
  );
  console.log(`Q3 student:`, q3[0]);

  console.log('Testing starter query 4: Admin summary list...');
  const [q4] = await pool.query(
    'SELECT StudentID, AVG(Score) AS OverallScore FROM assessment_scores GROUP BY StudentID'
  );
  console.log(`Q4 summaries:`, q4);

  await pool.end();
}

testStarterQueries().catch(console.error);
