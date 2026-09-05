const fs = require('fs');

function search(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('RECOMMENDED NEXT STEPS') || l.includes('recCareerTableBody') || l.includes('cardNextStepsBox')) {
      console.log(`${file}:${idx + 1}: ${l.trim()}`);
    }
  });
}

search('public/index.html');
search('public/app.js');
search('public/styles.css');
