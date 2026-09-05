const fs = require('fs');

try {
  const code = fs.readFileSync('./public/app.js', 'utf8');
  new Function(code);
  console.log('Syntax check passed for public/app.js');
} catch (e) {
  console.error('Syntax error in public/app.js:', e);
}
