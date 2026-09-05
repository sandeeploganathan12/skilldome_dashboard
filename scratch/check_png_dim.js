const fs = require('fs');

const buf = fs.readFileSync('C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788521025551.png');

// Read PNG dimensions: width at byte 16, height at byte 20 (4 bytes big-endian)
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);

console.log('User image dimensions:', width, 'x', height);
