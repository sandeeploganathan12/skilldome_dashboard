const http = require('http');

function postMock(payload) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/mock-interviews',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr),
        'Authorization': 'Bearer demo-admin-token-2026'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

function getMockById(id) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/mock-interviews/${id}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer demo-admin-token-2026'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('--- Submitting Mock Evaluation for Sanjeevi k with marks only ---');
  const payload = {
    student_id: 'SDC00008',
    student_name: 'Sanjeevi k',
    target_role: 'Full Stack Developer',
    interview_number: 1,
    interview_name: 'CodeStart Sprint',
    interview_date: '2026-09-03',
    interview_mode: 'Online (Google Meet)',
    interviewer: 'Skilldom Panel',
    interview_type: 'Technical + HR',
    duration_minutes: 45,
    focus_areas: 'Full Stack Fundamentals, Problem Solving, APIs & HR Fit',

    // Marks only:
    score_communication: 11, // 11/15 = 73%
    score_technical: 17,     // 17/20 = 85%
    score_problem_solving: 13, // 13/15 = 87%
    score_resume_projects: 12, // 12/15 = 80%
    score_behavioral: 8,     // 8/10 = 80%
    score_confidence: 8,     // 8/10 = 80%
    score_role_knowledge: 11  // 11/15 = 73%
    // Total = 80 / 100 -> JOB READY!
  };

  const res = await postMock(payload);
  console.log('Save Result:', res);

  if (res.id) {
    console.log(`\n--- Fetching Generated Mock Interview #${res.id} ---`);
    const details = await getMockById(res.id);
    const int = details.interview;
    console.log(`Student Name: ${int.student_name} (${int.student_id})`);
    console.log(`Total Score: ${int.total_score} / 100 (${int.result_level})`);
    console.log(`Interviewer Rating: ${int.rating_stars} Stars`);
    console.log('\nAuto-generated Strengths (What Candidate Did Well):');
    int.strengths.forEach(s => console.log(`   ✓ ${s}`));
    console.log('\nAuto-generated Areas to Improve:');
    int.improvements.forEach(i => console.log(`   ! ${i}`));
    console.log('\nAuto-generated Top Questions:');
    int.questions.forEach((q, idx) => console.log(`   ${idx + 1}. ${q}`));
    console.log('\nAuto-generated Overall Feedback Narrative:');
    console.log(`   "${int.overall_feedback}"`);
    console.log('\nAuto-generated Action Plan:');
    int.action_plan.forEach(a => console.log(`   🎯 ${a}`));
    console.log(`\nNext Interview: ${int.next_interview_name} on ${int.next_interview_date}`);
  }
}

main().catch(console.error);
