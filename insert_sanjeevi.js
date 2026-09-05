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

  const [existing] = await conn.query('SELECT * FROM candidate_registrations WHERE email = ?', ['sanjeevikandasamy233@gmail.com']);
  if (existing.length === 0) {
    console.log('Inserting Sanjeevi k into candidate_registrations...');
    await conn.query(`
      INSERT INTO candidate_registrations (student_id, batch_id, full_name, email, phone, district_city, college_name, degree, department, current_status, interested_domain, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'SDC00008',
      'BTC20260903',
      'Sanjeevi k',
      'sanjeevikandasamy233@gmail.com',
      '9843212345',
      'Coimbatore',
      'SNR Sons College',
      'B.Sc',
      'Computer Science',
      'Graduate',
      'Full Stack Development'
    ]);
    console.log('✅ Sanjeevi k successfully registered in candidate_registrations with student_id SDC00008.');
  } else {
    console.log('Sanjeevi k already registered:', existing[0]);
  }

  // Also in test_answers, let's update student_id to SDC00008 where email_id = 'sanjeevikandasamy233@gmail.com'
  const [upd] = await conn.query("UPDATE test_answers SET student_id = 'SDC00008' WHERE email_id = 'sanjeevikandasamy233@gmail.com'");
  console.log(`✅ Updated ${upd.affectedRows} test_answers for Sanjeevi k to student_id SDC00008.`);

  // And for Santhosh, update test_answers student_id to SDC00001 where email_id = 'santhoshmani2605@gmail.com'
  const [upd2] = await conn.query("UPDATE test_answers SET student_id = 'SDC00001' WHERE email_id = 'santhoshmani2605@gmail.com'");
  console.log(`✅ Updated ${upd2.affectedRows} test_answers for Santhosh to student_id SDC00001.`);

  await conn.end();
}

main().catch(console.error);
