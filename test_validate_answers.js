require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

const fileAptitude = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\.system_generated\\steps\\1259\\content.md';
const fileQuestions = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\.system_generated\\steps\\1268\\content.md';

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('Title:') && !l.startsWith('Description:') && !l.startsWith('Source:') && !l.startsWith('---'));
  if (lines.length === 0) return [];
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    rows.push(cells);
  }
  return rows;
}

// Build question bank
const questionBank = new Map();

// 1. Aptitude Q&A
const rows1 = parseCSV(fs.readFileSync(fileAptitude, 'utf8'));
rows1.forEach(r => {
  // S No,Questions,QID,Domain,Category,A,B,C,D,Correct Option,Answer
  const qid = (r[2] || '').trim().toLowerCase();
  const qText = (r[1] || '').trim();
  const domain = (r[3] || 'Aptitude').trim();
  const category = (r[4] || '').trim();
  const optA = (r[5] || '').trim();
  const optB = (r[6] || '').trim();
  const optC = (r[7] || '').trim();
  const optD = (r[8] || '').trim();
  const correctOpt = (r[9] || '').trim().toUpperCase();
  const ansText = (r[10] || '').trim();

  const item = {
    qid: r[2],
    question: qText,
    domain: 'Aptitude', // Aptitude Q&A is strictly Aptitude
    category,
    options: { A: optA, B: optB, C: optC, D: optD },
    correctOption: correctOpt,
    correctAnswer: ansText
  };

  if (qid) questionBank.set(qid, item);
});

// 2. Questions tab (Coding & Non Coding)
const rows2 = parseCSV(fs.readFileSync(fileQuestions, 'utf8'));
rows2.forEach(r => {
  // S No,Questions,QID,Domain,Category,Type,A,B,C,D,Answer,Output,Input
  const rawQid = (r[2] || '').trim();
  const qid = rawQid.toLowerCase();
  const qText = (r[1] || '').trim();
  const domain = (r[3] || '').trim();
  const category = (r[4] || '').trim();
  const optA = (r[6] || '').trim();
  const optB = (r[7] || '').trim();
  const optC = (r[8] || '').trim();
  const optD = (r[9] || '').trim();
  const ans = (r[10] || '').trim();

  // If answer is single letter A, B, C, D
  let correctOpt = '';
  let ansText = ans;
  if (/^[A-D]$/i.test(ans)) {
    correctOpt = ans.toUpperCase();
    ansText = r[6 + (ans.toUpperCase().charCodeAt(0) - 65)] || '';
  }

  if (rawQid && (domain === 'Coding' || domain === 'Non Coding' || domain === 'Aptitude')) {
    questionBank.set(qid, {
      qid: rawQid,
      question: qText,
      domain: domain === 'Non Coding' ? 'Non-Coding' : domain,
      category,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctOption: correctOpt,
      correctAnswer: ansText
    });
  }
});

console.log(`Indexed ${questionBank.size} questions into Question Bank.`);

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function checkAnswer(qid, studentAnswer) {
  if (!studentAnswer) return false;
  const q = questionBank.get((qid || '').toLowerCase().trim());
  if (!q) {
    console.log(`⚠️ QID not found in question bank: "${qid}"`);
    return false;
  }

  const ansTrim = studentAnswer.trim();
  const ansUpper = ansTrim.toUpperCase();

  // 1. Single letter option match (e.g. "B")
  if (q.correctOption && ansUpper === q.correctOption) {
    return true;
  }

  // 2. Option prefix match (e.g. "B. Choose based on priority and impact" or "B)")
  if (q.correctOption && ansUpper.startsWith(q.correctOption + '.') || ansUpper.startsWith(q.correctOption + ')')) {
    return true;
  }

  // 3. Match normalized answer text with correct answer text
  const normStudent = normalize(studentAnswer);
  const normCorrect = normalize(q.correctAnswer);

  if (normCorrect && normStudent === normCorrect) {
    return true;
  }

  // 4. Match student answer with the text of the correct option
  if (q.correctOption && q.options[q.correctOption]) {
    const normOptText = normalize(q.options[q.correctOption]);
    if (normOptText && normStudent === normOptText) {
      return true;
    }
  }

  return false;
}

async function validateRealData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.query('SELECT student_id, student_name, qid, domain, category, answer FROM test_answers');

  const students = {};
  for (const r of rows) {
    if (!students[r.student_id]) {
      students[r.student_id] = { name: r.student_name, answers: [] };
    }
    students[r.student_id].answers.push(r);
  }

  for (const sid in students) {
    const s = students[sid];
    console.log(`\n========================================`);
    console.log(`VALIDATING: ${sid} (${s.name})`);
    console.log(`========================================`);

    const catStats = {};
    for (const ans of s.answers) {
      // Lookup proper domain & category from question bank
      const qMeta = questionBank.get((ans.qid || '').toLowerCase().trim());
      const properDomain = qMeta ? qMeta.domain : (ans.domain === 'Non-Coding' ? 'Aptitude' : ans.domain);
      const properCategory = qMeta ? qMeta.category : ans.category;

      const isCorrect = checkAnswer(ans.qid, ans.answer);

      if (!catStats[properCategory]) {
        catStats[properCategory] = { domain: properDomain, total: 0, correct: 0, wrongExamples: [] };
      }
      catStats[properCategory].total++;
      if (isCorrect) {
        catStats[properCategory].correct++;
      } else {
        const correctInfo = qMeta ? (qMeta.correctOption ? `${qMeta.correctOption}: ${qMeta.correctAnswer}` : qMeta.correctAnswer) : 'N/A';
        catStats[properCategory].wrongExamples.push({
          qid: ans.qid,
          given: ans.answer,
          expected: correctInfo
        });
      }
    }

    console.log('--- TEST 1: APTITUDE & CORE COMPETENCIES ---');
    for (const cat in catStats) {
      if (catStats[cat].domain === 'Aptitude') {
        const stat = catStats[cat];
        const pct = Math.round((stat.correct / stat.total) * 100);
        console.log(`  ${cat.padEnd(30)}: ${stat.correct}/${stat.total} (${pct}%)`);
        if (stat.wrongExamples.length > 0) {
          stat.wrongExamples.forEach(w => {
            console.log(`    ❌ [${w.qid}] Given: "${w.given}" | Expected: "${w.expected}"`);
          });
        }
      }
    }

    console.log('\n--- TEST 2: TECHNICAL & DOMAIN SKILLS (Coding / Non-Coding) ---');
    let hasTechnical = false;
    for (const cat in catStats) {
      if (catStats[cat].domain !== 'Aptitude') {
        hasTechnical = true;
        const stat = catStats[cat];
        const pct = Math.round((stat.correct / stat.total) * 100);
        console.log(`  [${stat.domain}] ${cat.padEnd(25)}: ${stat.correct}/${stat.total} (${pct}%)`);
        if (stat.wrongExamples.length > 0) {
          stat.wrongExamples.forEach(w => {
            console.log(`    ❌ [${w.qid}] Given: "${w.given}" | Expected: "${w.expected}"`);
          });
        }
      }
    }
    if (!hasTechnical) {
      console.log('  ⚠️ (None attended - Technical Test Not Attended Yet)');
    }
  }

  await conn.end();
}

validateRealData().catch(console.error);
