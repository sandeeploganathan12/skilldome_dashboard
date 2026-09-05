require('dotenv').config();
const mysql = require('mysql2/promise');

async function inspectTestAnswersDetail() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.query('SELECT qid, domain, category, level, answer, output, timestamp FROM test_answers');
  console.log(`Total rows: ${rows.length}`);
  console.table(rows);

  // Let's check distinct answers per category
  const categories = {};
  for (const r of rows) {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push({ qid: r.qid, answer: r.answer, output: r.output });
  }
  console.log('\nCategories and answers:');
  console.log(JSON.stringify(categories, null, 2));

  await conn.end();
}

inspectTestAnswersDetail().catch(console.error);
