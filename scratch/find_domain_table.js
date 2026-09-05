const fs = require('fs');
const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('renderRecommendedCareerDomains') || line.includes('careerDomainTable') || line.includes('domain-row')) {
    console.log(`Line ${idx + 1}: ${line.slice(0, 120)}`);
  }
});
