require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanMockTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Dropping temporary mock tables students and assessment_scores...');
  await conn.query('DROP TABLE IF EXISTS students;');
  await conn.query('DROP TABLE IF EXISTS assessment_scores;');
  
  const [tables] = await conn.query('SHOW TABLES;');
  console.log('Current real tables in u481861457_skilldome:', tables);

  const [candidates] = await conn.query('SELECT * FROM candidate_registrations');
  console.log(`\nReal candidate_registrations rows (${candidates.length}):`);
  console.log(candidates);

  const [answersCount] = await conn.query('SELECT COUNT(*) as count FROM test_answers');
  console.log(`\nReal test_answers rows: ${answersCount[0].count}`);

  await conn.end();
}

cleanMockTables().catch(console.error);
