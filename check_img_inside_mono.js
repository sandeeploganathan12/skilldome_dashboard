const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');

const regex = /avatar-ring-monogram[\s\S]{0,500}?<\/div>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Match:\n', m[0]);
}
