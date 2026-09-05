const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPhoto() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await conn.query("SELECT student_id, photo FROM candidate_registrations WHERE student_id = 'SDC00001'");
  if (rows.length > 0 && rows[0].photo) {
    console.log('Photo starts with:', rows[0].photo.substring(0, 50));
    console.log('Photo length:', rows[0].photo.length);
    const base64Data = rows[0].photo.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync('test_photo_out.jpg', Buffer.from(base64Data, 'base64'));
    console.log('Wrote test_photo_out.jpg');
  } else {
    console.log('No photo in DB');
  }
  await conn.end();
}
checkPhoto();
