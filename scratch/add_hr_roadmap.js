const fs = require('fs');
const path = require('path');

const roadmapPath = path.join(__dirname, '../public/career_roadmaps.json');
const currentData = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));

const hrRoadmap = {
  domainKey: "Human Resources",
  title: "HUMAN RESOURCES CAREER PATH",
  subtitle: "Your 10–15 Year Career Journey",
  tableHeader: "HUMAN RESOURCES & RECRUITER CAREER PROGRESSION TIMELINE",
  defaultTargetCareer: "Recruiter",
  timeline: [
    {
      stageNum: 1,
      stageName: "STARTING POINT",
      experience: "0–1 Year",
      designation: "HR Trainee / Recruiter Intern",
      focusAreas: [
        "HR Fundamentals & Recruitment Basics",
        "Candidate Sourcing & Job Portal Screening",
        "Interview Coordination & Communication",
        "Employee Records & HR Documentation",
        "MS Excel & Basic HRMS Systems"
      ],
      package: "₹3 – ₹5 LPA",
      potentialNextStep: "Become an HR Executive / Technical Recruiter"
    },
    {
      stageNum: 2,
      stageName: "FOUNDATION BUILDER",
      experience: "1–2 Years",
      designation: "HR Executive / Recruiter",
      focusAreas: [
        "End-to-End Talent Acquisition & Screening",
        "Candidate Pipeline Management",
        "New Hire Onboarding & Induction",
        "HR Documentation & Attendance Tracking",
        "Employee Query Resolution & Coordination"
      ],
      package: "₹4 – ₹7 LPA",
      potentialNextStep: "Grow into Senior HR Executive / Talent Specialist"
    },
    {
      stageNum: 3,
      stageName: "GROWTH PHASE",
      experience: "2–4 Years",
      designation: "Senior HR Executive / Talent Acquisition Specialist",
      focusAreas: [
        "Full Lifecycle Recruitment & Strategic Sourcing",
        "Employee Relations & Engagement Initiatives",
        "Performance Management & KPI Tracking",
        "HR Operations & Policy Implementation",
        "Hiring Manager Stakeholder Collaboration"
      ],
      package: "₹6 – ₹10 LPA",
      potentialNextStep: "Advance to Assistant HR Manager / Lead Recruiter"
    },
    {
      stageNum: 4,
      stageName: "ADVANCED PHASE",
      experience: "4–6 Years",
      designation: "Assistant HR Manager / Lead Recruiter",
      focusAreas: [
        "Strategic Talent Acquisition & Pipeline Forecasting",
        "Employee Retention & Workplace Conflict Management",
        "Statutory Compliance & Labor Law Governance",
        "HR Analytics, Recruitment Metrics & MIS Reporting",
        "Employer Branding & Campus Recruitment Drives"
      ],
      package: "₹9 – ₹15 LPA",
      potentialNextStep: "Step up to Human Resources Manager"
    },
    {
      stageNum: 5,
      stageName: "LEADERSHIP PHASE",
      experience: "6–9 Years",
      designation: "Human Resources Manager / Talent Acquisition Head",
      focusAreas: [
        "Organization-Wide HR Strategy & Workforce Planning",
        "Leading Multi-Member HR & Recruitment Pods",
        "Performance Review Frameworks & Appraisals",
        "Compensation & Benefits (C&B) Structuring",
        "Statutory Audits & Employee Wellness Programs"
      ],
      package: "₹15 – ₹24 LPA",
      potentialNextStep: "Advance to Senior HR Manager / Head of HR"
    },
    {
      stageNum: 6,
      stageName: "EXPERT PHASE",
      experience: "9–12 Years",
      designation: "Senior HR Manager / Head of Human Resources",
      focusAreas: [
        "Strategic Workforce Planning & Succession Planning",
        "Organizational Development (OD) & Culture Building",
        "Leadership Capability Development & Coaching",
        "Executive Search & Senior Stakeholder Alignment",
        "Enterprise HR Digital Transformation & Tech Stack"
      ],
      package: "₹22 – ₹35+ LPA",
      potentialNextStep: "Advance to Director – Human Resources"
    },
    {
      stageNum: 7,
      stageName: "STRATEGIC PHASE",
      experience: "12–15 Years+",
      designation: "Director – Human Resources / Chief Human Resources Officer (CHRO)",
      focusAreas: [
        "Enterprise People Strategy & Global Organizational Design",
        "C-Suite Leadership Advisory & Culture Transformation",
        "Executive Compensation, ESOPs & Board Governance",
        "Mergers & Acquisitions (M&A) People Integration",
        "Future of Work & Global Talent Innovation"
      ],
      package: "₹35 – ₹65+ LPA",
      potentialNextStep: "Chief Human Resources Officer (CHRO) / Board Director"
    }
  ],
  skills: [
    { name: "Talent Acquisition & Sourcing", icon: "🔍" },
    { name: "Candidate Screening & Interviewing", icon: "🗣️" },
    { name: "HRMS & HRIS Software", icon: "💻" },
    { name: "Employee Relations & Engagement", icon: "🤝" },
    { name: "Labor Law & Statutory Compliance", icon: "⚖️" },
    { name: "Performance Appraisal & KPIs", icon: "📈" },
    { name: "Onboarding & Induction Planning", icon: "📋" },
    { name: "HR Analytics & Metrics Reporting", icon: "📊" },
    { name: "Compensation & Benefits Strategy", icon: "💰" },
    { name: "Organizational Leadership & Culture", icon: "👑" }
  ]
};

currentData.roadmaps["Human Resources"] = hrRoadmap;

// Add comprehensive aliases for Human Resources & Recruiter
const hrAliases = {
  "human resources": "Human Resources",
  "human resource": "Human Resources",
  "human resources (hr)": "Human Resources",
  "hr": "Human Resources",
  "recruiter": "Human Resources",
  "recruitment": "Human Resources",
  "talent acquisition": "Human Resources",
  "hr recruiter": "Human Resources",
  "hr executive": "Human Resources",
  "hr trainee": "Human Resources",
  "hr specialist": "Human Resources",
  "hr manager": "Human Resources",
  "hr generalist": "Human Resources"
};

Object.assign(currentData.domainAliases, hrAliases);
currentData.generatedAt = new Date().toISOString();

fs.writeFileSync(roadmapPath, JSON.stringify(currentData, null, 2), 'utf8');
console.log('✅ Successfully added Human Resources roadmap to public/career_roadmaps.json');
console.log('Total roadmaps:', Object.keys(currentData.roadmaps));
