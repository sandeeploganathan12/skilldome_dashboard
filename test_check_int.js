const http = require('http');

http.get('http://localhost:5000/api/mock-interviews?student_id=SKD-2026-0001', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const int = json.interviews[0];
    console.log('Candidate:', int.student_name, int.student_id);
    console.log('Role:', int.target_role);
    console.log('Overall feedback:', int.overall_feedback);
    console.log('Strengths count:', int.strengths.length);
    console.log('Improvements count:', int.improvements.length);
    console.log('Questions count:', int.questions.length);
  });
}).on('error', err => console.error(err));
