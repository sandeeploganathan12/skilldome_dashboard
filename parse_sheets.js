const fs = require('fs');

const file1 = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\.system_generated\\steps\\1259\\content.md';
const file2 = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\.system_generated\\steps\\1268\\content.md';

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('Title:') && !l.startsWith('Description:') && !l.startsWith('Source:') && !l.startsWith('---'));
  if (lines.length === 0) return [];
  const header = lines[0];
  console.log('Header:', header);
  
  // simple csv parser handling quotes
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

console.log('=== FILE 1: Aptitude Q&A (gid=427781952) ===');
const content1 = fs.readFileSync(file1, 'utf8');
const rows1 = parseCSV(content1);
console.log('Total rows in Aptitude Q&A:', rows1.length);
const domains1 = {};
const categories1 = {};
rows1.forEach(r => {
  // S No,Questions,QID,Domain,Category,A,B,C,D,Correct Option,Answer
  const qid = r[2];
  const dom = r[3];
  const cat = r[4];
  domains1[dom] = (domains1[dom] || 0) + 1;
  categories1[cat] = (categories1[cat] || 0) + 1;
});
console.log('Domains in Aptitude Q&A:', domains1);
console.log('Categories in Aptitude Q&A:', categories1);

console.log('\n=== FILE 2: Questions (gid=0) ===');
const content2 = fs.readFileSync(file2, 'utf8');
const rows2 = parseCSV(content2);
console.log('Total rows in Questions tab:', rows2.length);
const domains2 = {};
const categories2 = {};
rows2.forEach(r => {
  // S No,Questions,QID,Domain,Category,Type,A,B,C,D,Answer,Output,Input
  const qid = r[2];
  const dom = r[3];
  const cat = r[4];
  domains2[dom] = (domains2[dom] || 0) + 1;
  if (!categories2[dom]) categories2[dom] = {};
  categories2[dom][cat] = (categories2[dom][cat] || 0) + 1;
});
console.log('Domains in Questions tab:', domains2);
console.log('Categories per Domain in Questions tab:');
for (const d in categories2) {
  console.log(`-- ${d} (${Object.keys(categories2[d]).length} categories):`, Object.keys(categories2[d]));
}
