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

  const [rows] = await conn.query('SELECT student_id, student_name, qid, domain, category, answer FROM test_answers');
  console.log(`Total test_answers in DB: ${rows.length}`);
  
  const byStudent = {};
  for (const r of rows) {
    if (!byStudent[r.student_id]) byStudent[r.student_id] = [];
    byStudent[r.student_id].push(r);
  }

  for (const sid in byStudent) {
    const list = byStudent[sid];
    const domains = {};
    const categories = {};
    list.forEach(r => {
      domains[r.domain] = (domains[r.domain] || 0) + 1;
      categories[r.category] = (categories[r.category] || 0) + 1;
    });
    console.log(`\nStudent: ${sid} (${list[0].student_name}) - Total answers: ${list.length}`);
    console.log('Domains in DB:', domains);
    console.log('Categories in DB:', categories);
    console.log('Sample answers:');
    list.slice(0, 5).forEach(r => console.log(`  [${r.qid}] (${r.domain} / ${r.category}): "${r.answer}"`));
  }

  await conn.end();
}

main().catch(console.error);
