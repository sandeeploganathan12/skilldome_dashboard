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

  const [rows] = await conn.query('SELECT * FROM candidate_registrations');
  console.log('All candidate_registrations:');
  console.log(JSON.stringify(rows, null, 2));

  await conn.end();
}

main().catch(console.error);
