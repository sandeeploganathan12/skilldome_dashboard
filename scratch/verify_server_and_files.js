const fs = require('fs');

async function verifyAll() {
  console.log('=== VERIFICATION OF COMPACT SCORECARD FIXES ===');

  // 1. Check index.html versions
  const html = fs.readFileSync('public/index.html', 'utf-8');
  const hasCssV16 = html.includes('styles.css?v=16.0');
  const hasJsV16 = html.includes('app.js?v=16.0');
  console.log('1. index.html styles.css?v=16.0:', hasCssV16);
  console.log('2. index.html app.js?v=16.0:', hasJsV16);

  // 2. Check embedded style overrides in index.html
  const styleMatch = html.substring(html.indexOf('<style>'), html.indexOf('</style>'));
  const hasCompactMid = styleMatch.includes('.mid-analytics-grid');
  const hasCompactApt = styleMatch.includes('.area-bars-container');
  const hasCompactTech = styleMatch.includes('.technical-test-blank-card');
  const hasCompactBottom = styleMatch.includes('.bottom-action-grid');
  const hasCompactMain = styleMatch.includes('.scorecard-main');
  console.log('3. index.html style has .scorecard-main:', hasCompactMain);
  console.log('4. index.html style has .mid-analytics-grid:', hasCompactMid);
  console.log('5. index.html style has .area-bars-container:', hasCompactApt);
  console.log('6. index.html style has .technical-test-blank-card:', hasCompactTech);
  console.log('7. index.html style has .bottom-action-grid:', hasCompactBottom);

  // 3. Check styles.css
  const css = fs.readFileSync('public/styles.css', 'utf-8');
  console.log('8. styles.css contains compact mid-analytics-grid:', css.includes('.mid-analytics-grid {') && css.includes('grid-template-columns: 1.22fr 0.78fr;'));
  console.log('9. styles.css print contains compact rules:', css.includes('padding: 0.8mm 2mm !important;'));

  // 4. HTTP Fetch
  const res = await fetch('http://localhost:5000/');
  console.log('10. HTTP status code:', res.status);
  const text = await res.text();
  console.log('11. Fetched index.html length:', text.length, 'contains v=16.0:', text.includes('v=16.0'));

  const allPassed = hasCssV16 && hasJsV16 && hasCompactMid && hasCompactApt && hasCompactTech && hasCompactBottom && hasCompactMain && (res.status === 200);
  console.log('\nOVERALL STATUS:', allPassed ? 'ALL CHECKS PASSED ✅' : 'FAILURES FOUND ❌');
}

verifyAll();
