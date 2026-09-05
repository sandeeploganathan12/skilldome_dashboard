const fs = require('fs');

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

const questionBank = {};

// 1. Aptitude Q&A (gid=427781952)
const rows1 = parseCSV(fs.readFileSync(fileAptitude, 'utf8'));
rows1.forEach(r => {
  // S No,Questions,QID,Domain,Category,A,B,C,D,Correct Option,Answer
  const rawQid = (r[2] || '').trim();
  const key = rawQid.toLowerCase();
  const qText = (r[1] || '').trim();
  const category = (r[4] || '').trim();
  const optA = (r[5] || '').trim();
  const optB = (r[6] || '').trim();
  const optC = (r[7] || '').trim();
  const optD = (r[8] || '').trim();
  const correctOpt = (r[9] || '').trim().toUpperCase();
  const ansText = (r[10] || '').trim();

  if (key) {
    questionBank[key] = {
      qid: rawQid,
      question: qText,
      domain: 'Aptitude',
      category: category,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctOption: correctOpt,
      correctAnswer: ansText
    };
  }
});

// 2. Questions tab (gid=0)
const rows2 = parseCSV(fs.readFileSync(fileQuestions, 'utf8'));
rows2.forEach(r => {
  // S No,Questions,QID,Domain,Category,Type,A,B,C,D,Answer,Output,Input
  const rawQid = (r[2] || '').trim();
  const key = rawQid.toLowerCase();
  const qText = (r[1] || '').trim();
  let domain = (r[3] || '').trim();
  const category = (r[4] || '').trim();
  const optA = (r[6] || '').trim();
  const optB = (r[7] || '').trim();
  const optC = (r[8] || '').trim();
  const optD = (r[9] || '').trim();
  const ans = (r[10] || '').trim();

  if (domain === 'Non Coding') domain = 'Non-Coding';

  let correctOpt = '';
  let ansText = ans;
  if (/^[A-D]$/i.test(ans)) {
    correctOpt = ans.toUpperCase();
    const optIdx = correctOpt.charCodeAt(0) - 65;
    ansText = r[6 + optIdx] || '';
  }

  if (key && (domain === 'Coding' || domain === 'Non-Coding' || domain === 'Aptitude')) {
    // If not already set by Aptitude Q&A tab, or set with domain
    if (!questionBank[key] || questionBank[key].domain !== 'Aptitude') {
      questionBank[key] = {
        qid: rawQid,
        question: qText,
        domain: domain,
        category: category,
        options: { A: optA, B: optB, C: optC, D: optD },
        correctOption: correctOpt,
        correctAnswer: ansText
      };
    }
  }
});

fs.writeFileSync('question_bank.json', JSON.stringify(questionBank, null, 2), 'utf8');
console.log(`Saved question_bank.json with ${Object.keys(questionBank).length} verified questions.`);
