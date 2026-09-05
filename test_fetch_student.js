const http = require('http');

function getStudent(id) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/${id}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer demo-admin-token-2026'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('=== TESTING SANJEEVI K (SDC00001) ===');
  const res1 = await getStudent('SDC00001');
  console.log('Success:', res1.success);
  console.log('Candidate Name:', res1.student.name);
  console.log('Overall Score:', res1.readiness.score);
  console.log('Readiness Tier:', res1.readiness.tier);
  console.log('Categories Count:', res1.allScores.length);
  console.log('Categories:');
  res1.allScores.forEach(s => {
    console.log(`  [${s.domain}] ${s.category.padEnd(30)}: ${s.score}% (Correct: ${s.correctQuestions}/${s.totalQuestions})`);
  });

  const aptitude1 = res1.allScores.filter(s => s.domain === 'Aptitude');
  const technical1 = res1.allScores.filter(s => s.domain !== 'Aptitude');
  console.log(`\nTable 1 (Aptitude) count: ${aptitude1.length}`);
  console.log(`Table 2 (Technical) count: ${technical1.length} -> Should be 0 for Sanjeevi k!`);

  console.log('\n=== TESTING SANTHOSH (STU00002) ===');
  const res2 = await getStudent('STU00002');
  console.log('Success:', res2.success);
  console.log('Candidate Name:', res2.student.name);
  console.log('Overall Score:', res2.readiness.score);
  console.log('Categories Count:', res2.allScores.length);
  const aptitude2 = res2.allScores.filter(s => s.domain === 'Aptitude');
  const technical2 = res2.allScores.filter(s => s.domain !== 'Aptitude');
  console.log(`Table 1 (Aptitude) count: ${aptitude2.length}`);
  console.log(`Table 2 (Technical) count: ${technical2.length}:`);
  technical2.forEach(s => {
    console.log(`  [${s.domain}] ${s.category.padEnd(25)}: ${s.score}% (Correct: ${s.correctQuestions}/${s.totalQuestions})`);
  });
}

main().catch(console.error);
