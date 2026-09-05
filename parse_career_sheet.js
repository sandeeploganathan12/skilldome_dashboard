const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3fde0c60-d762-4d49-a90d-252951a989cc\\.system_generated\\steps\\41\\content.md';
const content = fs.readFileSync(filePath, 'utf8');

function parseCSV(text) {
  let p = text.indexOf('---');
  if (p !== -1) text = text.substring(p + 3).trim();
  const rows = [];
  let row = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(current.trim());
      if (row.some(c => c.length > 0)) rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (row.length > 0) {
    row.push(current.trim());
    if (row.some(c => c.length > 0)) rows.push(row);
  }
  return rows;
}

const rows = parseCSV(content);
console.log('Total rows:', rows.length);
console.log('Headers:', rows[0]);

// Let's inspect different row patterns
const sampleByDesignation = {};
rows.slice(1).forEach((r, idx) => {
  // Let's identify the group name
  let group = r[5] || r[4] || '';
  if (group.startsWith('₹')) {
    // Column shifted? Let's check r[6] or other cols
    group = r[6] || r[5] || r[4];
  }
  if (!sampleByDesignation[group]) {
    sampleByDesignation[group] = [];
  }
  sampleByDesignation[group].push(r);
});

console.log('\nAll unique group keys:');
Object.keys(sampleByDesignation).sort().forEach(k => {
  const items = sampleByDesignation[k];
  console.log(`Key: "${k}" (${items.length} rows) - Example row:`, JSON.stringify(items[0].slice(0, 6)));
});

