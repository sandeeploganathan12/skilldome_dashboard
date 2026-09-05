const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');
const startMock = html.indexOf('id="viewMockInterview"');
const endMock = html.indexOf('<!-- VIEW 3:', startMock);
console.log('=== Mock Interview HTML Structure ===');
const mockHtml = html.substring(startMock, endMock !== -1 ? endMock : startMock + 3000);

// Find all table, grid, card tags in mock
const tagMatches = mockHtml.match(/<(table|div class="[^"]*grid[^"]*"|div class="[^"]*card[^"]*"|div class="[^"]*section[^"]*")[^>]*>/g);
console.log(tagMatches);
