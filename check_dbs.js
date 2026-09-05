require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  const [dbs] = await conn.query('SHOW DATABASES');
  console.log('Databases on host:', dbs);

  await conn.end();
}

test().catch(console.error);
