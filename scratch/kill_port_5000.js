const { execSync } = require('child_process');

try {
  const netstat = execSync('netstat -ano | findstr :5000').toString();
  console.log('netstat output:\n', netstat);
  const lines = netstat.trim().split('\n');
  lines.forEach(l => {
    const parts = l.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      try {
        console.log('Killing PID:', pid);
        execSync(`taskkill /F /PID ${pid}`);
      } catch (err) {
        console.log('Error killing PID', pid, err.message);
      }
    }
  });
} catch (e) {
  console.log('No process on port 5000 or error:', e.message);
}
