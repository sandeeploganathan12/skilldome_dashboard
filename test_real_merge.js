require('dotenv').config();
const mysql = require('mysql2/promise');

async function testRealMerge() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [candidates] = await conn.query('SELECT * FROM candidate_registrations');
  const [answers] = await conn.query('SELECT * FROM test_answers');

  console.log(`Candidates: ${candidates.length}`);
  console.log(`Answers: ${answers.length}`);

  // Negative answer strings for scoring
  const negativePhrases = [
    'stop communicating',
    'say you are on track and figure it out later',
    'ignore the problem',
    'blame',
    'refuse'
  ];

  function isAnswerCorrect(ans) {
    if (!ans) return false;
    const lower = ans.toLowerCase().trim();
    for (const phrase of negativePhrases) {
      if (lower.includes(phrase)) return false;
    }
    return true;
  }

  // Group answers by student (by student_id or email)
  const answersByEmail = {};
  for (const a of answers) {
    const emailKey = (a.email_id || '').toLowerCase().trim();
    if (!answersByEmail[emailKey]) answersByEmail[emailKey] = [];
    answersByEmail[emailKey].push(a);
  }

  candidates.forEach(c => {
    const emailKey = (c.email || '').toLowerCase().trim();
    const studentAnswers = answersByEmail[emailKey] || [];

    console.log(`\nCandidate: ${c.full_name} (${c.student_id}) - Email: ${c.email}`);
    console.log(`Total test answers found: ${studentAnswers.length}`);

    // Category breakdown
    const catMap = {};
    studentAnswers.forEach(a => {
      if (!catMap[a.category]) {
        catMap[a.category] = {
          domain: a.domain || 'Non-Coding',
          total: 0,
          correct: 0,
          latestDate: a.timestamp || a.start_time
        };
      }
      catMap[a.category].total++;
      if (isAnswerCorrect(a.answer)) {
        catMap[a.category].correct++;
      }
    });

    console.log('Category Scores:');
    let totalScore = 0;
    let catCount = 0;
    for (const [cat, data] of Object.entries(catMap)) {
      const score = Math.round((data.correct / data.total) * 100);
      totalScore += score;
      catCount++;
      console.log(`  - ${cat} (${data.domain}): ${score}% (${data.correct}/${data.total} correct)`);
    }

    const overallAvg = catCount > 0 ? Math.round(totalScore / catCount) : 0;
    console.log(`Overall Readiness Score: ${overallAvg}/100`);
  });

  await conn.end();
}

testRealMerge().catch(console.error);
