const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');

function findRules(selector) {
  console.log(`=== RULES FOR ${selector} ===`);
  const regex = new RegExp(`(^|\\n|\\})([^\\{]*?${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\{]*?)\\{([^\\}]+)\\}`, 'g');
  let match;
  while ((match = regex.exec(css)) !== null) {
    console.log(`Selector: ${match[2].trim()}`);
    console.log(`Body:\n${match[3].trim()}\n`);
  }
}

findRules('.scorecard-container');
findRules('.scorecard-main');
findRules('.recommended-career-section');
findRules('.rec-table-wrapper');
findRules('.rec-career-table');
