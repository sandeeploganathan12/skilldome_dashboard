const fs = require('fs');

const js = fs.readFileSync('public/app.js', 'utf8');
const lines = js.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('cardStudentInitials') || line.includes('mockMonogram') || line.includes('crmAvatarInitials') || line.includes('photo') || line.includes('Photo')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
