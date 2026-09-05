const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const lines = html.split('\n');

const keywords = [
  'rec-career-table',
  'scorecard-main',
  'scorecard-container',
  'area-scores-card',
  'area-bars-container',
  'mid-analytics-grid',
  'bottom-action-grid',
  'action-card',
  'technical-test',
  'top-analytics-grid'
];

for (let i = 1600; i < 2510; i++) {
  const line = lines[i];
  for (const kw of keywords) {
    if (line.includes(kw)) {
      console.log(`Line ${i + 1}: ${line}`);
    }
  }
}
