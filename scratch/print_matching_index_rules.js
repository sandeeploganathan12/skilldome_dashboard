const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const styleContent = html.substring(html.indexOf('<style>'), html.indexOf('</style>'));

const selectors = ['scorecard', 'gauge', 'score-bar', 'rec-career'];
selectors.forEach(sel => {
  const reg = new RegExp(`([^;{}]*${sel}[^;{}]*)\\{([^}]+)\\}`, 'gi');
  let match;
  while ((match = reg.exec(styleContent)) !== null) {
    console.log(`[index.html <style>] ${match[1].trim()}:\n${match[2].trim()}\n`);
  }
});
