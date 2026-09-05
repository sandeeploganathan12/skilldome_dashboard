const fs = require('fs');

const img1Path = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788519099728.png';
const img2Path = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788522026857.png';

const stat1 = fs.statSync(img1Path);
const stat2 = fs.statSync(img2Path);

console.log('img1 size:', stat1.size);
console.log('img2 size:', stat2.size);

const buf1 = fs.readFileSync(img1Path);
const buf2 = fs.readFileSync(img2Path);
console.log('Are identical bytes?', buf1.equals(buf2));
