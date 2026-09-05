const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');
const styleBlock = html.substring(html.indexOf('<style>'), html.indexOf('</style>'));

const targets = ['rec-career-table', 'mock-breakdown-table', 'crm-progression-table', 'rec-table-wrapper', 'scorecard-main', 'monogram', 'cardStudentInitials'];

for (const t of targets) {
  let count = 0;
  let pos = 0;
  while ((pos = styleBlock.indexOf(t, pos)) !== -1) {
    count++;
    pos += t.length;
  }
  console.log(`${t} in <style>: ${count} times`);
}

// Show where rec-career-table or mock-breakdown-table or crm-progression-table are in <style>
const lines = styleBlock.split('\n');
lines.forEach((l, i) => {
  for (const t of targets) {
    if (l.includes(t)) {
      console.log(`Line ${i + 13}: ${l.trim()}`);
      break;
    }
  }
});
