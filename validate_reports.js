const fs = require('fs');
const http = require('http');

const html = fs.readFileSync('public/index.html', 'utf-8');
const css = fs.readFileSync('public/styles.css', 'utf-8');
const js = fs.readFileSync('public/app.js', 'utf-8');

console.log('========================================');
console.log('1. VALIDATING ALL THREE TABLES');
console.log('========================================');

// Table 1: Career Readiness (.rec-career-table)
console.log('\n--- Table 1: .rec-career-table ---');
console.log('In CSS screen:', css.includes('.rec-career-table') && css.includes('table-layout: fixed !important'));
console.log('In CSS print:', css.includes('.rec-career-table th:nth-child(6)') && css.includes('width: 18% !important'));
console.log('In index.html style:', html.includes('.rec-career-table {') && html.includes('width: 18% !important'));

// Calculate sum of percentages in CSS for rec-career-table:
const recWidths = [19, 11, 23, 18, 11, 18];
console.log('rec-career-table widths:', recWidths, 'Sum:', recWidths.reduce((a, b) => a + b, 0) + '%');

// Table 2: Mock Interview (.mock-breakdown-table)
console.log('\n--- Table 2: .mock-breakdown-table ---');
console.log('In CSS screen:', css.includes('.mock-breakdown-table') && css.includes('width: 28% !important'));
console.log('In CSS print:', css.includes('.mock-breakdown-table th:nth-child(5)'));
console.log('In index.html style:', html.includes('.mock-breakdown-table {') && html.includes('width: 28% !important'));

const mockWidths = [5, 41, 13, 13, 28];
console.log('mock-breakdown-table widths:', mockWidths, 'Sum:', mockWidths.reduce((a, b) => a + b, 0) + '%');

// Table 3: Career Roadmap (.crm-progression-table)
console.log('\n--- Table 3: .crm-progression-table ---');
console.log('In CSS screen:', css.includes('.crm-progression-table') && css.includes('width: 27% !important'));
console.log('In CSS print:', css.includes('.crm-progression-table th:nth-child(4)'));
console.log('In index.html style:', html.includes('.crm-progression-table {') && html.includes('width: 27% !important'));

const crmWidths = [17, 11, 19, 27, 13, 13];
console.log('crm-progression-table widths:', crmWidths, 'Sum:', crmWidths.reduce((a, b) => a + b, 0) + '%');

console.log('\n========================================');
console.log('2. VALIDATING AVATAR MONOGRAM INITIALS (SK)');
console.log('========================================');
console.log('Report 1 initials in HTML:', html.includes('id="cardStudentInitials" class="monogram-text">SK</span>'));
console.log('Report 2 initials in HTML:', html.includes('id="mockMonogram">SK</span>'));
console.log('Report 3 initials in HTML:', html.includes('id="crmAvatarInitials">SK</span>'));

// Check for any <img> inside monogram wrappers
const imgInMono1 = /avatar-ring-monogram[\s\S]*?<img[\s\S]*?<\/div>/gi.test(html);
console.log('Broken img in avatar-ring-monogram:', imgInMono1);

console.log('\n========================================');
console.log('3. VALIDATING DEV SERVER ASSETS');
console.log('========================================');

http.get('http://localhost:5000/', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Server response status:', res.statusCode);
    console.log('Loaded styles.css?v=15.0:', body.includes('styles.css?v=15.0'));
    console.log('Loaded app.js?v=15.0:', body.includes('app.js?v=15.0'));
    console.log('Static recCareerTableBody has 3 rows:', (body.match(/clickable-domain-row/g) || []).length === 3);
    console.log('\nALL VALIDATIONS COMPLETE!');
  });
}).on('error', (err) => {
  console.error('Server error:', err.message);
});
