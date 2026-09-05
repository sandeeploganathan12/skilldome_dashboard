const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');

const linkMatches = html.match(/<link[^>]*href=["'][^"']*styles\.css[^"']*["'][^>]*>/gi);
const scriptMatches = html.match(/<script[^>]*src=["'][^"']*app\.js[^"']*["'][^>]*>/gi);

console.log('styles.css link tag:', linkMatches);
console.log('app.js script tag:', scriptMatches);
