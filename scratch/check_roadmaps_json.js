const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/career_roadmaps.json', 'utf8'));

console.log('Available roadmaps in json:', Object.keys(data.roadmaps));
console.log('Domain aliases:', JSON.stringify(data.domainAliases, null, 2));
