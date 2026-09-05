const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDineshDemo() {
  console.log('Seeding Dinesh demo temporary check data...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1. Check if SKD-2026-0001 exists in candidate_registrations
    const [existing] = await conn.query('SELECT * FROM candidate_registrations WHERE student_id = ?', ['SKD-2026-0001']);
    if (existing.length === 0) {
      await conn.query(`
        INSERT INTO candidate_registrations (
          student_id, full_name, email, phone, degree, department, college_name, current_status, interested_domain
        ) VALUES (
          'SKD-2026-0001', 'Dinesh Kumar', 'dinesh.kumar@email.com', '9876543210', 'B.Tech', 'Computer Science', 'Skilldome Institute of Technology', 'Student', 'Python Developer'
        )
      `);
      console.log('✅ Added Dinesh Kumar (SKD-2026-0001) to candidate_registrations');
    } else {
      console.log('ℹ️ Dinesh Kumar (SKD-2026-0001) already exists in candidate_registrations');
    }

    // 2. Insert or update Dinesh mock interview evaluation in mock_interviews
    await conn.query('DELETE FROM mock_interviews WHERE student_id = ?', ['SKD-2026-0001']);
    
    const strengths = JSON.stringify([
      'Explained Python concepts (Lists, Dicts, Functions) clearly.',
      'Demonstrated good logical thinking while solving coding problem.',
      'Understood the project requirement and explained it well.',
      'Good attitude and willingness to learn.'
    ]);

    const improvements = JSON.stringify([
      'Answers were sometimes too lengthy and less structured.',
      'Need to strengthen knowledge in REST API and status codes.',
      'Could not optimize the code in the session.',
      'Need more confidence while answering conceptual questions.'
    ]);

    const questions = JSON.stringify([
      'Tell me about yourself.',
      'What are the key features of Python?',
      'Write a program to check if a number is prime.',
      'Explain the difference between List and Tuple.',
      'What is a REST API? How does it work?',
      'Describe a challenge you faced in a project.'
    ]);

    const actionPlan = JSON.stringify([
      'Practice 15 Python coding problems (Easy–Medium).',
      'Revise REST API concepts, HTTP methods & status codes.',
      'Prepare a 2-minute elevator pitch for yourself and projects.',
      'Practice 5 behavioral questions using STAR format.',
      'Improve communication – be concise and structured.'
    ]);

    const evaluationScores = [
      { area_number: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max_score: 15, given_score: 9, percentage: 60, color: '#8b5cf6', badge_class: 'badge-purple' },
      { area_number: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max_score: 20, given_score: 14, percentage: 70, color: '#2563eb', badge_class: 'badge-blue' },
      { area_number: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max_score: 15, given_score: 10, percentage: 67, color: '#16a34a', badge_class: 'badge-green' },
      { area_number: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max_score: 15, given_score: 8, percentage: 53, color: '#ea580c', badge_class: 'badge-orange' },
      { area_number: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max_score: 10, given_score: 6, percentage: 60, color: '#db2777', badge_class: 'badge-pink' },
      { area_number: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max_score: 10, given_score: 6, percentage: 60, color: '#0891b2', badge_class: 'badge-teal' },
      { area_number: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max_score: 15, given_score: 8, percentage: 53, color: '#1d4ed8', badge_class: 'badge-navy' }
    ];

    const [res] = await conn.query(`
      INSERT INTO mock_interviews (
        student_id, student_name, email,
        interview_number, interview_name, target_role, experience_level,
        interview_date, interview_mode, interviewer, interview_type,
        duration_minutes, focus_areas,
        score_communication, score_technical, score_problem_solving, score_resume_projects,
        score_behavioral, score_confidence, score_role_knowledge,
        total_score, result_level, evaluation_scores_json,
        strengths_json, improvements_json, questions_json,
        overall_feedback, rating_stars, action_plan_json,
        next_interview_name, next_interview_date
      ) VALUES (
        'SKD-2026-0001', 'Dinesh Kumar', 'dinesh.kumar@email.com',
        1, 'CodeStart Sprint', 'Python Developer', 'Fresher / 0–1 Year',
        '2026-09-02', 'Online (Google Meet)', 'Skilldom Panel', 'Technical + HR',
        42, 'Python Fundamentals, Problem Solving, OOPs, SQL, API Basics & HR Fit',
        9, 14, 10, 8, 6, 6, 8,
        61, 'DEVELOPING', ?,
        ?, ?, ?,
        'Dinesh has a good foundation in Python and logical thinking. He is able to answer direct questions well but needs to work on structured communication, depth in concepts (APIs, OOPs), and code optimization. With consistent practice and focused preparation, he can perform strongly in real interviews.',
        3, ?,
        'Interview #2 – LogicLeap Challenge', '2026-09-05'
      )
    `, [JSON.stringify(evaluationScores), strengths, improvements, questions, actionPlan]);

    const mockId = res.insertId;
    await conn.query('DELETE FROM mock_interview_marks WHERE mock_interview_id = ?', [mockId]);
    for (const item of evaluationScores) {
      await conn.query(`
        INSERT INTO mock_interview_marks (
          mock_interview_id, student_id, student_name, area_number,
          evaluation_area, criteria, max_score, given_score, percentage,
          color, badge_class
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        mockId, 'SKD-2026-0001', 'Dinesh Kumar',
        item.area_number, item.area, item.criteria, item.max_score, item.given_score, item.percentage,
        item.color, item.badge_class
      ]);
    }

    console.log('✅ Inserted Dinesh complete blueprint scorecard into mock_interviews & mock_interview_marks table');

  } catch (err) {
    console.error('Error seeding Dinesh:', err);
  } finally {
    await conn.end();
  }
}

seedDineshDemo();
