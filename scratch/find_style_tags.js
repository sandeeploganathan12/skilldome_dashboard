const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const lines = html.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('<style') || l.includes('</style')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
