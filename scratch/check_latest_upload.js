const fs = require('fs');

const f1 = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788519099728.png';
const f2 = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded/media_1788521025551.png';

const s1 = fs.statSync(f1).size;
const s2 = fs.statSync(f2).size;
console.log('f1 size:', s1, 'f2 size:', s2);
const b1 = fs.readFileSync(f1);
const b2 = fs.readFileSync(f2);
console.log('Identical?', b1.equals(b2));
