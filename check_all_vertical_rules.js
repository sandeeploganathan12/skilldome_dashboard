const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');
const html = fs.readFileSync('public/index.html', 'utf-8');

function findRules(selector, text, label) {
  console.log(`=== [${label}] RULES FOR ${selector} ===`);
  const regex = new RegExp(`(^|\\n|\\})([^\\{]*?${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\{]*?)\\{([^\\}]+)\\}`, 'g');
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Selector: ${match[2].trim()}`);
    console.log(`Body:\n${match[3].trim()}\n`);
  }
}

const selList = [
  '.top-analytics-grid',
  '.mid-analytics-grid',
  '.area-scores-card',
  '.card-header-dark',
  '.area-table-header',
  '.area-bars-container',
  '.score-bar-row',
  '.technical-test-blank-card',
  '.disclaimer-note',
  '.match-legend-bar',
  '.bottom-action-grid',
  '.action-card'
];

for (const s of selList) {
  findRules(s, css, 'styles.css');
  findRules(s, html.substring(html.indexOf('<style>'), html.indexOf('</style>')), 'index.html style');
}
