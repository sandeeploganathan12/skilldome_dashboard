const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');

function showContext(str, len = 250) {
  let idx = 0;
  while ((idx = html.indexOf(str, idx)) !== -1) {
    console.log('--- FOUND AT ' + idx + ' ---');
    console.log(html.substring(Math.max(0, idx - 50), Math.min(html.length, idx + len)));
    idx += str.length;
  }
}

console.log('=== cardStudentInitials ===');
showContext('cardStudentInitials');

console.log('\n=== mockMonogram ===');
showContext('mockMonogram');

console.log('\n=== crmAvatarInitials ===');
showContext('crmAvatarInitials');
