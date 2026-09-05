const fs = require('fs');
const css = fs.readFileSync('public/styles.css', 'utf-8');
const lines = css.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('rec-career-table')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
