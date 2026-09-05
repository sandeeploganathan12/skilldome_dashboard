const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function testApi() {
  try {
    console.log('Fetching /api/mock-interviews/2 (Dinesh)...');
    const dinesh = await get('http://localhost:5000/api/mock-interviews/2');
    console.log('Dinesh Success:', dinesh.success);
    console.log('Dinesh Student:', dinesh.interview.student_id, dinesh.interview.student_name);
    console.log('Dinesh Total Score:', dinesh.interview.total_score);
    console.log('Evaluation Scores in API response:');
    console.table(dinesh.interview.evaluation_scores);

    console.log('\nFetching /api/mock-interviews/3 (Santhosh)...');
    const santhosh = await get('http://localhost:5000/api/mock-interviews/3');
    console.log('Santhosh Success:', santhosh.success);
    console.log('Santhosh Student:', santhosh.interview.student_id, santhosh.interview.student_name);
    console.log('Santhosh Total Score:', santhosh.interview.total_score);
    console.log('Evaluation Scores in API response:');
    console.table(santhosh.interview.evaluation_scores);

  } catch (err) {
    console.error('API Test Error:', err.message);
  }
}

testApi();
