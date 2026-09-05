const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf-8');
console.log('Evaluated technical marks in app.js:', js.includes('Evaluated technical marks'));
console.log('Production Projects on GitHub in app.js:', js.includes('Production Projects on GitHub'));
console.log('Solution Engineer in app.js:', js.includes('Solution Engineer'));

// Check where domains are defined in app.js
const lines = js.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Full Stack Development') || l.includes('Candidate Registered Target') || l.includes('Solution Engineer')) {
    console.log(`Line ${idx + 1}: ${l.trim()}`);
  }
});
