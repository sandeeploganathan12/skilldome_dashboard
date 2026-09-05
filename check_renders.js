const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf8');
const lines = js.split('\n');

lines.forEach((l, i) => {
  if (l.includes('renderMockInterviewScorecard') || l.includes('renderCareerRoadmapView') || l.includes('mockMonogram') || l.includes('crmAvatarInitials')) {
    console.log(`${i + 1}: ${l}`);
  }
});
