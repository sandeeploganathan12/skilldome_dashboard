const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const lines = html.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('monogram') || line.includes('avatar') || line.includes('cardStudent') || line.includes('mockStudent') || line.includes('roadmapStudent') || line.includes('profile-box') || line.includes('student-name')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
