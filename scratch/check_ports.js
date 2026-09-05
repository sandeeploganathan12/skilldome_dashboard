const { execSync } = require('child_process');

try {
  const netstat = execSync('netstat -ano | findstr :5000').toString();
  console.log('netstat for 5000:\n', netstat);
} catch (e) {
  console.log('netstat 5000 error:', e.message);
}

try {
  const netstat3000 = execSync('netstat -ano | findstr :3000').toString();
  console.log('netstat for 3000:\n', netstat3000);
} catch (e) {
  console.log('no 3000');
}
