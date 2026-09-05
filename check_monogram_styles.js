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

findRules('.avatar-ring-monogram');
findRules('.mock-monogram-circle');
findRules('.crm-monogram-circle');
findRules('.monogram-text');
findRules('.crm-monogram-text');
