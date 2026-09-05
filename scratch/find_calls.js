const fs = require('fs');
const code = fs.readFileSync('public/app.js', 'utf-8');
const lines = code.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('renderTechnicalTestBars') || l.includes('renderAptitude') || l.includes('assessmentAreaBars')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
