const http = require('http');

const payload = {
  student_id: 'SDC00001',
  student_name: 'Santhosh',
  email: 'santhoshmani2605@gmail.com',
  interview_number: 1,
  interview_name: 'CodeStart Sprint',
  target_role: 'Python Developer',
  experience_level: 'Fresher / 0–1 Year',
  interview_date: '2026-09-02',
  interview_mode: 'Online (Google Meet)',
  interviewer: 'Skilldome Panel',
  interview_type: 'Technical + HR',
  duration_minutes: 42,
  focus_areas: 'Python Fundamentals, Problem Solving, OOPs, SQL, API Basics & HR Fit',

  score_communication: 10,
  score_technical: 15,
  score_problem_solving: 13,
  score_resume_projects: 14,
  score_behavioral: 10,
  score_confidence: 10,
  score_role_knowledge: 13,

  evaluation_scores: [
    { area_number: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max_score: 15, given_score: 10, percentage: 67, color: '#8b5cf6', badge_class: 'badge-purple' },
    { area_number: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max_score: 20, given_score: 15, percentage: 75, color: '#2563eb', badge_class: 'badge-blue' },
    { area_number: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max_score: 15, given_score: 13, percentage: 87, color: '#16a34a', badge_class: 'badge-green' },
    { area_number: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max_score: 15, given_score: 14, percentage: 93, color: '#ea580c', badge_class: 'badge-orange' },
    { area_number: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max_score: 10, given_score: 10, percentage: 100, color: '#db2777', badge_class: 'badge-pink' },
    { area_number: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max_score: 10, given_score: 10, percentage: 100, color: '#0891b2', badge_class: 'badge-teal' },
    { area_number: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max_score: 15, given_score: 13, percentage: 87, color: '#1d4ed8', badge_class: 'badge-navy' }
  ],

  strengths: [
    'Explained Python concepts clearly and demonstrated strong logical thinking.',
    'Exceeded expectations in behavioral and HR questions with high confidence.',
    'Understood project architecture and resume points with deep clarity.'
  ],
  improvements: [
    'Continue refining advanced optimization and system design concepts.',
    'Practice more timed coding challenges on algorithms.'
  ],
  questions: [
    'Tell me about yourself.',
    'Explain the difference between List and Tuple.',
    'Write a program to solve prime factorization.',
    'How do REST APIs exchange data with frontend clients?'
  ],
  overall_feedback: 'Outstanding interview performance! Santhosh scored 85/100, showing strong technical depth, clear problem-solving logic, and exceptional behavioral maturity.',
  rating_stars: 4,
  action_plan: [
    'Practice 15 Medium-level LeetCode/HackerRank coding problems.',
    'Deepen knowledge on database indexing and query optimization.',
    'Prepare system design case study.'
  ],
  next_interview_name: 'Interview #2 – LogicLeap Challenge',
  next_interview_date: '2026-09-09'
};

const postData = JSON.stringify(payload);

const req = http.request('http://localhost:5000/api/mock-interviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(postData);
req.end();
