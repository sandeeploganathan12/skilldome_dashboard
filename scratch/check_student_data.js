require('dotenv').config();

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin@skilldom.com',
      password: process.env.ADMIN_PASS || 'admin123'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login result:', loginData.success, loginData.token ? 'has token' : 'no token');
  if (!loginData.token) return;

  const res = await fetch('http://localhost:5000/api/students/SDC00001?domain=All', {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  const data = await res.json();
  console.log('Student loaded:', data.student ? data.student.name : 'null');
  const aptitudeScores = (data.allScores || []).filter(sc => sc.domain && sc.domain.toLowerCase() === 'aptitude');
  console.log('Aptitude scores (' + aptitudeScores.length + '):');
  aptitudeScores.forEach(sc => console.log(`  ${sc.category}: ${sc.score}`));

  const techScores = (data.allScores || []).filter(sc => sc.domain && (sc.domain.toLowerCase() === 'coding' || sc.domain.toLowerCase() === 'non-coding'));
  console.log('Tech scores (' + techScores.length + '):');
  techScores.forEach(sc => console.log(`  ${sc.category}: ${sc.score}`));
}
test();
