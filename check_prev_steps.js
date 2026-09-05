const fs = require('fs');
const path = require('path');

const stepsDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\e1277ad3-0b0f-4060-b3e9-803584a640f6\\.system_generated\\steps';
if (fs.existsSync(stepsDir)) {
  const steps = fs.readdirSync(stepsDir);
  console.log(`Found ${steps.length} step dirs in previous conversation.`);
  for (const s of steps) {
    const p = path.join(stepsDir, s, 'content.md');
    if (fs.existsSync(p)) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('candidate_registrations') || c.includes('sanjeevikandasamy') || c.includes('santhoshmani')) {
        console.log(`Step ${s} mentions candidate! Size: ${c.length}`);
      }
    }
  }
} else {
  console.log('stepsDir does not exist');
}
