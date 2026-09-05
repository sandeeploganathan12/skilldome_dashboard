const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const loginRes = await post('/api/auth/login', { username: 'admin@skilldom.com', password: 'admin123' });
  const token = loginRes.token;

  const data = await get('/api/students/SDC00003', token);
  for (const [k, v] of Object.entries(data.student)) {
    if (typeof v === 'string' && v.length > 80) {
      console.log(`${k}: [long string length ${v.length}]`);
    } else {
      console.log(`${k}:`, v);
    }
  }
}

run().catch(console.error);
