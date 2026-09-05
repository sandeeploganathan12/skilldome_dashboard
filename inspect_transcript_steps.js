const fs = require('fs');

const p = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3fde0c60-d762-4d49-a90d-252951a989cc\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(p, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const j = JSON.parse(line);
    if (j.step_index === 777 || j.step_index === 908 || j.step_index === 980 || j.step_index === 1167) {
      console.log(`=== STEP ${j.step_index} ===`);
      console.log(j.content || j.tool_calls);
    }
  } catch(e) {}
}
