const fs = require('fs');
const code = fs.readFileSync('server.js', 'utf-8');
const lines = code.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('readFileSync') || l.includes('index.html')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
