const http = require('http');

http.get('http://localhost:5000/api/students/SKD-2026-0001/mock-interviews', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const json = JSON.parse(data);
    console.log('History length:', json.history.length);
    console.log('First session:', json.history[0].interview_name, 'Score:', json.history[0].total_score);
  });
}).on('error', err => console.error(err));
