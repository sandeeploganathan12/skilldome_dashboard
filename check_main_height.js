const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');

function findSection(title, length = 1500) {
  const idx = css.indexOf(title);
  if (idx !== -1) {
    console.log(`=== ${title} ===`);
    console.log(css.substring(idx, idx + length));
  }
}

findSection('.scorecard-main {');
findSection('/* --- Fixed Right Main Area on A4');
findSection('.bottom-action-grid');
