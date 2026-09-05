const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf8');
const lines = css.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('avatar-ring-monogram') || line.includes('mock-monogram') || line.includes('crm-monogram') || line.includes('student-profile-box')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
