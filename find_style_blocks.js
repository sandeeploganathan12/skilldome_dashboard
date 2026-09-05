const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');
const lines = html.split('\n');

let inStyle = false;
let startLine = 0;

lines.forEach((l, i) => {
  if (l.includes('<style')) {
    inStyle = true;
    startLine = i + 1;
    console.log(`Style block starts at line ${startLine}`);
  }
  if (l.includes('</style>')) {
    inStyle = false;
    console.log(`Style block ends at line ${i + 1} (${i + 1 - startLine} lines)`);
  }
});
