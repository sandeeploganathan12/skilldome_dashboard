const fs = require('fs');
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('app.get(') || line.includes('app.post(') || line.includes('/api/')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
