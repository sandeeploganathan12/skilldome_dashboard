const fs = require('fs');

const stats = fs.statSync('C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788517664113.png');
console.log('File size:', stats.size);

// Read PNG header for width/height
const fd = fs.openSync('C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788517664113.png', 'r');
const buf = Buffer.alloc(24);
fs.readSync(fd, buf, 0, 24, 0);
fs.closeSync(fd);

const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log(`Image dimensions: ${width} x ${height}`);
