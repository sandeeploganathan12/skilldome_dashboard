const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');
const html = fs.readFileSync('public/index.html', 'utf-8');
const js = fs.readFileSync('public/app.js', 'utf-8');

console.log('--- CSS Table Matches ---');
const tableClasses = ['rec-career-table', 'mock-breakdown-table', 'crm-progression-table'];
for (const cls of tableClasses) {
  let count = 0;
  let pos = 0;
  while ((pos = css.indexOf(cls, pos)) !== -1) {
    count++;
    pos += cls.length;
  }
  console.log(`${cls}: found ${count} times in styles.css`);
}

// Check scorecard container
console.log('scorecard-container in css:', css.indexOf('scorecard-container') !== -1);
console.log('scorecard-sidebar in css:', css.indexOf('scorecard-sidebar') !== -1);
console.log('scorecard-main in css:', css.indexOf('scorecard-main') !== -1);
