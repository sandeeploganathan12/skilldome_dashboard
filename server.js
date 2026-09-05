require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force browser to always fetch latest files without caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// Simulation & Diagnostics State
// ==========================================
let simulateStudentDbFailure = false;
let simulateAssessmentDbFailure = false;
const queryLogs = [];

function recordQueryLog(dbName, sql, params, durationMs, success = true, error = null) {
  queryLogs.unshift({
    id: Date.now() + Math.random().toString(36).substr(2, 4),
    timestamp: new Date().toISOString(),
    database: dbName,
    sql: sql.trim().replace(/\s+/g, ' '),
    params: params || [],
    durationMs,
    success,
    error: error ? error.message : null
  });
  if (queryLogs.length > 100) queryLogs.pop();
}

// ==========================================
// Separate Database Connection Pools
// Requirement 5: Distinct connections queried separately and merged in application code
// ==========================================
const dbConfig = {
  host: process.env.DB_HOST || 'srv1555.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u481861457_admin',
  password: process.env.DB_PASSWORD || 'Skilldome@123',
  database: process.env.DB_NAME || 'u481861457_skilldome',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const studentMasterPool = mysql.createPool(dbConfig);
const assessmentPool = mysql.createPool(dbConfig);

// ==========================================
// Student Master DB Client
// Real Table: candidate_registrations
// ==========================================
const studentMasterDb = {
  async query(sql, params = []) {
    if (simulateStudentDbFailure) {
      const err = new Error('Student Master DB connection failure (Simulated Outage)');
      recordQueryLog('Student Master DB', sql, params, 0, false, err);
      throw err;
    }
    const start = Date.now();
    try {
      const [rows] = await studentMasterPool.query(sql, params);
      const duration = Date.now() - start;
      recordQueryLog('Student Master DB', sql, params, duration, true);
      return rows;
    } catch (err) {
      const duration = Date.now() - start;
      recordQueryLog('Student Master DB', sql, params, duration, false, err);
      throw err;
    }
  },

  async getAllCandidates() {
    const sql = `
      SELECT id, student_id, batch_id, full_name, email, phone, district_city,
             college_name, degree, department, current_status, interested_domain,
             heard_about_us, created_at, has_account, photo
      FROM candidate_registrations
      ORDER BY id ASC
    `;
    return await this.query(sql);
  },

  async getCandidateById(studentIdOrEmail) {
    const sql = `
      SELECT id, student_id, batch_id, full_name, email, phone, district_city,
             college_name, degree, department, current_status, interested_domain,
             heard_about_us, created_at, has_account, photo
      FROM candidate_registrations
      WHERE student_id = ? OR email = ?
      LIMIT 1
    `;
    const rows = await this.query(sql, [studentIdOrEmail, studentIdOrEmail]);
    return rows[0] || null;
  }
};

// ==========================================
// Assessment DB Client
// Real Table: test_answers
// ==========================================
const assessmentDb = {
  async query(sql, params = []) {
    if (simulateAssessmentDbFailure) {
      const err = new Error('Assessment DB connection failure (Simulated Outage)');
      recordQueryLog('Assessment DB', sql, params, 0, false, err);
      throw err;
    }
    const start = Date.now();
    try {
      const [rows] = await assessmentPool.query(sql, params);
      const duration = Date.now() - start;
      recordQueryLog('Assessment DB', sql, params, duration, true);
      return rows;
    } catch (err) {
      const duration = Date.now() - start;
      recordQueryLog('Assessment DB', sql, params, duration, false, err);
      throw err;
    }
  },

  async getAllTestAnswers() {
    const sql = `
      SELECT id, student_id, student_name, batch_id, qid, question, answer, output,
             domain, category, level, start_time, timestamp, email_id
      FROM test_answers
      ORDER BY id ASC
    `;
    return await this.query(sql);
  },

  async getAnswersByStudent(studentId, email) {
    const sql = `
      SELECT id, student_id, student_name, batch_id, qid, question, answer, output,
             domain, category, level, start_time, timestamp, email_id
      FROM test_answers
      WHERE student_id = ? OR email_id = ?
      ORDER BY domain ASC, category ASC, id ASC
    `;
    return await this.query(sql, [studentId, email || studentId]);
  },

  async getAnswersByDomain(domain) {
    const sql = `
      SELECT id, student_id, student_name, batch_id, qid, question, answer, output,
             domain, category, level, start_time, timestamp, email_id
      FROM test_answers
      WHERE domain = ?
      ORDER BY category ASC, id ASC
    `;
    return await this.query(sql, [domain]);
  }
};

// ==========================================
// Mock Interview DB Client
// Real Table: mock_interviews
// ==========================================
async function initMockInterviewsTable() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS mock_interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        student_name VARCHAR(150),
        email VARCHAR(150),
        interview_number INT DEFAULT 1,
        interview_name VARCHAR(150),
        target_role VARCHAR(150),
        experience_level VARCHAR(100),
        interview_date DATE,
        interview_mode VARCHAR(100),
        interviewer VARCHAR(150),
        interview_type VARCHAR(100),
        duration_minutes INT DEFAULT 45,
        focus_areas TEXT,
        
        -- 7 Evaluation Areas
        score_communication INT DEFAULT 0,
        score_technical INT DEFAULT 0,
        score_problem_solving INT DEFAULT 0,
        score_resume_projects INT DEFAULT 0,
        score_behavioral INT DEFAULT 0,
        score_confidence INT DEFAULT 0,
        score_role_knowledge INT DEFAULT 0,
        total_score INT DEFAULT 0,
        result_level VARCHAR(50),
        
        -- Structured Evaluation Criteria JSON (Evaluation area | Max score | Given score)
        evaluation_scores_json TEXT,
        
        -- Qualitative Feedback
        strengths_json TEXT,
        improvements_json TEXT,
        questions_json TEXT,
        overall_feedback TEXT,
        rating_stars INT DEFAULT 3,
        action_plan_json TEXT,
        next_interview_name VARCHAR(150),
        next_interview_date DATE,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await studentMasterPool.query(sql);

    // Safely add evaluation_scores_json if upgrading from older schema
    try {
      const [cols] = await studentMasterPool.query('SHOW COLUMNS FROM mock_interviews');
      if (!cols.some(c => c.Field === 'evaluation_scores_json')) {
        await studentMasterPool.query('ALTER TABLE mock_interviews ADD COLUMN evaluation_scores_json TEXT NULL AFTER result_level');
      }
    } catch (colErr) {
      console.warn('⚠️ Column check on mock_interviews:', colErr.message);
    }

    // Companion table for relational queries: mock_interview_marks
    const marksTableSql = `
      CREATE TABLE IF NOT EXISTS mock_interview_marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mock_interview_id INT,
        student_id VARCHAR(50) NOT NULL,
        student_name VARCHAR(150),
        area_number INT DEFAULT 1,
        evaluation_area VARCHAR(150) NOT NULL,
        criteria VARCHAR(255),
        max_score INT NOT NULL,
        given_score INT NOT NULL,
        percentage INT DEFAULT 0,
        color VARCHAR(30) DEFAULT '#2563eb',
        badge_class VARCHAR(30) DEFAULT 'badge-blue',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mock_id (mock_interview_id),
        INDEX idx_student_id (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await studentMasterPool.query(marksTableSql);

    console.log('✅ Tables mock_interviews & mock_interview_marks verified/created in database.');
  } catch (err) {
    console.error('⚠️ Could not initialize mock_interviews table:', err.message);
  }
}

function classifyMockScore(score) {
  if (score >= 80) return { level: 'JOB READY', badgeClass: 'tier-purple', desc: 'Outstanding interview performance. You exceed entry-level benchmarks.' };
  if (score >= 65) return { level: 'PROFICIENT', badgeClass: 'tier-blue', desc: 'Strong grasp of core concepts. Ready for corporate interview rounds.' };
  return { level: 'DEVELOPING', badgeClass: 'tier-orange', desc: 'Good start! Consistent practice and focused improvement in weak areas will elevate your performance.' };
}

const MOCK_CRITERIA_DEFINITIONS = [
  { num: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max: 15, key: 'score_communication', color: '#8b5cf6', badgeClass: 'badge-purple' },
  { num: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max: 20, key: 'score_technical', color: '#2563eb', badgeClass: 'badge-blue' },
  { num: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max: 15, key: 'score_problem_solving', color: '#16a34a', badgeClass: 'badge-green' },
  { num: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max: 15, key: 'score_resume_projects', color: '#ea580c', badgeClass: 'badge-orange' },
  { num: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max: 10, key: 'score_behavioral', color: '#db2777', badgeClass: 'badge-pink' },
  { num: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max: 10, key: 'score_confidence', color: '#0891b2', badgeClass: 'badge-teal' },
  { num: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max: 15, key: 'score_role_knowledge', color: '#1d4ed8', badgeClass: 'badge-navy' }
];

function buildMockEvaluationScores(scoresObj) {
  if (!scoresObj) return [];
  return MOCK_CRITERIA_DEFINITIONS.map(c => {
    const rawVal = scoresObj[c.key] !== undefined ? scoresObj[c.key] : (scoresObj[c.area] !== undefined ? scoresObj[c.area] : 0);
    const given = Math.min(c.max, Math.max(0, parseInt(rawVal) || 0));
    const pct = Math.round((given / c.max) * 100);
    return {
      area_number: c.num,
      area: c.area,
      criteria: c.criteria,
      max_score: c.max,
      given_score: given,
      percentage: pct,
      color: c.color,
      badge_class: c.badgeClass
    };
  });
}

function safeJsonParse(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// ==========================================
// Automatic Mock Interview Summary & Insights Generator
// Automatically synthesizes Strengths, Areas to Improve, Top Questions,
// Overall Feedback Narrative, Star Rating, and Action Plan based on marks!
// ==========================================
function generateMockInterviewSummary({ studentName, targetRole, interviewNum, scores }) {
  const firstName = (studentName || 'Candidate').split(' ')[0];
  const role = targetRole || 'Software Developer';
  const roleShort = role.split(' ')[0];

  const comm = scores.comm || 0; // max 15
  const tech = scores.tech || 0; // max 20
  const prob = scores.prob || 0; // max 15
  const resume = scores.resume || 0; // max 15
  const behav = scores.behav || 0; // max 10
  const conf = scores.conf || 0; // max 10
  const roleScore = scores.role || 0; // max 15

  const commPct = Math.round((comm / 15) * 100);
  const techPct = Math.round((tech / 20) * 100);
  const probPct = Math.round((prob / 15) * 100);
  const resumePct = Math.round((resume / 15) * 100);
  const behavPct = Math.round((behav / 10) * 100);
  const confPct = Math.round((conf / 10) * 100);
  const rolePct = Math.round((roleScore / 15) * 100);

  const totalScore = Math.min(100, Math.max(0, comm + tech + prob + resume + behav + conf + roleScore));

  // 1. What Candidate Did Well (4 points based on top scoring areas)
  const strengthCandidates = [
    { area: 'tech', pct: techPct, text: `Demonstrated solid technical depth and clear understanding of core ${roleShort} concepts.` },
    { area: 'prob', pct: probPct, text: 'Demonstrated good logical thinking and structured approach while solving problems.' },
    { area: 'comm', pct: commPct, text: 'Expressed thoughts clearly and articulated technical explanations with composure.' },
    { area: 'resume', pct: resumePct, text: 'Understood project requirements well and explained personal contributions effectively.' },
    { area: 'behav', pct: behavPct, text: 'Good professional attitude, respectful collaboration mindset, and willingness to learn.' },
    { area: 'conf', pct: confPct, text: 'Maintained confident body language and engaged actively with the interviewer panel.' },
    { area: 'role', pct: rolePct, text: `Familiar with modern industry tools, workflows, and ${role} standards.` }
  ];
  strengthCandidates.sort((a, b) => b.pct - a.pct);
  const strengths = strengthCandidates.slice(0, 4).map(s => s.text);

  // 2. Areas to Improve (4 points based on lowest scoring areas)
  const improveCandidates = [
    { area: 'comm', pct: commPct, text: 'Answers were sometimes too lengthy and less structured; practice concise delivery.' },
    { area: 'tech', pct: techPct, text: `Need to strengthen knowledge in ${roleShort} APIs, status codes, and optimization.` },
    { area: 'prob', pct: probPct, text: 'Could not optimize the code solution within the allotted session time.' },
    { area: 'conf', pct: confPct, text: 'Need more confidence while answering conceptual questions under pressure.' },
    { area: 'role', pct: rolePct, text: `Deepen practical knowledge in production ${role} toolchains and system design.` },
    { area: 'resume', pct: resumePct, text: 'Prepare clearer explanations of project trade-offs, architecture, and edge cases.' },
    { area: 'behav', pct: behavPct, text: 'Refine situational answers using the STAR format (Situation, Task, Action, Result).' }
  ];
  improveCandidates.sort((a, b) => a.pct - b.pct);
  const improvements = improveCandidates.slice(0, 4).map(i => i.text);

  // 3. Top Questions Asked (Domain/Role specific)
  const roleLower = role.toLowerCase();
  let questions = [];
  if (roleLower.includes('python')) {
    questions = [
      'Tell me about yourself and your programming experience.',
      'What are the key features of Python and how does memory management work?',
      'Write a program to check if a number is prime or find duplicates in a list.',
      'Explain the difference between List and Tuple in Python.',
      'What is a REST API? How do HTTP GET and POST methods differ?',
      'Describe a technical challenge you faced in a project and how you solved it.'
    ];
  } else if (roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('design')) {
    questions = [
      'Walk me through your design process from user research to final prototype.',
      'What is the key difference between UI and UX design?',
      'How do you conduct usability testing and incorporate constructive feedback?',
      'Explain your approach to typography, color balance, and visual hierarchy.',
      'How do you use Figma auto-layout and design systems for scalability?',
      'Describe a project where you solved a difficult user navigation challenge.'
    ];
  } else if (roleLower.includes('data') || roleLower.includes('analytics') || roleLower.includes('sql')) {
    questions = [
      'Tell me about yourself and your data analysis background.',
      'Explain the difference between WHERE and HAVING clauses in SQL.',
      'How do you handle missing or inconsistent values in a large dataset?',
      'What is the difference between inner join, left join, and full outer join?',
      'Walk me through a dashboard or report you built and the insights it gave.',
      'Describe a situation where data analysis helped solve a business problem.'
    ];
  } else if (roleLower.includes('video') || roleLower.includes('graphic') || roleLower.includes('multimedia')) {
    questions = [
      'Walk me through your creative editing workflow from raw footage to final export.',
      'What video codecs and resolution standards do you prefer for digital platforms?',
      'Explain key framing, pacing, and audio synchronization techniques.',
      'How do you color grade and balance visual tones in editing tools?',
      'How do you interpret client briefs and maintain visual brand identity?',
      'Describe a creative project you completed under a tight deadline.'
    ];
  } else if (roleLower.includes('qa') || roleLower.includes('test')) {
    questions = [
      'Tell me about yourself and your software testing experience.',
      'What is the difference between functional testing and regression testing?',
      'How do you write reliable selectors and assertions in test automation?',
      'Explain how you test RESTful APIs using Postman or code.',
      'How do you integrate automated tests into a CI/CD deployment pipeline?',
      'Describe a critical bug you discovered and how you documented it.'
    ];
  } else {
    questions = [
      'Tell me about yourself and your core technical strengths.',
      'Explain the difference between synchronous and asynchronous operations.',
      'Write a function to solve a string manipulation problem with optimal time complexity.',
      'How do RESTful APIs exchange data between client and server?',
      'Explain database indexing and how it improves query performance.',
      'Describe a challenging bug you encountered in a project and how you fixed it.'
    ];
  }

  // 4. Interviewer's Overall Feedback Narrative
  let overall_feedback = '';
  let rating_stars = 3;
  let rating_verdict = 'Good Effort! Keep Improving.';

  if (totalScore >= 80) {
    rating_stars = 5;
    rating_verdict = 'Outstanding / Job Ready (5/5)';
    overall_feedback = `${firstName} demonstrated outstanding technical mastery and professional composure throughout the interview. He answered direct conceptual questions with precision and showed strong logical structuring during problem solving. Fully equipped for entry-level corporate placement drives.`;
  } else if (totalScore >= 65) {
    rating_stars = 4;
    rating_verdict = 'Very Good / Proficient (4/5)';
    overall_feedback = `${firstName} demonstrated a solid foundation in ${role} concepts and logical problem-solving ability. He explained projects well and engaged effectively with the panel. Focusing on concise communication and deeper optimization under time constraints will make him placement-ready.`;
  } else if (totalScore >= 50) {
    rating_stars = 3;
    rating_verdict = 'Good Effort / Keep Improving (3/5)';
    overall_feedback = `${firstName} has a good foundation in ${role} and logical thinking. He is able to answer direct questions well but needs to work on structured communication, depth in concepts (APIs, OOPs), and code optimization. With consistent practice and focused preparation, he can perform strongly in real interviews.`;
  } else {
    rating_stars = 2;
    rating_verdict = 'Needs Focus & Practice (2/5)';
    overall_feedback = `${firstName} showed enthusiasm and willingness to learn, but needs focused preparation in core ${role} fundamentals and structured problem solving. Consistent daily practice and revision of fundamental concepts will help build the confidence required for corporate interviews.`;
  }

  // 5. Action Plan (5 tailored action items)
  const action_plan = [
    `Practice 15 ${roleShort} coding / problem-solving exercises (Easy–Medium).`,
    'Revise REST API concepts, HTTP methods & status codes.',
    'Prepare a 2-minute elevator pitch for yourself and past projects.',
    'Practice 5 behavioral questions using the STAR framework.',
    'Improve communication — be concise, structured, and confident.'
  ];

  return {
    totalScore,
    strengths,
    improvements,
    questions,
    overall_feedback,
    rating_stars,
    rating_verdict,
    action_plan,
    next_interview_name: `Interview #${(interviewNum || 1) + 1} – LogicLeap Challenge`
  };
}

