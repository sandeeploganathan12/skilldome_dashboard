const fs = require('fs');
const css = fs.readFileSync('public/styles.css', 'utf-8');

const printStart = css.indexOf('@media print');
const printBlock = css.substring(printStart);

console.log('Searching heights, paddings, margins in printBlock...');

const selectors = [
  '.scorecard-main',
  '.report-header',
  '.report-title',
  '.top-analytics-grid',
  '.readiness-card',
  '.radar-card',
  '.radar-container-large',
  '.radar-svg',
  '.gauge-container',
  '.mid-analytics-grid',
  '.area-scores-card',
  '.card-header-dark',
  '.area-table-header',
  '.area-bars-container',
  '.score-bar-row',
  '.technical-test-blank-card',
  '.recommended-career-section',
  '.rec-career-table',
  '.match-legend-bar',
  '.bottom-action-grid',
  '.action-card'
];

selectors.forEach(s => {
  const reg = new RegExp(`([^;{}]*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^;{}]*)\\{([^}]+)\\}`, 'g');
  let m;
  while ((m = reg.exec(printBlock)) !== null) {
    console.log(`[PRINT] ${m[1].trim()}:\n${m[2].trim()}\n`);
  }
});
