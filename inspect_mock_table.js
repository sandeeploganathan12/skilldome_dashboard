const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectMockTable() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    const [cols] = await conn.query('SHOW COLUMNS FROM mock_interviews');
    console.log('Columns in mock_interviews:');
    console.table(cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Default: c.Default })));

    const [rows] = await conn.query('SELECT * FROM mock_interviews LIMIT 5');
    console.log('\nSample rows in mock_interviews:', rows.length);
    if (rows.length > 0) {
      console.log(JSON.stringify(rows[0], null, 2));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await conn.end();
  }
}

inspectMockTable();