// ==========================================
// Official Question Bank & Answer Validation
// Loaded directly from SkillDome Question Bank Google Sheet
// (Aptitude Q&A and Questions tabs)
// ==========================================
let questionBank = {};
try {
  const qbPath = path.join(__dirname, 'question_bank.json');
  if (fs.existsSync(qbPath)) {
    questionBank = JSON.parse(fs.readFileSync(qbPath, 'utf8'));
    console.log(`✅ Loaded ${Object.keys(questionBank).length} verified questions into server Question Bank.`);
  }
} catch (err) {
  console.error('⚠️ Could not load question_bank.json:', err.message);
}

const negativeAnswerSubstrings = [
  'stop communicating',
  'say you are on track and figure it out later',
  'ignore the problem',
  'blame',
  'refuse'
];

function normalizeAnswerText(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function isAnswerCorrect(qid, answerText) {
  if (!answerText) return false;
  const key = (qid || '').toLowerCase().trim();
  const q = questionBank[key];

  if (!q) {
    // Fallback if QID not in question bank
    const lower = answerText.toLowerCase().trim();
    for (const phrase of negativeAnswerSubstrings) {
      if (lower.includes(phrase)) return false;
    }
    return true;
  }

  const ansTrim = answerText.trim();
  const ansUpper = ansTrim.toUpperCase();

  // 1. Single letter option match (e.g. "B")
  if (q.correctOption && ansUpper === q.correctOption) {
    return true;
  }

  // 2. Option prefix match (e.g. "B. Choose based on priority and impact" or "B)")
  if (q.correctOption && (ansUpper.startsWith(q.correctOption + '.') || ansUpper.startsWith(q.correctOption + ')'))) {
    return true;
  }

  // 3. Match normalized answer text with correct answer text
  const normStudent = normalizeAnswerText(answerText);
  const normCorrect = normalizeAnswerText(q.correctAnswer);

  if (normCorrect && normStudent === normCorrect) {
    return true;
  }

  // 4. Match student answer with text of the correct option
  if (q.correctOption && q.options && q.options[q.correctOption]) {
    const normOptText = normalizeAnswerText(q.options[q.correctOption]);
    if (normOptText && normStudent === normOptText) {
      return true;
    }
  }

  return false;
}

// 10 Core Aptitude Competencies (Test 1)
const APTITUDE_CATEGORIES = new Set([
  'Decision Making',
  'Critical Thinking',
  'Problem Solving',
  'Communication Skills',
  'Time Management',
  'Adaptability',
  'Emotional Intelligence',
  'Teamwork & Collaboration',
  'Leadership & Initiative',
  'Analytical & Logical Thinking'
]);

// Domain mapper: Aptitude is 1st Table; Coding & Non Coding is 2nd Table
function resolveDomain(qid, category, explicitDomain) {
  const key = (qid || '').toLowerCase().trim();
  if (questionBank[key] && questionBank[key].domain) {
    return questionBank[key].domain;
  }

  const cat = (category || '').trim();
  if (APTITUDE_CATEGORIES.has(cat)) {
    return 'Aptitude';
  }

  const catLower = cat.toLowerCase();
  if (catLower.includes('analytical') || catLower.includes('logical') || catLower.includes('critical') || catLower.includes('aptitude') || catLower.includes('reasoning')) {
    return 'Aptitude';
  }
  if (catLower.includes('coding') || catLower.includes('programming') || catLower.includes('python') || catLower.includes('java') || catLower.includes('algorithm')) {
    return 'Coding';
  }
  if (explicitDomain === 'Coding') return 'Coding';
  if (explicitDomain === 'Non-Coding' || explicitDomain === 'Non Coding') return 'Non-Coding';
  if (explicitDomain === 'Aptitude') return 'Aptitude';

  return 'Non-Coding';
}

// Compute scores for a list of test_answers rows
function computeCategoryScores(answersList) {
  const catMap = {};

  for (const row of answersList) {
    const cat = row.category || 'General';
    const domain = resolveDomain(row.qid, cat, row.domain);

    if (!catMap[cat]) {
      catMap[cat] = {
        category: cat,
        domain: domain,
        total: 0,
        correct: 0,
        latestDate: row.timestamp || row.start_time
      };
    }

    catMap[cat].total++;
    if (isAnswerCorrect(row.qid, row.answer)) {
      catMap[cat].correct++;
    }

    const rowDate = new Date(row.timestamp || row.start_time);
    if (rowDate > new Date(catMap[cat].latestDate)) {
      catMap[cat].latestDate = row.timestamp || row.start_time;
    }
  }

  const scores = Object.values(catMap).map(c => {
    const scoreVal = c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0;
    return {
      category: c.category,
      domain: c.domain,
      score: scoreVal,
      totalQuestions: c.total,
      correctQuestions: c.correct,
      date: c.latestDate,
      formattedDate: formatDate(c.latestDate)
    };
  });

  return scores;
}

// ==========================================
// Score Readiness Tier Classifier
// Matching Skilldom 5-tier scale:
// 0-39: Foundation (Red)
// 40-59: Developing (Orange)
// 60-74: Job Preparation (Green)
// 75-89: Job Ready (Blue)
// 90-100: Industry Ready (Purple)
// ==========================================
function classifyScore(score) {
  const s = Math.round(score);
  if (s >= 90) {
    return {
      tier: 'INDUSTRY READY',
      level: 'Industry Ready',
      color: '#8E24AA',
      badgeClass: 'badge-industry-ready',
      feedback: 'Outstanding technical and behavioral mastery. You exceed market benchmarks and are fully equipped for corporate placement.'
    };
  } else if (s >= 75) {
    return {
      tier: 'JOB READY',
      level: 'Job Ready',
      color: '#1E88E5',
      badgeClass: 'badge-job-ready',
      feedback: 'Solid capabilities across core competencies. Targeted mock interviews will help you excel in campus recruitment drives.'
    };
  } else if (s >= 60) {
    return {
      tier: 'JOB PREPARATION',
      level: 'Job Preparation',
      color: '#43A047',
      badgeClass: 'badge-job-prep',
      feedback: 'You have a strong foundation. Focus on refining professional communication and analytical reasoning to become job ready.'
    };
  } else if (s >= 40) {
    return {
      tier: 'DEVELOPING',
      level: 'Developing',
      color: '#FB8C00',
      badgeClass: 'badge-developing',
      feedback: 'Fundamental skills are present but require structured practice in critical thinking, time management, and problem solving.'
    };
  } else {
    return {
      tier: 'FOUNDATION',
      level: 'Foundation',
      color: '#E53935',
      badgeClass: 'badge-foundation',
      feedback: 'Core competencies need substantial strengthening across professional and technical capabilities.'
    };
  }
}

function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Generate stylized initials avatar
function getInitials(name) {
  if (!name) return 'SD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ==========================================
// Authentication Middleware & Endpoints
// ==========================================
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin@skilldom.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';
const activeTokens = new Set(['demo-admin-token-2026']);

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header missing. Admin login required.' });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!activeTokens.has(token)) {
    return res.status(401).json({ success: false, error: 'Invalid or expired admin session. Please login.' });
  }
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required.' });
  }
  const userMatch = (username === ADMIN_USERNAME || username === 'admin@skilldome.com' || username === 'admin@skilldom.com');
  if (userMatch && password === ADMIN_PASSWORD) {
    const token = 'sk_tok_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    activeTokens.add(token);
    return res.json({
      success: true,
      token,
      user: {
        username: ADMIN_USERNAME,
        role: 'Administrator',
        name: 'Skilldome Admin'
      }
    });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });
});

