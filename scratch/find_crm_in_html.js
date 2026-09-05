const fs = require('fs');
const content = fs.readFileSync('public/index.html', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('crmDomainSelect') || line.includes('viewCareerRoadmap')) {
    console.log(`Line ${idx + 1}: ${line.slice(0, 140)}`);
  }
});
