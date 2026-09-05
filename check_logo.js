const fs = require('fs');
// Let's verify the logo exists and is ready
console.log('Logo size:', fs.statSync('public/assets/logo.png').size, 'bytes');
