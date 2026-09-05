const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('tab-btn') || line.includes('nav-tab') || line.includes('role="tab"') || line.includes('data-tab')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
