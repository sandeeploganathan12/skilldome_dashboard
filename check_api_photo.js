const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/students/SDC00001',
  headers: { 'Authorization': 'Bearer demo-admin-token-2026' }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('student.name:', json.student.name);
    console.log('student.initials:', json.student.initials);
    console.log('student.photo type:', typeof json.student.photo);
    console.log('student.photo length:', json.student.photo ? json.student.photo.length : 0);
    console.log('student.photo prefix:', json.student.photo ? json.student.photo.substring(0, 50) : null);
  });
});
req.end();
