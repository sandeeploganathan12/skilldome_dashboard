const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');

const lines = html.split('\n');
for (let i = 3020; i < 3520; i++) {
  const l = lines[i];
  if (l && l.includes('style=')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
}
