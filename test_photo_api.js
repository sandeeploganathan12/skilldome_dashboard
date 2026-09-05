const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: path,
      headers: { 'Authorization': 'Bearer demo-admin-token-2026' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: data });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  const mock = await get('/api/mock-interviews?student_id=SDC00001');
  console.log('Mock result:', mock);
}

test().catch(console.error);
