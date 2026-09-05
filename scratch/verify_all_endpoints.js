async function test() {
  console.log('=== VERIFYING SERVER RESPONSES & HEADERS ===');
  const res1 = await fetch('http://localhost:5000/');
  console.log('1. GET / status:', res1.status);
  console.log('   Cache-Control:', res1.headers.get('cache-control'));
  const html = await res1.text();
  console.log('   HTML length:', html.length);
  console.log('   Contains v=17.0:', html.includes('v=17.0'));
  console.log('   Contains meta no-cache:', html.includes('content="no-cache, no-store'));
  console.log('   Contains ultra-compact .scorecard-main:', html.includes('padding: 6px 12px !important;'));

  const res2 = await fetch('http://localhost:5000/styles.css?v=17.0');
  console.log('2. GET /styles.css?v=17.0 status:', res2.status);
  console.log('   Cache-Control:', res2.headers.get('cache-control'));
  const css = await res2.text();
  console.log('   CSS length:', css.length);
  console.log('   Contains ultra-compact mid-analytics-grid:', css.includes('grid-template-columns: 1.25fr 0.75fr;'));

  const res3 = await fetch('http://localhost:5000/app.js?v=17.0');
  console.log('3. GET /app.js?v=17.0 status:', res3.status);
  console.log('   Cache-Control:', res3.headers.get('cache-control'));
  const js = await res3.text();
  console.log('   JS length:', js.length);
  console.log('   Contains inline score-bar-row styles:', js.includes('padding: 0.5px 0 !important; gap: 4px !important; font-size: 0.56rem !important;'));
  console.log('   Contains inline rec-career-table styles:', js.includes('font-size: 0.58rem !important; vertical-align: top !important;'));

  const allPassed = (res1.status === 200) && (res2.status === 200) && (res3.status === 200) && html.includes('v=17.0') && css.includes('1.25fr 0.75fr') && js.includes('0.56rem !important');
  console.log('\nFINAL STATUS:', allPassed ? 'EVERYTHING VERIFIED AND READY ✅' : 'FAILURES ❌');
}

test();
