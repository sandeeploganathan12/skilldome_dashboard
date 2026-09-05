const fs = require('fs');

const p = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3fde0c60-d762-4d49-a90d-252951a989cc\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(p, 'utf8').split('\n');

for (const line of lines) {
  if (!line) continue;
  try {
    const j = JSON.parse(line);
    if (j.step_index > 1167 && (line.includes('DELETE') || line.includes('TRUNCATE') || line.includes('DROP') || line.includes('clean_db'))) {
      console.log(`Step ${j.step_index}: ${line.substring(0, 200)}`);
    }
  } catch(e) {}
}
