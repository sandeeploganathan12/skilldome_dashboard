require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [t] = await conn.query('SHOW TABLES');
  console.log('Tables in DB:', t.map(x => Object.values(x)[0]));

  for (const tableObj of t) {
    const table = Object.values(tableObj)[0];
    const [cnt] = await conn.query(`SELECT COUNT(*) as count FROM \`${table}\``);
    console.log(`Table ${table}: ${cnt[0].count} rows`);
  }

  const [cands] = await conn.query('SELECT * FROM candidate_registrations');
  console.log('Candidates:', cands);

  const [distinctAns] = await conn.query('SELECT DISTINCT student_id, student_name, email_id FROM test_answers');
  console.log('Distinct test_answers students:', distinctAns);

  await conn.end();
}

test().catch(console.error);
