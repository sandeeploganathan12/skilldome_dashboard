const fs = require('fs');
const css = fs.readFileSync('public/styles.css', 'utf-8');
const lines = css.split('\n');
let charCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (charCount <= 79391 && charCount + lines[i].length >= 79391) {
    console.log(`Found around line ${i + 1}:`);
    for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 100); j++) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
    break;
  }
  charCount += lines[i].length + 1;
}
