require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('--- TEST ANSWERS COUNT & DOMAINS ---');
  const [domainRows] = await conn.query('SELECT domain, category, COUNT(*) as cnt FROM test_answers GROUP BY domain, category');
  console.table(domainRows);

  console.log('\n--- SAMPLE 10 ROWS FROM TEST_ANSWERS ---');
  const [sampleRows] = await conn.query('SELECT id, student_id, student_name, qid, domain, category, answer, output FROM test_answers LIMIT 10');
  console.table(sampleRows);

  console.log('\n--- CANDIDATES IN TEST_ANSWERS ---');
  const [candRows] = await conn.query('SELECT DISTINCT student_id, student_name, email_id FROM test_answers');
  console.table(candRows);

  await conn.end();
}

main().catch(console.error);
