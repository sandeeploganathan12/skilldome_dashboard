const fs = require('fs');

function validateBrackets(content, name) {
  let depth = 0;
  let line = 1;
  let col = 1;
  let inString = false;
  let stringChar = '';
  let inComment = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }

    if (inComment) {
      if (c === '*' && content[i + 1] === '/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (c === '\\') {
        i++;
      } else if (c === stringChar) {
        inString = false;
      }
      continue;
    }

    if (c === '/' && content[i + 1] === '*') {
      inComment = true;
      i++;
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth < 0) {
        console.error(`${name}: Unmatched closing brace at line ${line}, col ${col}`);
        return false;
      }
    }
  }

  if (depth !== 0) {
    console.error(`${name}: Unclosed opening brace! Final depth: ${depth}`);
    return false;
  }
  console.log(`${name}: Brackets are balanced! (depth = 0)`);
  return true;
}

validateBrackets(fs.readFileSync('public/styles.css', 'utf-8'), 'styles.css');
const html = fs.readFileSync('public/index.html', 'utf-8');
const style1 = html.substring(html.indexOf('<style>'), html.indexOf('</style>'));
validateBrackets(style1, 'index.html main style');
