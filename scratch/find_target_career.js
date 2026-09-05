const fs = require('fs');
const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('targetCareer') || line.includes('interested_domain')) {
    console.log(`Line ${idx + 1}: ${line.slice(0, 120)}`);
  }
});
