const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config();

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('=======================================================');
  console.log('🧪 MOCK INTERVIEW SCORECARD & INPUT FORM VERIFICATION');
  console.log('=======================================================');

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. MySQL Schema Verification
  console.log('\n--- 1. Testing Database Schema for mock_interviews ---');
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'srv1555.hstgr.io',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'u481861457_admin',
      password: process.env.DB_PASSWORD || 'Skilldome@123',
      database: process.env.DB_NAME || 'u481861457_skilldome'
    });

    const [cols] = await conn.query('SHOW COLUMNS FROM mock_interviews');
    assert(cols && cols.length > 10, `Table mock_interviews exists with ${cols ? cols.length : 0} columns`);
    await conn.end();
  } catch (err) {
    assert(false, `MySQL check failed: ${err.message}`);
  }

  // 2. Testing POST /api/mock-interviews
  console.log('\n--- 2. Testing Mock Interview Evaluation Submission ---');
  let newInterviewId = null;
  try {
    const postPayload = {
      student_id: 'SDC00001',
      student_name: 'Sanjeevi k',
      email: 'sanjeevikandasamy233@gmail.com',
      interview_number: 1,
      interview_name: 'CodeStart Sprint',
      target_role: 'Full Stack Developer',
      experience_level: 'Fresher / 0–1 Year',
      interview_date: '2026-09-02',
      interview_mode: 'Online (Google Meet)',
      interviewer: 'Skilldom Panel',
      interview_type: 'Technical + HR',
      duration_minutes: 42,
      focus_areas: 'Python Fundamentals, Problem Solving, OOPs, SQL, API Basics & HR Fit',
      score_communication: 9,
      score_technical: 14,
      score_problem_solving: 10,
      score_resume_projects: 8,
      score_behavioral: 6,
      score_confidence: 6,
      score_role_knowledge: 8,
      strengths: [
        'Explained Python concepts (Lists, Dicts, Functions) clearly.',
        'Demonstrated good logical thinking while solving coding problem.',
        'Understood the project requirement and explained it well.',
        'Good attitude and willingness to learn.'
      ],
      improvements: [
        'Answers were sometimes too lengthy and less structured.',
        'Need to strengthen knowledge in REST API and status codes.',
        'Could not optimize the code in the session.',
        'Need more confidence while answering conceptual questions.'
      ],
      questions: [
        'Tell me about yourself.',
        'What are the key features of Python?',
        'Write a program to check if a number is prime.',
        'Explain the difference between List and Tuple.',
        'What is a REST API? How does it work?',
        'Describe a challenge you faced in a project.'
      ],
      overall_feedback: 'Dinesh/Sanjeevi has a good foundation in Python and logical thinking. He is able to answer direct questions well but needs to work on structured communication, depth in concepts, and code optimization.',
      rating_stars: 3,
      action_plan: [
        'Practice 15 Python coding problems (Easy–Medium).',
        'Revise REST API concepts, HTTP methods & status codes.',
        'Prepare a 2-minute elevator pitch for yourself and projects.',
        'Practice 5 behavioral questions using STAR format.',
        'Improve communication – be concise and structured.'
      ],
      next_interview_name: 'Interview #2 – LogicLeap Challenge',
      next_interview_date: '2026-09-05'
    };

    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/mock-interviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, postPayload);

    assert(res.status === 200, `POST /api/mock-interviews returned status 200 (Got: ${res.status})`);
    assert(res.data.success === true, 'Saved mock interview successfully');
    assert(res.data.total_score === 61, `Calculated total score = 61 (Got: ${res.data.total_score})`);
    assert(res.data.result_level === 'DEVELOPING', `Classified result level = DEVELOPING (Got: ${res.data.result_level})`);
    newInterviewId = res.data.id;
    assert(newInterviewId > 0, `Generated insert ID = ${newInterviewId}`);
  } catch (err) {
    assert(false, `POST failed: ${err.message}`);
  }

  // 3. Testing GET /api/mock-interviews/:id
  console.log('\n--- 3. Testing Mock Interview Evaluation Retrieval ---');
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/mock-interviews/${newInterviewId}`,
      method: 'GET'
    });

    assert(res.status === 200, `GET /api/mock-interviews/${newInterviewId} returned status 200`);
    const int = res.data.interview;
    assert(int && int.student_id === 'SDC00001', 'Retrieved correct student_id SDC00001');
    assert(int.interview_name === 'CodeStart Sprint', 'Retrieved interview_name CodeStart Sprint');
    assert(int.total_score === 61, 'Verified total score is 61');
    assert(int.score_technical === 14, 'Verified score_technical is 14');
    assert(int.strengths && int.strengths.length === 4, `Preserved 4 strengths in array (Got: ${int.strengths ? int.strengths.length : 0})`);
    assert(int.questions && int.questions.length === 6, `Preserved 6 top questions in array (Got: ${int.questions ? int.questions.length : 0})`);
    assert(int.rating_stars === 3, 'Verified 3 stars rating');
  } catch (err) {
    assert(false, `GET by ID failed: ${err.message}`);
  }

  // 4. Testing GET /api/students/:id/mock-interviews (Journey Tracking)
  console.log('\n--- 4. Testing Student Mock Interview Journey History ---');
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/SDC00001/mock-interviews`,
      method: 'GET'
    });

    assert(res.status === 200, 'GET /api/students/SDC00001/mock-interviews returned status 200');
    assert(res.data.history && res.data.history.length >= 1, `Found ${res.data.history ? res.data.history.length : 0} mock interview(s) for SDC00001`);
    const item = res.data.history[0];
    assert(item.interview_number === 1, 'Verified interview_number is 1');
    assert(item.total_score === 61, 'Verified total_score is 61');
  } catch (err) {
    assert(false, `Journey history failed: ${err.message}`);
  }

  console.log('\n=======================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
