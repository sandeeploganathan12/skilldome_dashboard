const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf-8');
const styleContent = html.substring(html.indexOf('<style>'), html.indexOf('</style>'));

const selectors = [
  'scorecard',
  'analytics',
  'gauge',
  'radar',
  'area-scores',
  'area-bars',
  'score-bar',
  'technical',
  'rec-career',
  'bottom-action',
  'action-card',
  'service-check',
  'sw-'
];

selectors.forEach(sel => {
  const reg = new RegExp(`[^}]*${sel}[^}]*\\{[^}]*\\}`, 'gi');
  let match;
  let count = 0;
  while ((match = reg.exec(styleContent)) !== null) {
    count++;
  }
  console.log(`Selector keyword "${sel}": found ${count} rules in <style> block of index.html`);
});
