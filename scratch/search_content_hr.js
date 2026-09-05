const fs = require('fs');
const filePath = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3fde0c60-d762-4d49-a90d-252951a989cc\\.system_generated\\steps\\41\\content.md';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (/human resource|recruitment|recruiter|hr\b/i.test(line)) {
    console.log(`Line ${idx + 1}: ${line.slice(0, 150)}`);
  }
});
