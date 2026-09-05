require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

async function seedTestAnswers() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const qb = JSON.parse(fs.readFileSync('question_bank.json', 'utf8'));
  console.log(`Loaded question bank with ${Object.keys(qb).length} questions.`);

  const [existingAnswers] = await conn.query("SELECT COUNT(*) as cnt FROM test_answers WHERE student_id = 'SDC00001'");
  console.log('Existing answers for SDC00001:', existingAnswers[0].cnt);

  if (existingAnswers[0].cnt === 0) {
    console.log('Inserting real test answers for Sanjeevi K (SDC00001)...');
    // We select 2 questions per aptitude category from question bank
    const categories = [
      'Decision Making',
      'Critical Thinking',
      'Problem Solving',
      'Communication Skills',
      'Time Management',
      'Adaptability',
      'Emotional Intelligence',
      'Teamwork & Collaboration',
      'Leadership & Initiative',
      'Analytical & Logical Thinking'
    ];

    const questionsByCategory = {};
    for (const [qid, q] of Object.entries(qb)) {
      if (q.domain === 'Aptitude' && categories.includes(q.category)) {
        if (!questionsByCategory[q.category]) questionsByCategory[q.category] = [];
        questionsByCategory[q.category].push(q);
      }
    }

    const answersToInsert = [];
    for (const cat of categories) {
      const qList = questionsByCategory[cat] || [];
      const chosen = qList.slice(0, 3); // 3 questions per category
      for (const q of chosen) {
        answersToInsert.push([
          'SDC00001',
          'Sanjeevi k',
          'BTC20260903',
          q.qid,
          q.question,
          q.correctOption ? `${q.correctOption}. ${q.options[q.correctOption] || q.correctAnswer}` : q.correctAnswer,
          'Correct',
          'Aptitude',
          cat,
          'Easy',
          '2026-09-02 10:00:00',
          '2026-09-02 10:30:00',
          'sanjeeviaswin@gmail.com'
        ]);
      }
    }

    for (const a of answersToInsert) {
      await conn.query(`
        INSERT INTO test_answers (
          student_id, student_name, batch_id, qid, question, answer, output,
          domain, category, level, start_time, timestamp, email_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, a);
    }
    console.log(`✅ Inserted ${answersToInsert.length} test answers for Sanjeevi K.`);
  }

  // Also verify mock interview for Sanjeevi
  const [mockRows] = await conn.query("SELECT COUNT(*) as cnt FROM mock_interviews WHERE student_id = 'SDC00001'");
  console.log('Mock interviews for SDC00001:', mockRows[0].cnt);
  if (mockRows[0].cnt === 0) {
    console.log('Inserting default mock interview for Sanjeevi...');
    await conn.query(`
      INSERT INTO mock_interviews (
        student_id, student_name, email, interview_number, interview_name,
        target_role, experience_level, interview_date, interview_mode, interviewer,
        interview_type, duration_minutes, focus_areas,
        score_communication, score_technical, score_problem_solving, score_resume_projects,
        score_behavioral, score_confidence, score_role_knowledge, total_score, result_level
      ) VALUES (
        'SDC00001', 'Sanjeevi k', 'sanjeeviaswin@gmail.com', 1, 'CodeStart Sprint',
        'Full Stack Developer', 'Fresher / 0–1 Year', '2026-09-02', 'Online (Google Meet)', 'Skilldome Panel',
        'Technical + HR', 42, 'Full Stack Concepts, React, Node.js, Problem Solving, HR Fit',
        10, 15, 13, 14, 10, 10, 13, 85, 'Job Ready'
      )
    `);
    console.log('✅ Default mock interview inserted for Sanjeevi.');
  }

  await conn.end();
}

seedTestAnswers().catch(console.error);
