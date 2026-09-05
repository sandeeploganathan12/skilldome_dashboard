const mysql = require('mysql2/promise');
require('dotenv').config();

const CRITERIA_DEFINITIONS = [
  {
    num: 1,
    area: 'Communication & Clarity',
    criteria: 'Expressing thoughts clearly, structured articulation',
    max: 15,
    key: 'score_communication',
    color: '#8b5cf6',
    badgeClass: 'badge-purple'
  },
  {
    num: 2,
    area: 'Technical Knowledge',
    criteria: 'Concepts, accuracy, syntax and technical depth',
    max: 20,
    key: 'score_technical',
    color: '#2563eb',
    badgeClass: 'badge-blue'
  },
  {
    num: 3,
    area: 'Problem Solving',
    criteria: 'Approach, logical thinking, edge case handling',
    max: 15,
    key: 'score_problem_solving',
    color: '#16a34a',
    badgeClass: 'badge-green'
  },
  {
    num: 4,
    area: 'Understanding of Resume / Projects',
    criteria: 'Explaining projects, tech stack used, challenges faced',
    max: 15,
    key: 'score_resume_projects',
    color: '#ea580c',
    badgeClass: 'badge-orange'
  },
  {
    num: 5,
    area: 'Behavioral / HR Responses',
    criteria: 'Situational questions, culture fit, attitude, ethics',
    max: 10,
    key: 'score_behavioral',
    color: '#db2777',
    badgeClass: 'badge-pink'
  },
  {
    num: 6,
    area: 'Confidence & Professionalism',
    criteria: 'Demeanor, composure under pressure, professional attitude',
    max: 10,
    key: 'score_confidence',
    color: '#0891b2',
    badgeClass: 'badge-teal'
  },
  {
    num: 7,
    area: 'Role-specific Knowledge',
    criteria: 'Domain standards, tools, industry awareness',
    max: 15,
    key: 'score_role_knowledge',
    color: '#1d4ed8',
    badgeClass: 'badge-navy'
  }
];

function buildEvaluationScores(row) {
  return CRITERIA_DEFINITIONS.map(c => {
    const given = row[c.key] !== undefined && row[c.key] !== null ? Number(row[c.key]) : 0;
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

async function migrateMockEvaluations() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Connecting to database...');

    // 1. Ensure evaluation_scores_json column exists in mock_interviews
    const [cols] = await conn.query('SHOW COLUMNS FROM mock_interviews');
    const hasJsonCol = cols.some(c => c.Field === 'evaluation_scores_json');

    if (!hasJsonCol) {
      console.log('Adding evaluation_scores_json column to mock_interviews...');
      await conn.query('ALTER TABLE mock_interviews ADD COLUMN evaluation_scores_json TEXT NULL AFTER result_level');
      console.log('✅ Added evaluation_scores_json column');
    } else {
      console.log('ℹ️ evaluation_scores_json column already exists');
    }

    // 2. Ensure mock_interview_marks companion table exists
    console.log('Creating mock_interview_marks table if not exists...');
    await conn.query(`
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
    `);
    console.log('✅ Verified mock_interview_marks table');

    // 3. Backfill existing mock interview records
    const [interviews] = await conn.query('SELECT * FROM mock_interviews');
    console.log(`Found ${interviews.length} existing mock interview records to backfill.`);

    for (const interview of interviews) {
      const evaluationScores = buildEvaluationScores(interview);
      const jsonStr = JSON.stringify(evaluationScores);

      // Update mock_interviews table
      await conn.query('UPDATE mock_interviews SET evaluation_scores_json = ? WHERE id = ?', [jsonStr, interview.id]);

      // Refresh mock_interview_marks
      await conn.query('DELETE FROM mock_interview_marks WHERE mock_interview_id = ?', [interview.id]);
      for (const item of evaluationScores) {
        await conn.query(`
          INSERT INTO mock_interview_marks (
            mock_interview_id, student_id, student_name, area_number,
            evaluation_area, criteria, max_score, given_score, percentage,
            color, badge_class
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          interview.id, interview.student_id, interview.student_name || interview.student_id,
          item.area_number, item.area, item.criteria, item.max_score, item.given_score, item.percentage,
          item.color, item.badge_class
        ]);
      }
      console.log(`✅ Backfilled interview ID ${interview.id} for student ${interview.student_id} (${interview.student_name})`);
    }

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await conn.end();
  }
}

migrateMockEvaluations();
