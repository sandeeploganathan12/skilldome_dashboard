const fs = require('fs');
const readline = require('readline');

async function searchLog() {
  const p = 'C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3fde0c60-d762-4d49-a90d-252951a989cc\\.system_generated\\logs\\transcript.jsonl';
  if (!fs.existsSync(p)) return console.log('File not found');

  const fileStream = fs.createReadStream(p);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo++;
    if (line.includes('candidate_registrations') && (line.includes('INSERT') || line.includes('SELECT') || line.includes('photo'))) {
      const parsed = JSON.parse(line);
      console.log(`Line ${lineNo} (step ${parsed.step_index}, type ${parsed.type}): ${line.substring(0, 150)}...`);
    }
  }
}

searchLog().catch(console.error);
