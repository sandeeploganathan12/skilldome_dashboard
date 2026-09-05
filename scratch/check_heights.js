const fs = require('fs');

function checkHeights(filename) {
  const content = fs.readFileSync(filename, 'utf-8');
  console.log(`=== ${filename} ===`);
  const lines = content.split('\n');
  const targetSelectors = [
    '#viewScorecard',
    '.scorecard-container',
    '#scorecardPrintArea',
    '.scorecard-main',
    '.view-content',
    '#mainApp'
  ];

  targetSelectors.forEach(sel => {
    const reg = new RegExp(`([^;{}]*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^;{}]*)\\{([^}]+)\\}`, 'gi');
    let m;
    while ((m = reg.exec(content)) !== null) {
      if (m[2].includes('height') || m[2].includes('overflow') || m[2].includes('padding') || m[2].includes('margin')) {
        console.log(`[${sel}] -> ${m[1].trim()}:\n${m[2].trim()}\n`);
      }
    }
  });
}

checkHeights('public/styles.css');
checkHeights('public/index.html');
