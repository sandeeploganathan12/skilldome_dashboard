require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPrivileges() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [grants] = await conn.query('SHOW GRANTS FOR CURRENT_USER();');
    console.log('Grants:', grants);

    // Check if we can create a view or table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS _test_check (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50)
      );
    `);
    console.log('Table creation succeeded!');
    await conn.query('DROP TABLE IF EXISTS _test_check;');
    console.log('Drop table succeeded!');

    await conn.end();
  } catch (err) {
    console.error('Privilege check error:', err.message);
  }
}

checkPrivileges();
