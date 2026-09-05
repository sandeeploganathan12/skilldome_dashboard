const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');
const js = fs.readFileSync('public/app.js', 'utf-8');

console.log('=== AVATAR IN HTML ===');
// Check all occurrences of monogram or avatar in index.html
const avatarHtmlMatches = html.match(/<[^>]+(monogram|avatar|cardStudentInitials|mockMonogram|crmAvatarInitials)[^>]*>[\s\S]*?<\/[^>]+>/gi);
console.log('HTML avatar elements:', avatarHtmlMatches);

console.log('\n=== AVATAR IN JS ===');
// Find where cardStudentInitials, mockMonogram, crmAvatarInitials are set in app.js
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('cardStudentInitials') || l.includes('mockMonogram') || l.includes('crmAvatarInitials') || l.includes('updateAvatarDisplay')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
