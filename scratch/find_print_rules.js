const fs = require('fs');

const css = fs.readFileSync('public/styles.css', 'utf-8');
const html = fs.readFileSync('public/index.html', 'utf-8');

console.log('--- CSS search for @media ---');
let m;
const reg = /@media[^{]+\{/g;
while ((m = reg.exec(css)) !== null) {
  console.log('CSS @media at index', m.index, ':', m[0]);
}

console.log('--- HTML search for @media ---');
while ((m = reg.exec(html)) !== null) {
  console.log('HTML @media at index', m.index, ':', m[0]);
}
