async function test() {
  const res = await fetch('http://localhost:5000/api/students/SDC00001?domain=All');
  const data = await res.json();
  console.log('Student:', data.student ? data.student.name : 'none');
  const aptitudeScores = (data.allScores || []).filter(sc => sc.domain && sc.domain.toLowerCase() === 'aptitude');
  console.log('Aptitude scores count:', aptitudeScores.length);
  aptitudeScores.forEach(sc => console.log(` - ${sc.category}: ${sc.score}`));
  const techScores = (data.allScores || []).filter(sc => sc.domain && (sc.domain.toLowerCase() === 'coding' || sc.domain.toLowerCase() === 'non-coding'));
  console.log('Tech scores count:', techScores.length);
}
test();
