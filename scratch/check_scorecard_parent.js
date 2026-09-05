const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const lines = html.split('\n');
const idx = lines.findIndex(l => l.includes('id="scorecardPrintArea"'));
console.log(`Found scorecardPrintArea at line ${idx + 1}:`);
for (let i = Math.max(0, idx - 25); i < Math.min(lines.length, idx + 25); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
