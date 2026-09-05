const fs = require('fs');
const dir = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/3fde0c60-d762-4d49-a90d-252951a989cc/.user_uploaded';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  console.log('User uploaded files:', files.slice(-5));
}
