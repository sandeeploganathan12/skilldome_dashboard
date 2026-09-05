const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');
const html = fs.readFileSync('public/index.html', 'utf-8');

function findRules(selector, source = css) {
  console.log(`=== RULES FOR ${selector} ===`);
  const regex = new RegExp(`(^|\\n|\\})([^\\{]*?${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\{]*?)\\{([^\\}]+)\\}`, 'g');
  let match;
  while ((match = regex.exec(source)) !== null) {
    console.log(`Selector: ${match[2].trim()}`);
    console.log(`Body:\n${match[3].trim()}\n`);
  }
}

findRules('.mid-analytics-grid');
findRules('.area-scores-card');
findRules('.score-bar-row');
findRules('.bar-icon-box');
findRules('.bar-track');
findRules('.technical-test-blank-card');
