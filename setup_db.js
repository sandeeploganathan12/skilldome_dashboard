require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  console.log('Connecting to MySQL database...');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected! Creating tables if they do not exist...');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS students (
      StudentID VARCHAR(50) PRIMARY KEY,
      Name VARCHAR(150) NOT NULL,
      Email VARCHAR(255) NOT NULL,
      Degree VARCHAR(150),
      College VARCHAR(255),
      GraduationYear INT,
      TargetCareer VARCHAR(150),
      PhotoURL TEXT,
      Status VARCHAR(50) DEFAULT 'Active',
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS assessment_scores (
      ScoreID INT PRIMARY KEY AUTO_INCREMENT,
      StudentID VARCHAR(50) NOT NULL,
      Category VARCHAR(100) NOT NULL,
      Domain VARCHAR(50) NOT NULL,
      Score DECIMAL(5,2) NOT NULL,
      AssessmentDate DATE NOT NULL,
      INDEX idx_student (StudentID),
      INDEX idx_domain (Domain),
      INDEX idx_category (Category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('Tables created / verified.');

  // Check if Dinesh Kumar exists
  const [existingDinesh] = await conn.query("SELECT * FROM students WHERE StudentID = 'STU-1001'");
  if (existingDinesh.length === 0) {
    console.log('Seeding Dinesh Kumar (from reference scorecard)...');
    await conn.query(`
      INSERT INTO students (StudentID, Name, Email, Degree, College, GraduationYear, TargetCareer, PhotoURL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'STU-1001',
      'Dinesh Kumar',
      'dinesh.kumar@email.com',
      'B.E. Computer Science and Engineering',
      'ABC Engineering College',
      2026,
      'Python Developer',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    ]);

    // Dinesh scores from reference scorecard:
    // Technical Knowledge: 72 (Coding)
    // Problem Solving: 68 (Coding)
    // Logical Reasoning: 74 (Aptitude)
    // Aptitude: 63 (Aptitude)
    // Communication: 55 (Non-Coding)
    // Career Awareness: 58 (Non-Coding)
    // Professional Readiness: 61 (Non-Coding)
    const dineshScores = [
      { category: 'Technical Knowledge', domain: 'Coding', score: 72 },
      { category: 'Problem Solving', domain: 'Coding', score: 68 },
      { category: 'Logical Reasoning', domain: 'Aptitude', score: 74 },
      { category: 'Aptitude', domain: 'Aptitude', score: 63 },
      { category: 'Communication', domain: 'Non-Coding', score: 55 },
      { category: 'Career Awareness', domain: 'Non-Coding', score: 58 },
      { category: 'Professional Readiness', domain: 'Non-Coding', score: 61 }
    ];

    for (const sc of dineshScores) {
      await conn.query(`
        INSERT INTO assessment_scores (StudentID, Category, Domain, Score, AssessmentDate)
        VALUES (?, ?, ?, ?, '2026-09-02')
      `, ['STU-1001', sc.category, sc.domain, sc.score]);
    }
  }

  // Also sync candidate Sanjeevi k if exists
  const [existingSanjeevi] = await conn.query("SELECT * FROM students WHERE StudentID = 'SDC00001'");
  if (existingSanjeevi.length === 0) {
    console.log('Seeding Sanjeevi k (from candidate registrations)...');
    await conn.query(`
      INSERT INTO students (StudentID, Name, Email, Degree, College, GraduationYear, TargetCareer, PhotoURL)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'SDC00001',
      'Sanjeevi k',
      'sanjeevikandasamy233@gmail.com',
      'B.Com General Commerce',
      'SNR College',
      2026,
      'Full Stack Development',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
    ]);

    const sanjeeviScores = [
      { category: 'Technical Knowledge', domain: 'Coding', score: 65 },
      { category: 'Problem Solving', domain: 'Coding', score: 70 },
      { category: 'Logical Reasoning', domain: 'Aptitude', score: 68 },
      { category: 'Aptitude', domain: 'Aptitude', score: 64 },
      { category: 'Communication', domain: 'Non-Coding', score: 72 },
      { category: 'Career Awareness', domain: 'Non-Coding', score: 60 },
      { category: 'Professional Readiness', domain: 'Non-Coding', score: 66 }
    ];

    for (const sc of sanjeeviScores) {
      await conn.query(`
        INSERT INTO assessment_scores (StudentID, Category, Domain, Score, AssessmentDate)
        VALUES (?, ?, ?, ?, '2026-09-01')
      `, ['SDC00001', sc.category, sc.domain, sc.score]);
    }
  }

  // Additional realistic students for admin pagination and scanning
  const additionalStudents = [
    {
      id: 'STU-1002',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@email.com',
      degree: 'B.Tech Information Technology',
      college: 'PSG College of Technology',
      year: 2026,
      career: 'Cloud Architect',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-02',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 88 },
        { category: 'Problem Solving', domain: 'Coding', score: 85 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 82 },
        { category: 'Aptitude', domain: 'Aptitude', score: 79 },
        { category: 'Communication', domain: 'Non-Coding', score: 80 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 84 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 86 }
      ]
    },
    {
      id: 'STU-1003',
      name: 'Rahul Varma',
      email: 'rahul.varma@email.com',
      degree: 'B.E. Electronics & Communication',
      college: 'Vellore Institute of Technology',
      year: 2027,
      career: 'Embedded Systems Engineer',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-01',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 58 },
        { category: 'Problem Solving', domain: 'Coding', score: 52 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 62 },
        { category: 'Aptitude', domain: 'Aptitude', score: 59 },
        { category: 'Communication', domain: 'Non-Coding', score: 48 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 50 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 55 }
      ]
    },
    {
      id: 'STU-1004',
      name: 'Pooja Hegde',
      email: 'pooja.h@email.com',
      degree: 'B.Sc Data Science & AI',
      college: 'Loyola College',
      year: 2026,
      career: 'Machine Learning Engineer',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-03',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 94 },
        { category: 'Problem Solving', domain: 'Coding', score: 91 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 92 },
        { category: 'Aptitude', domain: 'Aptitude', score: 89 },
        { category: 'Communication', domain: 'Non-Coding', score: 90 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 93 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 92 }
      ]
    },
    {
      id: 'STU-1005',
      name: 'Karthik Raja',
      email: 'karthik.raja@email.com',
      degree: 'B.E. Mechanical Engineering',
      college: 'Coimbatore Institute of Technology',
      year: 2026,
      career: 'Operations Analyst',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
      date: '2026-08-30',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 35 },
        { category: 'Problem Solving', domain: 'Coding', score: 40 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 45 },
        { category: 'Aptitude', domain: 'Aptitude', score: 42 },
        { category: 'Communication', domain: 'Non-Coding', score: 38 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 34 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 36 }
      ]
    },
    {
      id: 'STU-1006',
      name: 'Meera Nambiar',
      email: 'meera.n@email.com',
      degree: 'B.Tech Artificial Intelligence',
      college: 'Amrita Vishwa Vidyapeetham',
      year: 2026,
      career: 'Data Analyst',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-02',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 76 },
        { category: 'Problem Solving', domain: 'Coding', score: 72 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 75 },
        { category: 'Aptitude', domain: 'Aptitude', score: 70 },
        { category: 'Communication', domain: 'Non-Coding', score: 68 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 71 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 73 }
      ]
    },
    {
      id: 'STU-1007',
      name: 'Aditya Sen',
      email: 'aditya.sen@email.com',
      degree: 'B.E. Computer Science',
      college: 'SRM Institute of Science',
      year: 2027,
      career: 'Full Stack Engineer',
      photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-02',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 81 },
        { category: 'Problem Solving', domain: 'Coding', score: 78 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 80 },
        { category: 'Aptitude', domain: 'Aptitude', score: 75 },
        { category: 'Communication', domain: 'Non-Coding', score: 77 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 79 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 82 }
      ]
    },
    {
      id: 'STU-1008',
      name: 'Sneha Patel',
      email: 'sneha.patel@email.com',
      degree: 'B.Tech Information Science',
      college: 'Kumaraguru College of Technology',
      year: 2026,
      career: 'Frontend Architect',
      photo: 'https://images.unsplash.com/photo-1534751516642-a171ed2820d0?w=200&auto=format&fit=crop&q=80',
      date: '2026-09-01',
      scores: [
        { category: 'Technical Knowledge', domain: 'Coding', score: 66 },
        { category: 'Problem Solving', domain: 'Coding', score: 64 },
        { category: 'Logical Reasoning', domain: 'Aptitude', score: 71 },
        { category: 'Aptitude', domain: 'Aptitude', score: 68 },
        { category: 'Communication', domain: 'Non-Coding', score: 65 },
        { category: 'Career Awareness', domain: 'Non-Coding', score: 62 },
        { category: 'Professional Readiness', domain: 'Non-Coding', score: 67 }
      ]
    }
  ];

  for (const stu of additionalStudents) {
    const [exists] = await conn.query('SELECT * FROM students WHERE StudentID = ?', [stu.id]);
    if (exists.length === 0) {
      await conn.query(`
        INSERT INTO students (StudentID, Name, Email, Degree, College, GraduationYear, TargetCareer, PhotoURL)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [stu.id, stu.name, stu.email, stu.degree, stu.college, stu.year, stu.career, stu.photo]);

      for (const sc of stu.scores) {
        await conn.query(`
          INSERT INTO assessment_scores (StudentID, Category, Domain, Score, AssessmentDate)
          VALUES (?, ?, ?, ?, ?)
        `, [stu.id, sc.category, sc.domain, sc.score, stu.date]);
      }
    }
  }

  const [totalStudents] = await conn.query('SELECT COUNT(*) as count FROM students');
  const [totalScores] = await conn.query('SELECT COUNT(*) as count FROM assessment_scores');
  console.log(`Database ready! Total Students: ${totalStudents[0].count}, Total Scores: ${totalScores[0].count}`);

  await conn.end();
}

setupDatabase().catch(err => {
  console.error('Setup failed:', err);
});
