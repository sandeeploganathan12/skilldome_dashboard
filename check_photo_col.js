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

  const [rows] = await conn.query('SELECT id, student_id, full_name, email, photo FROM candidate_registrations');
  console.log(`Found ${rows.length} candidates in candidate_registrations:`);
  for (const r of rows) {
    const hasPhoto = !!r.photo;
    const photoLen = r.photo ? r.photo.length : 0;
    const preview = r.photo ? r.photo.substring(0, 60) + '...' : 'NULL';
    console.log(`- ID:${r.id}, StudentID:${r.student_id}, Name:${r.full_name}, Email:${r.email}`);
    console.log(`  Photo present: ${hasPhoto}, Length: ${photoLen}, Preview: ${preview}`);
  }

  await conn.end();
}

main().catch(console.error);
