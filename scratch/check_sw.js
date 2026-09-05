const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const js = fs.readFileSync('public/app.js', 'utf-8');
console.log('serviceWorker in html:', html.includes('serviceWorker'));
console.log('serviceWorker in app.js:', js.includes('serviceWorker'));
