const fs = require('fs');
const server = fs.readFileSync('server.js', 'utf-8');
const lines = server.split('\n');

lines.forEach((l, idx) => {
  if (l.includes("app.get('*'") || l.includes("app.get('/')") || l.includes('sendFile') || l.includes('index.html')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
