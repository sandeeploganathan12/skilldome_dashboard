const fs = require('fs');
const http = require('http');

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path,
      headers: { 'Authorization': 'Bearer demo-admin-token-2026' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 TESTING SCORECARD ACTION BOXES (SERVICES & AUTO S&W)');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;
  function assert(cond, name, details = '') {
    if (cond) {
      console.log(`✅ PASS: ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // 1. Markup verification in public/index.html
  console.log('--- 1. Testing index.html Markup ---');
  const indexHtml = fs.readFileSync('public/index.html', 'utf8');

  assert(indexHtml.includes('id="cardNextStepsBox"'), 'Box 1 card element present with #cardNextStepsBox');
  assert(indexHtml.includes('id="cardRecommendedNextStepsList"'), 'Dynamic service list container present with #cardRecommendedNextStepsList');
  assert(indexHtml.includes('RECOMMENDED NEXT STEPS (SKILLDOME JOURNEY)'), 'Box 1 header explicitly references Skilldome Journey');
  assert(indexHtml.includes('Campus to Corporate'), 'Campus to Corporate badge present in Box 1');

  assert(indexHtml.includes('id="cardStrengthsWeaknessesBox"'), 'Box 2 card element present with #cardStrengthsWeaknessesBox');
  assert(indexHtml.includes('id="cardStrengthsWeaknessesContent"'), 'Strengths & Weaknesses container present');
  assert(indexHtml.includes('id="swStrengthsList"'), 'Key Strengths column present with #swStrengthsList');
  assert(indexHtml.includes('id="swWeaknessesList"'), 'Areas for Improvement column present with #swWeaknessesList');
  assert(indexHtml.includes('id="swScoreBasedBadge"'), 'Dynamic analysis badge present with #swScoreBasedBadge');

  // Verify old static career path and static focus improve are removed from scorecard
  assert(!indexHtml.includes('class="action-card career-path-card"'), 'Old static career path card removed from scorecard');
  assert(!indexHtml.includes('class="action-card focus-improve-card"'), 'Old static focus areas card removed from scorecard');

  // 2. CSS verification in public/styles.css
  console.log('\n--- 2. Testing styles.css Styling ---');
  const css = fs.readFileSync('public/styles.css', 'utf8');

  assert(css.includes('grid-template-columns: 1fr 1.15fr;'), 'Grid set to 2 columns in screen styles');
  assert(css.includes('.sw-split-container'), '.sw-split-container styling defined');
  assert(css.includes('.sw-bullet-list'), '.sw-bullet-list styling defined');
  assert(css.includes('.sw-bullet-row'), '.sw-bullet-row styling defined');
  assert(css.includes('.sw-strengths-col'), '.sw-strengths-col green accent defined');
  assert(css.includes('.sw-weaknesses-col'), '.sw-weaknesses-col amber accent defined');
  assert(css.includes('grid-template-columns: 1fr 1.15fr !important;'), 'Print styles maintain 2 columns for single-page A4 guarantee');

  // 3. Logic verification in public/app.js
  console.log('\n--- 3. Testing app.js Logic ---');
  const appJs = fs.readFileSync('public/app.js', 'utf8');

  assert(appJs.includes('function renderScorecardNextSteps(student, allScores)'), 'renderScorecardNextSteps defined');
  assert(appJs.includes('function renderStrengthsAndWeaknesses(allScores)'), 'renderStrengthsAndWeaknesses defined');
  assert(appJs.includes('function getCategoryStrengthSummary(category, score)'), 'getCategoryStrengthSummary defined for bullet points summary');
  assert(appJs.includes('function getCategoryWeaknessSummary(category, score)'), 'getCategoryWeaknessSummary defined for bullet points summary');
  assert(appJs.includes('renderScorecardNextSteps(student, allScores);'), 'renderScorecardNextSteps invoked in scorecard render');
  assert(appJs.includes('renderStrengthsAndWeaknesses(allScores);'), 'renderStrengthsAndWeaknesses invoked in scorecard render');

  // Check no package pricing in renderScorecardNextSteps
  assert(!appJs.includes('₹'), 'No rupee symbol / package pricing in app.js scorecard next steps');

  // 4. Test live data for SDC00001 (Santhosh)
  console.log('\n--- 4. Testing Live Assessment Data for SDC00001 ---');
  const student1 = await apiGet('/api/students/SDC00001');
  assert(student1.success, 'SDC00001 API returned success');
  assert(student1.allScores.length > 0, `SDC00001 has ${student1.allScores.length} evaluated categories`);

  const strengths1 = student1.allScores.filter(s => s.score >= 70);
  const weaknesses1 = student1.allScores.filter(s => s.score < 75);
  console.log('SDC00001 Strengths count:', strengths1.length);
  console.log('SDC00001 Weaknesses count:', weaknesses1.length);
  assert(strengths1.some(s => s.score === 100), 'Identified top 100% strengths for SDC00001');
  assert(weaknesses1.some(s => s.category.includes('Analytical & Logical Thinking')), 'Identified Analytical & Logical Thinking (33%) as weakness for SDC00001');

  // 5. Test live data for SDC00002 (Silpa)
  console.log('\n--- 5. Testing Live Assessment Data for SDC00002 ---');
  const student2 = await apiGet('/api/students/SDC00002');
  assert(student2.success, 'SDC00002 API returned success');
  assert(student2.allScores.length > 0, `SDC00002 has ${student2.allScores.length} evaluated categories`);

  const strengths2 = student2.allScores.filter(s => s.score >= 70);
  const weaknesses2 = student2.allScores.filter(s => s.score < 75);
  console.log('SDC00002 Strengths count:', strengths2.length);
  console.log('SDC00002 Weaknesses count:', weaknesses2.length);
  assert(strengths2.some(s => s.category === 'Power BI' && s.score === 100), 'Identified Power BI (100%) as strength for Silpa');
  assert(weaknesses2.some(s => s.category === 'Critical Thinking' && s.score === 33), 'Identified Critical Thinking (33%) as weakness for Silpa');

  console.log(`\n=======================================================`);
  console.log(`🏁 TESTS FINISHED: ${passed} Passed, ${failed} Failed`);
  console.log(`=======================================================`);
}

runTests().catch(console.error);
