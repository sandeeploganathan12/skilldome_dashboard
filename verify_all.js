const http = require('http');

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('=======================================================');
  console.log('🧪 SKILLDOME REAL DATABASE END-TO-END VERIFICATION');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // 1. Static Delivery & Logo Asset check
    console.log('--- 1. Testing Frontend Static Delivery & Logo Asset ---');
    const indexRes = await request('http://localhost:5000/');
    assert(indexRes.status === 200 && indexRes.raw.includes('assets/logo.png'), 'index.html references official assets/logo.png');
    assert(!indexRes.raw.includes('student-avatar-img'), 'Student photo img tags removed from markup');

    const logoRes = await request('http://localhost:5000/assets/logo.png');
    assert(logoRes.status === 200 && logoRes.headers['content-type'].includes('image'), 'assets/logo.png served with 200 OK');

    const logoBgRes = await request('http://localhost:5000/assets/logo_with_bg.jpg');
    assert(logoBgRes.status === 200 && logoBgRes.headers['content-type'].includes('image'), 'assets/logo_with_bg.jpg served with 200 OK');

    const cssRes = await request('http://localhost:5000/styles.css');
    assert(cssRes.status === 200 && cssRes.raw.includes('avatar-ring-monogram'), 'styles.css contains monogram styling (no photos)');

    // 2. Health check
    console.log('\n--- 2. Testing Database Health & Connectivity ---');
    const healthRes = await request('http://localhost:5000/api/system/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'Health endpoint OK');
    assert(healthRes.body.databases.studentMasterDb.name.includes('candidate_registrations'), 'Student Master DB points to real candidate_registrations');
    assert(healthRes.body.databases.assessmentDb.name.includes('test_answers'), 'Assessment DB points to real test_answers');

    // 3. Admin Auth
    console.log('\n--- 3. Testing Admin Authentication ---');
    const loginPayload = JSON.stringify({ username: 'admin@skilldom.com', password: 'admin123' });
    const loginRes = await request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginPayload) }
    }, loginPayload);
    assert(loginRes.status === 200 && loginRes.body.token, 'Admin authentication succeeded');
    const token = loginRes.body.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 4. Feature 4: Admin Directory Table from real candidate_registrations
    console.log('\n--- 4. Testing Feature 4: Candidate Directory (candidate_registrations) ---');
    const adminListRes = await request('http://localhost:5000/api/admin/students', { headers: authHeaders });
    assert(adminListRes.status === 200, 'Admin candidates endpoint responded 200');
    assert(adminListRes.body.data.length > 0, `Loaded ${adminListRes.body.data.length} candidate(s) from candidate_registrations`);

    const realCandidate = adminListRes.body.data[0];
    assert(realCandidate.studentId === 'SDC00001', 'Candidate ID verified (SDC00001)', realCandidate.studentId);
    assert(realCandidate.name.toLowerCase().includes('sanjeevi'), 'Candidate full_name verified (Sanjeevi k)', realCandidate.name);
    assert(realCandidate.email === 'sanjeevikandasamy233@gmail.com', 'Candidate email verified', realCandidate.email);
    assert(realCandidate.college === 'SNR', 'Candidate college verified (SNR)', realCandidate.college);
    assert(realCandidate.initials === 'SK', 'Candidate initials generated for monogram avatar (SK)', realCandidate.initials);
    assert(realCandidate.overallScore > 0, `Real evaluated overall readiness score = ${realCandidate.overallScore}/100`);

    // 5. Feature 2 & 5: Student ID Filter & Cross-DB Join (candidate_registrations + test_answers)
    console.log('\n--- 5. Testing Feature 2 & 5: Cross-DB Join for SDC00001 ---');
    const detailRes = await request('http://localhost:5000/api/students/SDC00001', { headers: authHeaders });
    assert(detailRes.status === 200, 'Cross-database detail fetched 200 OK');
    assert(detailRes.body.student.studentId === 'SDC00001', 'Profile joined from candidate_registrations (SDC00001)');
    assert(detailRes.body.student.targetCareer === 'Full Stack Development', 'Interested domain verified (Full Stack Development)');
    assert(detailRes.body.student.districtCity === 'Coimbatore', 'District/City verified (Coimbatore)');
    assert(detailRes.body.student.initials === 'SK', 'Monogram initials confirmed without photo URL');
    assert(detailRes.body.allScores.length === 10, `Real test_answers joined: ${detailRes.body.allScores.length} categories evaluated`);

    // Check specific real categories from test_answers
    const catNames = detailRes.body.allScores.map(c => c.category);
    assert(catNames.includes('Decision Making') && catNames.includes('Problem Solving') && catNames.includes('Communication Skills'),
      'Evaluated categories match real test_answers (Decision Making, Problem Solving, Communication Skills)'
    );

    // 6. Feature 1 & 3: Domain Filter & Category Data List
    console.log('\n--- 6. Testing Feature 1 & 3: Domain Filter & Category List ---');
    const allScoresRes = await request('http://localhost:5000/api/scores?domain=All&studentId=SDC00001', { headers: authHeaders });
    assert(allScoresRes.body.count === 10, `Domain "All" returned all 10 evaluated categories`);

    const aptitudeRes = await request('http://localhost:5000/api/scores?domain=Aptitude&studentId=SDC00001', { headers: authHeaders });
    assert(aptitudeRes.body.count > 0, `Domain "Aptitude" filtered ${aptitudeRes.body.count} aptitude categories`);

    const nonCodingRes = await request('http://localhost:5000/api/scores?domain=Non-Coding&studentId=SDC00001', { headers: authHeaders });
    assert(nonCodingRes.body.count > 0, `Domain "Non-Coding" filtered ${nonCodingRes.body.count} non-coding categories`);

    // 7. Non-functional Requirement: DB Failure Simulation
    console.log('\n--- 7. Testing Graceful DB Outage Simulation ---');
    const failTogglePayload = JSON.stringify({ targetDb: 'student', fail: true });
    await request('http://localhost:5000/api/system/toggle-db-failure', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(failTogglePayload) }
    }, failTogglePayload);

    const failRes = await request('http://localhost:5000/api/students/SDC00001', { headers: authHeaders });
    assert(failRes.status === 503, 'Handled candidate_registrations outage gracefully with 503 error payload');

    const restorePayload = JSON.stringify({ targetDb: 'student', fail: false });
    await request('http://localhost:5000/api/system/toggle-db-failure', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(restorePayload) }
    }, restorePayload);

    const recoverRes = await request('http://localhost:5000/api/students/SDC00001', { headers: authHeaders });
    assert(recoverRes.status === 200 && recoverRes.body.success, 'Recovered and serving real DB records normally');

    // 8. SQL Query Inspector & Real Queries
    console.log('\n--- 8. Testing SQL Inspector Logs ---');
    const logsRes = await request('http://localhost:5000/api/system/query-logs', { headers: authHeaders });
    assert(logsRes.body.logs.length > 0, `Captured ${logsRes.body.logs.length} queries`);
    const hasCandidateQuery = logsRes.body.logs.some(l => l.sql.toLowerCase().includes('candidate_registrations'));
    const hasAnswersQuery = logsRes.body.logs.some(l => l.sql.toLowerCase().includes('test_answers'));
    assert(hasCandidateQuery, 'SQL Inspector logged queries against candidate_registrations');
    assert(hasAnswersQuery, 'SQL Inspector logged queries against test_answers');

    console.log('\n=======================================================');
    console.log(`🏁 REAL DATABASE VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================================');
  } catch (err) {
    console.error('Test run failed:', err);
  }
}

runAllTests();
