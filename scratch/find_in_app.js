const fs = require('fs');
const content = fs.readFileSync('public/app.js', 'utf8');
const lines = content.split('\n');
console.log('Total lines in public/app.js:', lines.length);

lines.forEach((line, idx) => {
  if (line.includes('career_roadmaps') || line.includes('openRoadmap') || line.includes('roadmap') || line.includes('Roadmap')) {
    console.log(`Line ${idx + 1}: ${line.slice(0, 120)}...`);
  }
});
