const fs = require('fs');
const s = fs.readFileSync('server.js', 'utf-8');
console.log('Does server.js read index.html?', s.includes('fs.readFileSync') && s.includes('index.html'));
