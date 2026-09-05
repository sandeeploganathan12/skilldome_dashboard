const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\dinesh_avatar_1788425842718.jpg';
const dest = path.join(__dirname, 'public', 'assets', 'dinesh_avatar.jpg');

fs.copyFileSync(src, dest);
console.log('✅ Copied dinesh_avatar.jpg to', dest);
