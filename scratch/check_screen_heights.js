const fs = require('fs');
const css = fs.readFileSync('public/styles.css', 'utf-8');
const html = fs.readFileSync('public/index.html', 'utf-8');

function checkScreenHeights(content, label) {
  console.log(`=== CHECKING SCREEN HEIGHTS IN ${label} ===`);
  const lines = content.split('\n');
  let inPrint = false;
  lines.forEach((l, idx) => {
    if (l.includes('@media print')) inPrint = true;
    if (inPrint && l.includes('/* ==================================================')) {
      // maybe end of print?
    }
    if (!inPrint && (l.includes('297mm') || l.includes('height:') || l.includes('max-height:'))) {
      if (l.includes('scorecard') || l.includes('viewScorecard') || l.includes('mainApp')) {
        console.log(`${idx + 1}: ${l}`);
      }
    }
  });
}

checkScreenHeights(css, 'styles.css');
checkScreenHeights(html, 'index.html');