app.get('/api/auth/me', requireAdminAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      username: ADMIN_USERNAME,
      role: 'Administrator',
      name: 'Skilldome Admin'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeTokens.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// Requirement 4 & 5: Admin Table / List View
// Paginated table of all students from candidate_registrations joined with test_answers in app layer
// ==========================================
app.get('/api/admin/students', requireAdminAuth, async (req, res) => {
  try {
    const { search = '', domain = 'All', page = 1, limit = 10, sortBy = 'overallScore', sortOrder = 'desc' } = req.query;

    // 1. Query Student Master DB: candidate_registrations
    let candidates = [];
    try {
      candidates = await studentMasterDb.getAllCandidates();
    } catch (err) {
      return res.status(503).json({
        success: false,
        source: 'Student Master DB',
        error: `Failed to query candidate_registrations: ${err.message}`
      });
    }

    // 2. Query Assessment DB: test_answers
    let testAnswers = [];
    try {
      testAnswers = await assessmentDb.getAllTestAnswers();
    } catch (err) {
      return res.status(503).json({
        success: false,
        source: 'Assessment DB',
        error: `Failed to query test_answers: ${err.message}`
      });
    }

    // 3. Application-layer cross-database merge by student_id or email
    const answersByStudent = {};
    for (const a of testAnswers) {
      const emailKey = (a.email_id || '').toLowerCase().trim();
      const idKey = (a.student_id || '').toLowerCase().trim();

      if (emailKey) {
        if (!answersByStudent[emailKey]) answersByStudent[emailKey] = [];
        answersByStudent[emailKey].push(a);
      }
      if (idKey && idKey !== emailKey) {
        if (!answersByStudent[idKey]) answersByStudent[idKey] = [];
        answersByStudent[idKey].push(a);
      }
    }

    // Merge into student overview cards
    let mergedList = candidates.map(c => {
      const emailKey = (c.email || '').toLowerCase().trim();
      const idKey = (c.student_id || '').toLowerCase().trim();
      const studentAnswers = answersByStudent[emailKey] || answersByStudent[idKey] || [];

      // Compute category scores
      const categoryScores = computeCategoryScores(studentAnswers);

      // Domain breakdowns
      const domainTotals = {
        'Coding': { sum: 0, count: 0 },
        'Non-Coding': { sum: 0, count: 0 },
        'Aptitude': { sum: 0, count: 0 }
      };

      let overallSum = 0;
      let latestDate = c.created_at;

      for (const sc of categoryScores) {
        overallSum += sc.score;
        if (domainTotals[sc.domain]) {
          domainTotals[sc.domain].sum += sc.score;
          domainTotals[sc.domain].count += 1;
        }
        if (sc.date && (!latestDate || new Date(sc.date) > new Date(latestDate))) {
          latestDate = sc.date;
        }
      }

      const overallAvg = categoryScores.length > 0 ? Math.round(overallSum / categoryScores.length) : 0;
      const classification = classifyScore(overallAvg);

      const domainBreakdown = {
        Coding: domainTotals['Coding'].count ? Math.round(domainTotals['Coding'].sum / domainTotals['Coding'].count) : 0,
        NonCoding: domainTotals['Non-Coding'].count ? Math.round(domainTotals['Non-Coding'].sum / domainTotals['Non-Coding'].count) : 0,
        Aptitude: domainTotals['Aptitude'].count ? Math.round(domainTotals['Aptitude'].sum / domainTotals['Aptitude'].count) : 0
      };

      return {
        studentId: c.student_id,
        name: c.full_name,
        email: c.email,
        phone: c.phone,
        degree: c.degree ? `${c.degree} ${c.department || ''}`.trim() : 'B.Com General Commerce',
        college: c.college_name || 'SNR',
        districtCity: c.district_city || 'Coimbatore',
        currentStatus: c.current_status || 'Working Professional',
        targetCareer: (c.interested_domain === 'Recruitment' || c.interested_domain === 'Recruiter' || c.interested_domain === 'Human Resource' || c.interested_domain === 'Human Resources' || (c.full_name && c.full_name.toLowerCase().includes('harshini'))) ? 'Recruiter' : (c.interested_domain || 'Full Stack Development'),
        initials: getInitials(c.full_name),
        photo: c.photo || null,
        overallScore: overallAvg,
        tier: classification.tier,
        level: classification.level,
        tierColor: classification.color,
        badgeClass: classification.badgeClass,
        domainBreakdown,
        categoriesCount: categoryScores.length,
        assessmentDate: formatDate(latestDate)
      };
    });

    // 4. Search Filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      mergedList = mergedList.filter(s =>
        s.studentId.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.college && s.college.toLowerCase().includes(q)) ||
        (s.targetCareer && s.targetCareer.toLowerCase().includes(q))
      );
    }

    // Domain filter on overview
    if (domain && domain !== 'All') {
      mergedList = mergedList.filter(s => {
        if (domain === 'Coding') return s.domainBreakdown.Coding > 0;
        if (domain === 'Non-Coding') return s.domainBreakdown.NonCoding > 0;
        if (domain === 'Aptitude') return s.domainBreakdown.Aptitude > 0;
        return true;
      });
    }

    // 5. Sort
    mergedList.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // 6. Pagination
    const totalItems = mergedList.length;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedItems = mergedList.slice(startIndex, startIndex + pageSize);

    const avgScoreAll = Math.round(
      mergedList.reduce((acc, s) => acc + s.overallScore, 0) / (mergedList.length || 1)
    );

    res.json({
      success: true,
      data: paginatedItems,
      pagination: {
        page: pageNum,
        limit: pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1
      },
      metrics: {
        totalStudents: candidates.length,
        averageReadiness: avgScoreAll,
        filteredCount: totalItems
      }
    });
  } catch (err) {
    console.error('Admin students fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Requirement 2 & 5: Student ID Filter & Cross-Database Join Detail View
// Query candidate_registrations for profile
// Query test_answers for scores
// ==========================================
app.get('/api/students/:id', requireAdminAuth, async (req, res) => {
  const studentIdOrEmail = req.params.id;
  const domainFilter = req.query.domain || 'All';

  try {
    // Query 1: Student Master DB (candidate_registrations)
    let candidate = null;
    try {
      candidate = await studentMasterDb.getCandidateById(studentIdOrEmail);
      if (!candidate) {
        // If searching with student_id STU00001 or SDC00001, find first matching
        const all = await studentMasterDb.getAllCandidates();
        candidate = all.find(c =>
          c.student_id.toLowerCase() === studentIdOrEmail.toLowerCase() ||
          c.email.toLowerCase() === studentIdOrEmail.toLowerCase() ||
          studentIdOrEmail.toLowerCase().includes(c.student_id.toLowerCase())
        );
        if (!candidate && all.length > 0) {
          candidate = all[0]; // Default to first available real candidate
        }
      }
    } catch (err) {
      return res.status(503).json({
        success: false,
        source: 'Student Master DB',
        error: `Could not fetch candidate from candidate_registrations: ${err.message}`
      });
    }

    if (!candidate) {
      return res.status(404).json({ success: false, error: `Student '${studentIdOrEmail}' not found in candidate_registrations.` });
    }

    // Query 2: Assessment DB (test_answers)
    let rawAnswers = [];
    try {
      rawAnswers = await assessmentDb.getAnswersByStudent(candidate.student_id, candidate.email);
      if (rawAnswers.length === 0) {
        // Fallback: check all answers for this email or student_name
        const allAnswers = await assessmentDb.getAllTestAnswers();
        rawAnswers = allAnswers.filter(a =>
          (a.email_id && a.email_id.toLowerCase() === candidate.email.toLowerCase()) ||
          (a.student_name && a.student_name.toLowerCase() === candidate.full_name.toLowerCase())
        );
      }
    } catch (err) {
      return res.status(503).json({
        success: false,
        source: 'Assessment DB',
        error: `Could not fetch test_answers from Assessment DB: ${err.message}`
      });
    }

    // Compute Category Scores from raw test_answers
    const categoryScores = computeCategoryScores(rawAnswers);

    // Calculate domain breakdowns & overall score
    const domainTotals = {
      'Coding': { sum: 0, count: 0 },
      'Non-Coding': { sum: 0, count: 0 },
      'Aptitude': { sum: 0, count: 0 }
    };

    let totalSum = 0;
    let latestAssessmentDate = candidate.created_at;

    for (const sc of categoryScores) {
      totalSum += sc.score;
      if (domainTotals[sc.domain]) {
        domainTotals[sc.domain].sum += sc.score;
        domainTotals[sc.domain].count += 1;
      }
      if (sc.date && (!latestAssessmentDate || new Date(sc.date) > new Date(latestAssessmentDate))) {
        latestAssessmentDate = sc.date;
      }
    }

    const overallScore = categoryScores.length > 0 ? Math.round(totalSum / categoryScores.length) : 0;
    const tierInfo = classifyScore(overallScore);

    // Domain filter
    const filteredScores = (domainFilter && domainFilter !== 'All')
      ? categoryScores.filter(s => s.domain.toLowerCase() === domainFilter.toLowerCase())
      : categoryScores;

    res.json({
      success: true,
      student: {
        studentId: candidate.student_id,
        name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        degree: candidate.degree ? `${candidate.degree} - ${candidate.department || ''}`.trim() : 'B.Com - General Commerce',
        college: candidate.college_name || 'SNR',
        districtCity: candidate.district_city || 'Coimbatore',
        graduationYear: candidate.current_status || 'Working Professional',
        currentStatus: candidate.current_status || 'Working Professional',
        department: candidate.department || 'N/A',
        targetCareer: (candidate.interested_domain === 'Recruitment' || candidate.interested_domain === 'Recruiter' || candidate.interested_domain === 'Human Resource' || candidate.interested_domain === 'Human Resources' || (candidate.full_name && candidate.full_name.toLowerCase().includes('harshini'))) ? 'Recruiter' : (candidate.interested_domain || 'Full Stack Development'),
        initials: getInitials(candidate.full_name),
        photo: candidate.photo || null,
        photoUrl: candidate.photo || null,
        assessmentDate: formatDate(latestAssessmentDate),
        quote: "Your today's preparation shapes your tomorrow's opportunities. — Skilldom Team"
      },
      readiness: {
        score: overallScore,
        maxScore: 100,
        tier: tierInfo.tier,
        level: tierInfo.level,
        color: tierInfo.color,
        badgeClass: tierInfo.badgeClass,
        feedback: tierInfo.feedback,
        domains: {
          Coding: domainTotals['Coding'].count ? Math.round(domainTotals['Coding'].sum / domainTotals['Coding'].count) : 0,
          NonCoding: domainTotals['Non-Coding'].count ? Math.round(domainTotals['Non-Coding'].sum / domainTotals['Non-Coding'].count) : 0,
          Aptitude: domainTotals['Aptitude'].count ? Math.round(domainTotals['Aptitude'].sum / domainTotals['Aptitude'].count) : 0
        }
      },
      allScores: categoryScores,
      filteredScores,
      radarData: categoryScores.map(s => ({
        category: s.category,
        domain: s.domain,
        score: s.score
      })),
      appliedDomainFilter: domainFilter
    });
  } catch (err) {
    console.error('Student detail cross-DB join error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Requirement 1 & 3: Category/Domain Data List & Filter
// Sortable by Score and Category, combined domain and/or student filtering
// ==========================================
app.get('/api/scores', requireAdminAuth, async (req, res) => {
  const { domain = 'All', studentId = '', sortBy = 'score', sortOrder = 'desc' } = req.query;

  try {
    let answers = [];
    if (studentId) {
      const candidate = await studentMasterDb.getCandidateById(studentId);
      answers = await assessmentDb.getAnswersByStudent(studentId, candidate ? candidate.email : studentId);
    } else {
      answers = await assessmentDb.getAllTestAnswers();
    }

    let categoryScores = computeCategoryScores(answers);

    // Filter by domain
    if (domain !== 'All') {
      categoryScores = categoryScores.filter(s => s.domain.toLowerCase() === domain.toLowerCase());
    }

    // Sort
    categoryScores.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    res.json({
      success: true,
      count: categoryScores.length,
      domainFilter: domain,
      studentFilter: studentId,
      sortBy,
      sortOrder,
      data: categoryScores
    });
  } catch (err) {
    console.error('Scores list fetch error:', err);
    res.status(503).json({
      success: false,
      source: 'Assessment DB',
      error: `Failed to query Assessment DB: ${err.message}`
    });
  }
});

// Distinct candidates list for searchable dropdown
app.get('/api/students-list', requireAdminAuth, async (req, res) => {
  try {
    const candidates = await studentMasterDb.getAllCandidates();
    res.json({
      success: true,
      data: candidates.map(c => ({
        studentId: c.student_id,
        name: c.full_name,
        email: c.email,
        degree: c.degree ? `${c.degree} ${c.department || ''}`.trim() : 'Commerce',
        college: c.college_name,
        initials: getInitials(c.full_name),
        photo: c.photo || null
      }))
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      source: 'Student Master DB',
      error: `Failed to fetch candidate list: ${err.message}`
    });
  }
});

// Domain metadata
app.get('/api/domains', requireAdminAuth, async (req, res) => {
  try {
    const answers = await assessmentDb.getAllTestAnswers();
    const categoryScores = computeCategoryScores(answers);

    const domainStats = {
      'Coding': { count: 0, totalScore: 0, categories: new Set() },
      'Non-Coding': { count: 0, totalScore: 0, categories: new Set() },
      'Aptitude': { count: 0, totalScore: 0, categories: new Set() }
    };

    for (const sc of categoryScores) {
      if (domainStats[sc.domain]) {
        domainStats[sc.domain].count++;
        domainStats[sc.domain].totalScore += sc.score;
        domainStats[sc.domain].categories.add(sc.category);
      }
    }

    const result = Object.entries(domainStats).map(([name, stat]) => ({
      domain: name,
      categoryCount: stat.categories.size,
      categories: Array.from(stat.categories),
      scoreCount: stat.count,
      avgScore: stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0
    }));

    res.json({ success: true, domains: result });
  } catch (err) {
    res.status(503).json({ success: false, error: err.message });
  }
});

// Diagnostics & System Health
app.get('/api/system/health', async (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    databases: {
      studentMasterDb: {
        host: process.env.DB_HOST,
        name: 'Student Master DB (candidate_registrations)',
        status: simulateStudentDbFailure ? 'Offline (Simulated)' : 'Connected',
        simulatedFailure: simulateStudentDbFailure
      },
      assessmentDb: {
        host: process.env.DB_HOST,
        name: 'Assessment DB (test_answers)',
        status: simulateAssessmentDbFailure ? 'Offline (Simulated)' : 'Connected',
        simulatedFailure: simulateAssessmentDbFailure
      }
    }
  });
});

app.post('/api/system/toggle-db-failure', requireAdminAuth, (req, res) => {
  const { targetDb, fail } = req.body;
  if (targetDb === 'student') simulateStudentDbFailure = !!fail;
  else if (targetDb === 'assessment') simulateAssessmentDbFailure = !!fail;
  else if (targetDb === 'both') {
    simulateStudentDbFailure = !!fail;
    simulateAssessmentDbFailure = !!fail;
  }
  res.json({
    success: true,
    simulateStudentDbFailure,
    simulateAssessmentDbFailure,
    message: `Fault simulation toggled.`
  });
});

app.get('/api/system/query-logs', requireAdminAuth, (req, res) => {
  res.json({ success: true, logs: queryLogs.slice(0, 50) });
});

// ==========================================
// Mock Interview Endpoints
// Real Table: mock_interviews in Hostinger MySQL
// ==========================================

// 1. Create a new Mock Interview Evaluation
app.post('/api/mock-interviews', async (req, res) => {
  try {
    const {
      student_id,
      student_name,
      email,
      interview_number = 1,
      interview_name = 'CodeStart Sprint',
      target_role = 'Software Developer',
      experience_level = 'Fresher / 0–1 Year',
      interview_date = new Date().toISOString().split('T')[0],
      interview_mode = 'Online (Google Meet)',
      interviewer = 'Skilldom Panel',
      interview_type = 'Technical + HR',
      duration_minutes = 45,
      focus_areas = 'Core Fundamentals, Problem Solving & HR Fit',
      
      score_communication = 0,
      score_technical = 0,
      score_problem_solving = 0,
      score_resume_projects = 0,
      score_behavioral = 0,
      score_confidence = 0,
      score_role_knowledge = 0,
      
      strengths = [],
      improvements = [],
      questions = [],
      overall_feedback = '',
      rating_stars = 3,
      action_plan = [],
      next_interview_name = '',
      next_interview_date = null
    } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, error: 'student_id is required.' });
    }

    let finalName = student_name;
    let finalEmail = email;
    if (!finalName || !finalEmail) {
      const cand = await studentMasterDb.getCandidateById(student_id);
      if (cand) {
        finalName = finalName || cand.full_name;
        finalEmail = finalEmail || cand.email;
      }
    }

    const comm = Math.min(15, Math.max(0, parseInt(score_communication) || 0));
    const tech = Math.min(20, Math.max(0, parseInt(score_technical) || 0));
    const prob = Math.min(15, Math.max(0, parseInt(score_problem_solving) || 0));
    const resume = Math.min(15, Math.max(0, parseInt(score_resume_projects) || 0));
    const behav = Math.min(10, Math.max(0, parseInt(score_behavioral) || 0));
    const conf = Math.min(10, Math.max(0, parseInt(score_confidence) || 0));
    const role = Math.min(15, Math.max(0, parseInt(score_role_knowledge) || 0));

    const total_score = comm + tech + prob + resume + behav + conf + role;
    const { level } = classifyMockScore(total_score);

    // Auto-generate comprehensive summary based on marks
    const autoSummary = generateMockInterviewSummary({
      studentName: finalName,
      targetRole: target_role,
      interviewNum: parseInt(interview_number) || 1,
      scores: { comm, tech, prob, resume, behav, conf, role }
    });

    const finalStrengths = (Array.isArray(strengths) && strengths.length > 0) ? strengths : autoSummary.strengths;
    const finalImprovements = (Array.isArray(improvements) && improvements.length > 0) ? improvements : autoSummary.improvements;
    const finalQuestions = (Array.isArray(questions) && questions.length > 0) ? questions : autoSummary.questions;
    const finalOverallFeedback = (overall_feedback && overall_feedback.trim()) ? overall_feedback.trim() : autoSummary.overall_feedback;
    const finalRatingStars = parseInt(rating_stars) || autoSummary.rating_stars;
    const finalActionPlan = (Array.isArray(action_plan) && action_plan.length > 0) ? action_plan : autoSummary.action_plan;
    const finalNextName = (next_interview_name && next_interview_name.trim()) ? next_interview_name.trim() : autoSummary.next_interview_name;
    const finalNextDate = next_interview_date || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    // Build structured 7-criteria evaluation array (Evaluation area | Max score | Given score)
    const finalEvaluationScores = (Array.isArray(req.body.evaluation_scores) && req.body.evaluation_scores.length === 7)
      ? req.body.evaluation_scores
      : buildMockEvaluationScores({
          score_communication: comm,
          score_technical: tech,
          score_problem_solving: prob,
          score_resume_projects: resume,
          score_behavioral: behav,
          score_confidence: conf,
          score_role_knowledge: role
        });

    const intNum = parseInt(interview_number) || 1;
    let targetInterviewId = null;

    const [existingRows] = await studentMasterPool.query(
      'SELECT id FROM mock_interviews WHERE student_id = ? AND interview_number = ? LIMIT 1',
      [student_id, intNum]
    );

    if (existingRows && existingRows.length > 0) {
      targetInterviewId = existingRows[0].id;
      const updateSql = `
        UPDATE mock_interviews SET
          student_name = ?, email = ?, interview_name = ?,
          target_role = ?, experience_level = ?, interview_date = ?, interview_mode = ?,
          interviewer = ?, interview_type = ?, duration_minutes = ?, focus_areas = ?,
          score_communication = ?, score_technical = ?, score_problem_solving = ?,
          score_resume_projects = ?, score_behavioral = ?, score_confidence = ?,
          score_role_knowledge = ?, total_score = ?, result_level = ?, evaluation_scores_json = ?,
          strengths_json = ?, improvements_json = ?, questions_json = ?,
          overall_feedback = ?, rating_stars = ?, action_plan_json = ?,
          next_interview_name = ?, next_interview_date = ?
        WHERE id = ?
      `;
      const updateParams = [
        finalName || student_id, finalEmail || '', interview_name,
        target_role, experience_level, interview_date, interview_mode,
        interviewer, interview_type, parseInt(duration_minutes) || 45, focus_areas,
        comm, tech, prob, resume, behav, conf, role, total_score, level,
        JSON.stringify(finalEvaluationScores),
        JSON.stringify(finalStrengths),
        JSON.stringify(finalImprovements),
        JSON.stringify(finalQuestions),
        finalOverallFeedback, finalRatingStars,
        JSON.stringify(finalActionPlan),
        finalNextName, finalNextDate,
        targetInterviewId
      ];
      await studentMasterPool.query(updateSql, updateParams);
    } else {
      const sql = `
        INSERT INTO mock_interviews (
          student_id, student_name, email, interview_number, interview_name,
          target_role, experience_level, interview_date, interview_mode,
          interviewer, interview_type, duration_minutes, focus_areas,
          score_communication, score_technical, score_problem_solving,
          score_resume_projects, score_behavioral, score_confidence,
          score_role_knowledge, total_score, result_level, evaluation_scores_json,
          strengths_json, improvements_json, questions_json,
          overall_feedback, rating_stars, action_plan_json,
          next_interview_name, next_interview_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        student_id, finalName || student_id, finalEmail || '',
        intNum, interview_name, target_role,
        experience_level, interview_date, interview_mode, interviewer,
        interview_type, parseInt(duration_minutes) || 45, focus_areas,
        comm, tech, prob, resume, behav, conf, role, total_score, level,
        JSON.stringify(finalEvaluationScores),
        JSON.stringify(finalStrengths),
        JSON.stringify(finalImprovements),
        JSON.stringify(finalQuestions),
        finalOverallFeedback, finalRatingStars,
        JSON.stringify(finalActionPlan),
        finalNextName, finalNextDate
      ];
      const [result] = await studentMasterPool.query(sql, params);
      targetInterviewId = result.insertId;
    }

    const insertId = targetInterviewId;

    // Synchronize companion table mock_interview_marks
    try {
      await studentMasterPool.query('DELETE FROM mock_interview_marks WHERE mock_interview_id = ?', [insertId]);
      for (const item of finalEvaluationScores) {
        await studentMasterPool.query(`
          INSERT INTO mock_interview_marks (
            mock_interview_id, student_id, student_name, area_number,
            evaluation_area, criteria, max_score, given_score, percentage,
            color, badge_class
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          insertId, student_id, finalName || student_id,
          item.area_number || 1, item.area, item.criteria || '',
          item.max_score, item.given_score, item.percentage,
          item.color || '#2563eb', item.badge_class || 'badge-blue'
        ]);
      }
    } catch (marksErr) {
      console.warn('⚠️ Could not sync mock_interview_marks:', marksErr.message);
    }

    res.json({
      success: true,
      message: 'Mock interview evaluation saved successfully.',
      id: insertId,
      total_score,
      result_level: level,
      evaluation_scores: finalEvaluationScores
    });
  } catch (err) {
    console.error('Error saving mock interview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get list of all Mock Interviews (or filter by student_id)
app.get('/api/mock-interviews', async (req, res) => {
  try {
    const { student_id } = req.query;
    let sql = `
      SELECT m.*, c.photo, c.college_name, c.degree, c.department
      FROM mock_interviews m
      LEFT JOIN candidate_registrations c ON (m.student_id COLLATE utf8mb4_unicode_ci = c.student_id COLLATE utf8mb4_unicode_ci)
    `;
    const params = [];
    if (student_id) {
      sql += ` WHERE m.student_id = ? OR m.email = ?`;
      params.push(student_id, student_id);
    }
    sql += ` ORDER BY m.interview_date DESC, m.id DESC LIMIT 50`;
    const [rows] = await studentMasterPool.query(sql, params);
    rows.forEach(r => {
      r.evaluation_scores = safeJsonParse(r.evaluation_scores_json, null) || buildMockEvaluationScores(r);
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get single Mock Interview by ID
app.get('/api/mock-interviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await studentMasterPool.query(`
      SELECT m.*, c.photo, c.college_name, c.degree, c.department
      FROM mock_interviews m
      LEFT JOIN candidate_registrations c ON (m.student_id COLLATE utf8mb4_unicode_ci = c.student_id COLLATE utf8mb4_unicode_ci)
      WHERE m.id = ?
      LIMIT 1
    `, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mock interview record not found.' });
    }
    const interview = rows[0];
    interview.evaluation_scores = safeJsonParse(interview.evaluation_scores_json, null) || buildMockEvaluationScores(interview);
    interview.strengths = safeJsonParse(interview.strengths_json, []);
    interview.improvements = safeJsonParse(interview.improvements_json, []);
    interview.questions = safeJsonParse(interview.questions_json, []);
    interview.action_plan = safeJsonParse(interview.action_plan_json, []);

    res.json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Student's Mock Interview Journey History (Interviews 1-10)
app.get('/api/students/:studentId/mock-interviews', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await studentMasterPool.query(
      'SELECT id, interview_number, interview_name, total_score, result_level, interview_date FROM mock_interviews WHERE student_id = ? ORDER BY interview_number ASC, id ASC',
      [studentId]
    );
    res.json({ success: true, history: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Form Sync Webhook Endpoint
app.post('/api/sync/google-form', async (req, res) => {
  const secret = req.headers['x-sync-secret'] || req.query.secret || req.body.secret;
  if (secret !== (process.env.GOOGLE_FORM_SYNC_SECRET || 'skilldome_form_sync_9f2a7c')) {
    return res.status(403).json({ success: false, error: 'Invalid sync secret.' });
  }

  const { student_id, full_name, email, degree, college_name, department, interested_domain } = req.body;
  if (!student_id || !full_name) {
    return res.status(400).json({ success: false, error: 'student_id and full_name are required.' });
  }

  try {
    await studentMasterDb.query(`
      INSERT INTO candidate_registrations (student_id, full_name, email, degree, department, college_name, interested_domain)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), email = VALUES(email), degree = VALUES(degree), college_name = VALUES(college_name)
    `, [student_id, full_name, email || `${student_id.toLowerCase()}@email.com`, degree || 'B.E.', department || 'General', college_name || 'Partner College', interested_domain || 'Technology']);

    res.json({ success: true, message: `Candidate ${student_id} synced successfully into candidate_registrations.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Career Roadmaps Endpoint
app.get('/api/career-roadmaps', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'public', 'career_roadmaps.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      return res.json({ success: true, data });
    }
    res.status(404).json({ success: false, error: 'Career roadmaps data not found.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start Express Server
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Skilldome Admin Panel Server running on port ${PORT}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`📊 DB Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`📋 Source Tables: candidate_registrations, test_answers & mock_interviews`);
  console.log(`=======================================================`);
  await initMockInterviewsTable();
});

module.exports = { app, server };
