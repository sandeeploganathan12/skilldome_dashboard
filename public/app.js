/**
 * SKILLDOME Admin Operations & Career Readiness Scorecard
 * Real Database Controller & State Management
 * Tables: candidate_registrations & test_answers
 */

// ============================================================================
// State Management
// ============================================================================
const state = {
  authToken: localStorage.getItem('skilldom_admin_token') || null,
  currentView: 'overview', // 'overview' or 'scorecard'
  selectedStudentId: '', // loaded from candidate_registrations
  selectedDomain: 'All', // 'All', 'Coding', 'Non-Coding', 'Aptitude'
  studentsList: [],
  allStudentsMaster: [],
  currentStudentData: null,
  categoryScoresData: [],
  
  // Admin Table State
  adminTable: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    search: '',
    sortBy: 'overallScore',
    sortOrder: 'desc',
    items: []
  },

  // Category List Sorting
  categorySort: {
    column: 'score',
    order: 'desc'
  },

  // System status
  isStudentDbOffline: false,
  isAssessmentDbOffline: false,
  lastFailedAction: null,
  isLoading: false
};

// ============================================================================
// API Helper with Error Boundary & Auth Injection
// ============================================================================
async function apiRequest(endpoint, optionsOrMethod = {}, maybePayload = null) {
  showLoading(true);
  try {
    let options = {};
    if (typeof optionsOrMethod === 'string') {
      options = {
        method: optionsOrMethod,
        body: maybePayload ? JSON.stringify(maybePayload) : undefined
      };
    } else {
      options = optionsOrMethod || {};
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (state.authToken) {
      headers['Authorization'] = `Bearer ${state.authToken}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (res.status === 401) {
      handleLogout();
      throw new Error('Session expired or unauthorized. Please log in.');
    }

    const data = await res.json();

    if (!res.ok || data.success === false) {
      const errMessage = data.error || `Server responded with status ${res.status}`;
      displayErrorBanner(data.source ? `${data.source} Error` : 'Database Connection Error', errMessage);
      throw new Error(errMessage);
    }

    dismissErrorBanner();
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  } finally {
    showLoading(false);
  }
}

function showLoading(show) {
  state.isLoading = show;
  const bar = document.getElementById('globalLoadingBar');
  if (bar) {
    if (show) bar.classList.remove('hidden');
    else bar.classList.add('hidden');
  }
}

function displayErrorBanner(title, message) {
  const banner = document.getElementById('globalErrorBanner');
  const titleEl = document.getElementById('errorBannerTitle');
  const msgEl = document.getElementById('errorBannerMessage');

  if (banner && titleEl && msgEl) {
    titleEl.textContent = title;
    msgEl.textContent = message;
    banner.classList.remove('hidden');
  }
}

function dismissErrorBanner() {
  const banner = document.getElementById('globalErrorBanner');
  if (banner) banner.classList.add('hidden');
}

function retryFailedQuery() {
  dismissErrorBanner();
  if (state.currentView === 'overview') {
    fetchAdminStudents();
  } else {
    fetchStudentDetails(state.selectedStudentId);
  }
  checkDbHealth();
}

// ============================================================================
// Authentication Flow (Executive Portal Login)
// ============================================================================
function togglePasswordVisibility() {
  const pwInput = document.getElementById('adminPassword');
  const eyeIcon = document.getElementById('pwEyeIcon');
  if (!pwInput) return;
  if (pwInput.type === 'password') {
    pwInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
    }
  } else {
    pwInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    }
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

async function handleLogin(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('adminEmail');
  const pwInput = document.getElementById('adminPassword');
  const email = (emailInput ? emailInput.value : '').trim();
  const password = (pwInput ? pwInput.value : '').trim();
  const errorMsg = document.getElementById('authErrorMsg');
  const loginBtn = document.getElementById('loginBtn');
  const btnText = document.getElementById('loginBtnText');

  if (!email || !password) {
    if (errorMsg) {
      errorMsg.textContent = 'Please enter both your admin username and password.';
      errorMsg.classList.remove('hidden', 'shake-anim');
      void errorMsg.offsetWidth;
      errorMsg.classList.add('shake-anim');
    }
    return;
  }

  if (errorMsg) errorMsg.classList.add('hidden');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.classList.add('btn-loading');
  }
  if (btnText) btnText.textContent = 'Verifying Credentials...';
  showLoading(true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      if (errorMsg) {
        errorMsg.textContent = data.error || 'Invalid admin credentials. Please try again.';
        errorMsg.classList.remove('hidden', 'shake-anim');
        void errorMsg.offsetWidth;
        errorMsg.classList.add('shake-anim');
      }
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
      }
      if (btnText) btnText.textContent = 'Sign In to Dashboard';
      return;
    }

    if (btnText) btnText.textContent = 'Welcome! Opening Portal...';

    state.authToken = data.token;
    localStorage.setItem('skilldom_admin_token', data.token);

    setTimeout(() => {
      document.getElementById('authScreen').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
      }
      if (btnText) btnText.textContent = 'Sign In to Dashboard';
      initializeApp();
    }, 450);

  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = 'Server connection failed. Ensure backend server is running.';
      errorMsg.classList.remove('hidden', 'shake-anim');
      void errorMsg.offsetWidth;
      errorMsg.classList.add('shake-anim');
    }
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.classList.remove('btn-loading');
    }
    if (btnText) btnText.textContent = 'Sign In to Dashboard';
  } finally {
    showLoading(false);
  }
}

function handleLogout() {
  if (state.authToken) {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    }).catch(() => {});
  }
  state.authToken = null;
  localStorage.removeItem('skilldom_admin_token');

  // Clear inputs and reset auth UI
  const emailInput = document.getElementById('adminEmail');
  const pwInput = document.getElementById('adminPassword');
  const errorMsg = document.getElementById('authErrorMsg');
  const btnText = document.getElementById('loginBtnText');
  if (emailInput) emailInput.value = '';
  if (pwInput) pwInput.value = '';
  if (errorMsg) errorMsg.classList.add('hidden');
  if (btnText) btnText.textContent = 'Sign In to Dashboard';

  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

async function checkAuthSession() {
  if (!state.authToken) {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    return false;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    if (res.ok) {
      document.getElementById('authScreen').classList.add('hidden');
      document.getElementById('mainApp').classList.remove('hidden');
      initializeApp();
      return true;
    } else {
      handleLogout();
      return false;
    }
  } catch (err) {
    handleLogout();
    return false;
  }
}

// ============================================================================
// Application Initialization
// ============================================================================
async function initializeApp() {
  await checkDbHealth();
  await fetchDomainCounts();
  await loadStudentsListDropdown();
  await fetchAdminStudents();

  // Always land on the Welcome Admin Portal Home Page
  showPortalHome();
}

// ============================================================================
// 2-Tier Portal Hub Navigation Controllers
// ============================================================================

// 1. Welcome Admin Home Page (2 Main Tiles: Assessment & Mock Interview)
function showPortalHome() {
  state.currentSection = 'portalHome';
  state.currentView = 'portalHome';

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  const homeView = document.getElementById('viewPortalHome');
  if (homeView) {
    homeView.classList.remove('hidden');
    homeView.classList.add('active-view');
  }

  // Header controls
  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.add('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.add('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.add('hidden');

  const filterToolbar = document.getElementById('assessmentFilterToolbar');
  if (filterToolbar) filterToolbar.classList.add('hidden');
}

// 2. Assessment Module (Completely Isolated - Zero Mock Interview items!)
function openAssessmentModule(targetView = 'overview') {
  state.currentSection = 'assessment';
  state.currentView = targetView;

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  // Header controls
  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.remove('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.remove('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.add('hidden');

  const tabOverview = document.getElementById('tabOverview');
  const tabScorecard = document.getElementById('tabScorecard');
  const viewOverview = document.getElementById('viewOverview');
  const viewScorecard = document.getElementById('viewScorecard');
  const filterToolbar = document.getElementById('assessmentFilterToolbar');

  [tabOverview, tabScorecard].forEach(t => t && t.classList.remove('active'));

  if (targetView === 'overview') {
    if (tabOverview) tabOverview.classList.add('active');
    if (viewOverview) {
      viewOverview.classList.remove('hidden');
      viewOverview.classList.add('active-view');
    }
    if (filterToolbar) filterToolbar.classList.remove('hidden');
    fetchAdminStudents();
  } else {
    if (tabScorecard) tabScorecard.classList.add('active');
    if (viewScorecard) {
      viewScorecard.classList.remove('hidden');
      viewScorecard.classList.add('active-view');
    }
    if (filterToolbar) filterToolbar.classList.add('hidden');
    const studentId = state.selectedStudentId || (state.allStudentsMaster[0] ? state.allStudentsMaster[0].studentId : '');
    if (studentId) fetchStudentDetails(studentId);
  }
}

// 3. Mock Interview Sub-Hub (2 Sub-Tiles: Evaluation Form & Scorecard Dashboard)
function openMockInterviewHub() {
  state.currentSection = 'mockHub';
  state.currentView = 'mockHub';

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  const hubView = document.getElementById('viewMockHub');
  if (hubView) {
    hubView.classList.remove('hidden');
    hubView.classList.add('active-view');
  }

  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.remove('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.add('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.add('hidden');

  const filterToolbar = document.getElementById('assessmentFilterToolbar');
  if (filterToolbar) filterToolbar.classList.add('hidden');
}

// 4. Dedicated Evaluation Input Form View (Student ID Dropdown + 7 Evaluation Areas)
async function openMockInputForm(preSelectStudentId) {
  state.currentSection = 'mockInput';
  state.currentView = 'mockInput';

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  const inputView = document.getElementById('viewMockInputForm');
  if (inputView) {
    inputView.classList.remove('hidden');
    inputView.classList.add('active-view');
  }

  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.remove('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.add('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.remove('hidden');

  const tabMockInput = document.getElementById('tabMockInput');
  const tabMockDashboard = document.getElementById('tabMockDashboard');
  if (tabMockInput) tabMockInput.classList.add('active');
  if (tabMockDashboard) tabMockDashboard.classList.remove('active');

  const filterToolbar = document.getElementById('assessmentFilterToolbar');
  if (filterToolbar) filterToolbar.classList.add('hidden');

  await loadMockInputFormCandidates(preSelectStudentId);
  calcFormMockTotal();
}

// 5. Mock Interview Scorecard Dashboard (Blueprint Layout with Monogram Avatar & A4 Print)
async function openMockScorecardDashboard(studentId, targetSessionId) {
  state.currentSection = 'mockDashboard';
  state.currentView = 'mockInterview';

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  const dashView = document.getElementById('viewMockInterview');
  if (dashView) {
    dashView.classList.remove('hidden');
    dashView.classList.add('active-view');
  }

  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.remove('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.add('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.remove('hidden');

  const tabMockInput = document.getElementById('tabMockInput');
  const tabMockDashboard = document.getElementById('tabMockDashboard');
  if (tabMockInput) tabMockInput.classList.remove('active');
  if (tabMockDashboard) tabMockDashboard.classList.add('active');

  const filterToolbar = document.getElementById('assessmentFilterToolbar');
  if (filterToolbar) filterToolbar.classList.add('hidden');

  if (studentId) state.selectedMockStudentId = studentId;
  await loadMockInterviewView(targetSessionId);
}

// Universal Router
function switchView(viewName) {
  if (viewName === 'portalHome') showPortalHome();
  else if (viewName === 'overview') openAssessmentModule('overview');
  else if (viewName === 'scorecard') openAssessmentModule('scorecard');
  else if (viewName === 'mockHub') openMockInterviewHub();
  else if (viewName === 'mockInput') openMockInputForm();
  else if (viewName === 'mockInterview') openMockScorecardDashboard();
  else if (viewName === 'careerRoadmap') openCareerRoadmap();
}

// ============================================================================
// Feature 1: Domain Filter Logic
// Options: All, Coding, Non-Coding, Aptitude
// Filters the Category/Domain column in test_answers
// ============================================================================
async function setDomainFilter(domain) {
  state.selectedDomain = domain;

  document.querySelectorAll('.domain-pill').forEach(btn => {
    if (btn.getAttribute('data-domain') === domain) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (state.currentView === 'overview') {
    state.adminTable.page = 1;
    await fetchAdminStudents();
  } else {
    if (state.selectedStudentId) {
      await fetchStudentDetails(state.selectedStudentId);
    }
  }

  updateActiveFilterTags();
}

async function fetchDomainCounts() {
  try {
    const res = await apiRequest('/api/domains');
    if (res && res.domains) {
      let totalCats = 0;
      let codingCount = 0;
      let nonCodingCount = 0;
      let aptitudeCount = 0;

      res.domains.forEach(d => {
        totalCats += d.categoryCount;
        if (d.domain === 'Coding') codingCount = d.categoryCount;
        if (d.domain === 'Non-Coding') nonCodingCount = d.categoryCount;
        if (d.domain === 'Aptitude') aptitudeCount = d.categoryCount;
      });

      document.getElementById('countAll').textContent = totalCats;
      document.getElementById('countCoding').textContent = codingCount;
      document.getElementById('countNonCoding').textContent = nonCodingCount;
      document.getElementById('countAptitude').textContent = aptitudeCount;
      document.getElementById('kpiTotalCategories').textContent = `${totalCats} Areas`;
    }
  } catch (err) {
    console.warn('Could not load domain stats:', err);
  }
}

// ============================================================================
// Feature 2: Candidate ID Searchable Dropdown
// Loaded from candidate_registrations (NO PHOTOS)
// ============================================================================
async function loadStudentsListDropdown() {
  try {
    const res = await apiRequest('/api/students-list');
    if (res && res.data) {
      state.allStudentsMaster = res.data;
      renderStudentDropdown(res.data);
    }
  } catch (err) {
    console.warn('Could not load student selector list:', err);
  }
}

function handleStudentSearchInput(query) {
  const q = query.trim().toLowerCase();
  const dropdown = document.getElementById('studentDropdownList');
  const clearBtn = document.getElementById('clearStudentBtn');

  if (q.length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }

  const filtered = state.allStudentsMaster.filter(s =>
    s.studentId.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    (s.degree && s.degree.toLowerCase().includes(q))
  );

  renderStudentDropdown(filtered);
  dropdown.classList.remove('hidden');
}

// ============================================================================
// Candidate Profile Photo Normalizer & Avatar Display Helpers
// ============================================================================
function normalizePhotoUrl(photo) {
  if (!photo || typeof photo !== 'string') return null;
  const trimmed = photo.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
    return trimmed;
  }
  if (trimmed.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (trimmed.startsWith('iVBORw')) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed.substring(0, 100))) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return trimmed;
}

function updateAvatarDisplay(imgId, initialsId, photo, initials) {
  const img = document.getElementById(imgId);
  const span = document.getElementById(initialsId);
  if (img) {
    img.style.display = 'none';
    img.removeAttribute('src');
  }
  if (span) {
    span.style.display = 'flex';
    span.textContent = initials || 'SK';
  }
}

function renderStudentDropdown(list) {
  const container = document.getElementById('studentDropdownList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px 14px; color: #94a3b8; font-size: 0.8rem; text-align: center;">
        No registered candidates found in candidate_registrations
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(s => {
    const normPhoto = normalizePhotoUrl(s.photo);
    const avatarHtml = normPhoto
      ? `<img src="${normPhoto}" class="dropdown-monogram" style="object-fit: cover; border-radius: 50%;" alt="${s.name}" onerror="this.outerHTML='<div class=\\'dropdown-monogram\\'>${s.initials || 'SK'}</div>'" />`
      : `<div class="dropdown-monogram">${s.initials || 'SK'}</div>`;

    return `
      <div class="dropdown-item ${s.studentId === state.selectedStudentId ? 'selected' : ''}" onclick="selectStudent('${s.studentId}')">
        ${avatarHtml}
        <div class="dropdown-info">
          <div class="dropdown-name-row">
            <span class="dropdown-name">${s.name}</span>
            <span class="dropdown-id-badge">${s.studentId}</span>
          </div>
          <span class="dropdown-meta">${s.degree || 'Degree'} • ${s.college || 'College'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function showStudentDropdown() {
  const dropdown = document.getElementById('studentDropdownList');
  if (dropdown) dropdown.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.student-select-wrapper');
  const dropdown = document.getElementById('studentDropdownList');
  if (wrapper && !wrapper.contains(e.target) && dropdown) {
    dropdown.classList.add('hidden');
  }
});

async function selectStudent(studentId) {
  state.selectedStudentId = studentId;

  const input = document.getElementById('studentSearchInput');
  const clearBtn = document.getElementById('clearStudentBtn');
  const dropdown = document.getElementById('studentDropdownList');

  const studentObj = state.allStudentsMaster.find(s => s.studentId === studentId);
  if (studentObj && input) {
    input.value = `${studentObj.studentId} — ${studentObj.name}`;
  } else if (input) {
    input.value = studentId;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');
  if (dropdown) dropdown.classList.add('hidden');

  await fetchStudentDetails(studentId);
  switchView('scorecard');
}

function clearSelectedStudent() {
  state.selectedStudentId = '';
  const input = document.getElementById('studentSearchInput');
  const clearBtn = document.getElementById('clearStudentBtn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');

  switchView('overview');
}

// ============================================================================
// Feature 2 & 5: Fetch Student Details & Cross-Database Join
// candidate_registrations (Profile) + test_answers (Scores)
// Merged in application layer
// ============================================================================
async function fetchStudentDetails(studentId) {
  if (!studentId && state.allStudentsMaster.length > 0) {
    studentId = state.allStudentsMaster[0].studentId;
    state.selectedStudentId = studentId;
  }
  if (!studentId) return;

  try {
    const url = `/api/students/${encodeURIComponent(studentId)}?domain=${encodeURIComponent(state.selectedDomain)}`;
    const res = await apiRequest(url);

    if (res && res.success) {
      state.currentStudentData = res;
      renderCareerScorecard(res);
      renderAptitudeTestBars(res.allScores);
      renderTechnicalTestBars(res.allScores, res.student);
      const aptitudeForRadar = (res.allScores || []).filter(sc => sc.domain && sc.domain.toLowerCase() === 'aptitude');
      renderSkillProfileRadar(aptitudeForRadar.length > 0 ? aptitudeForRadar : res.allScores);
      renderRecommendedCareerDomains(res.allScores, res.student);
      renderCategoryScoresTable(res.filteredScores);
    }
  } catch (err) {
    console.error('Failed to load candidate details:', err);
  }
}

// ============================================================================
// Render Career Readiness Scorecard (Matching Image 3 Blueprint)
// ============================================================================
function renderCareerScorecard(data) {
  const { student, readiness, allScores } = data;

  // Sidebar Avatar (Candidate Monogram Initials Badge)
  const candidateInitials = student.initials || getInitials(student.name) || 'SK';
  updateAvatarDisplay('cardStudentPhoto', 'cardStudentInitials', null, candidateInitials);
  const initialsEl = document.getElementById('cardStudentInitials');
  if (initialsEl) initialsEl.textContent = candidateInitials;

  const nameEl = document.getElementById('cardStudentName');
  if (nameEl) nameEl.textContent = student.name.toUpperCase();

  const idTopEl = document.getElementById('cardStudentIdTop');
  if (idTopEl) idTopEl.textContent = student.studentId;

  const scorePillEl = document.getElementById('cardSidebarScorePill');
  if (scorePillEl) scorePillEl.textContent = `${readiness.score} / 100`;

  document.getElementById('cardStudentEmail').textContent = student.email;
  document.getElementById('cardAssessmentDate').textContent = student.assessmentDate;
  document.getElementById('cardStudentDegree').textContent = student.degree || 'B.Com - General Commerce';
  document.getElementById('cardStudentCollege').textContent = student.college || 'SNR';
  document.getElementById('cardCurrentStatus').textContent = student.currentStatus || 'Working Professional';
  document.getElementById('cardTargetCareer').textContent = student.targetCareer || 'Full Stack Developer';
  document.getElementById('cardDistrictCity').textContent = student.districtCity || 'Coimbatore';

  // Companion sync for Page 2 sidebar elements
  const initialsP2 = document.getElementById('cardStudentInitialsP2');
  if (initialsP2) initialsP2.textContent = candidateInitials;
  const nameP2 = document.getElementById('cardStudentNameP2');
  if (nameP2) nameP2.textContent = student.name.toUpperCase();
  const idTopP2 = document.getElementById('cardStudentIdTopP2');
  if (idTopP2) idTopP2.textContent = student.studentId;
  const targetCareerP2 = document.getElementById('cardTargetCareerP2');
  if (targetCareerP2) targetCareerP2.textContent = student.targetCareer || 'Full Stack Developer';
  const scorePillP2 = document.getElementById('cardSidebarScorePillP2');
  if (scorePillP2) scorePillP2.textContent = `${readiness.score} / 100`;

  // Live DB Candidate Preference Card Elements (Direct from candidate_registrations)
  const prefTargetDomain = document.getElementById('cardPrefTargetDomain');
  if (prefTargetDomain) prefTargetDomain.textContent = student.targetCareer || 'Full Stack Development';

  const prefDegreeDept = document.getElementById('cardPrefDegreeDept');
  if (prefDegreeDept) prefDegreeDept.textContent = student.degree || 'B.Com - General Commerce';

  const prefCollege = document.getElementById('cardPrefCollege');
  if (prefCollege) prefCollege.textContent = student.college || 'SNR';

  const prefStatus = document.getElementById('cardPrefStatus');
  if (prefStatus) prefStatus.textContent = student.currentStatus || student.graduationYear || 'Working Professional';

  const prefCity = document.getElementById('cardPrefCity');
  if (prefCity) prefCity.textContent = student.districtCity || 'Coimbatore';

  const prefCount = document.getElementById('cardPrefAssessmentCount');
  if (prefCount) {
    prefCount.textContent = (allScores && allScores.length > 0)
      ? `${allScores.length} Evaluated Competency Areas (test_answers)`
      : '0 Test Answers Recorded (Pending Assessment)';
  }

  // Circular Gauge Score - Strict Red, Amber, Green Grading
  const scoreNumEl = document.getElementById('cardScoreNumber');
  const circleProgress = document.getElementById('gaugeProgressCircle');
  const tierTitleEl = document.getElementById('cardTierTitle');
  const feedbackEl = document.getElementById('cardFeedbackText');

  let gradeColor = '#16a34a'; // Green
  if (readiness.score < 50) {
    gradeColor = '#ef4444';   // Red
  } else if (readiness.score < 70) {
    gradeColor = '#f59e0b';   // Amber
  }

  scoreNumEl.textContent = readiness.score;
  scoreNumEl.style.color = gradeColor;
  tierTitleEl.textContent = readiness.tier;
  tierTitleEl.style.color = gradeColor;
  const tierTitleP2 = document.getElementById('cardTierTitleP2');
  if (tierTitleP2) {
    tierTitleP2.textContent = readiness.tier;
    tierTitleP2.style.color = gradeColor;
  }
  feedbackEl.textContent = readiness.feedback;

  // SVG Circumference = 2 * PI * r = 314.159
  const circumference = 314.159;
  const offset = circumference - (readiness.score / 100) * circumference;
  circleProgress.style.strokeDasharray = `${circumference}`;
  circleProgress.style.strokeDashoffset = `${offset}`;
  circleProgress.style.stroke = gradeColor;

  // Scale pointer position
  const scalePointer = document.getElementById('scalePointer');
  const clampedPos = Math.max(2, Math.min(98, readiness.score));
  scalePointer.style.left = `${clampedPos}%`;

  // Dynamically populate Box 1 (Skilldome Services Next Steps) & Box 2 (Score-based Strengths & Weaknesses)
  renderScorecardNextSteps(student, allScores);
  renderStrengthsAndWeaknesses(allScores);
}

// ============================================================================
// Box 1: Skilldome Services & Recommended Next Steps (NO PACKAGE AMOUNTS)
// ============================================================================
function renderScorecardNextSteps(student, allScores) {
  const listEl = document.getElementById('cardRecommendedNextStepsList');
  if (!listEl) return;

  // Mention strictly the items given by the user in the reference snip, connected to Skilldome without random made-up courses
  const steps = [
    'Build 2-3 strong production projects and host on GitHub with Skilldome.',
    'Improve communication skills and mock interview confidence at Skilldome.',
    'Learn SQL, APIs, Git, and System Design basics through Skilldome.',
    'Create a professional LinkedIn profile with portfolio links guided by Skilldome.',
    'Practice 10 timed mock interview rounds with Skilldome.'
  ];

  listEl.innerHTML = steps.map(step => `
    <li>
      <span class="check-icon">✔</span>
      <span class="service-desc">${step}</span>
    </li>
  `).join('');
}

// ============================================================================
// Box 2: Automated Candidate Strengths & Weaknesses (Score-Driven Bullet Points Summary)
// ============================================================================
function getCategoryStrengthSummary(category, score) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ui') || cat.includes('ux') || cat.includes('design')) {
    return 'Strong user experience sensibility, clean layout hierarchy, and user-centered design proficiency.';
  }
  if (cat.includes('video') || cat.includes('editing')) {
    return 'Excellent visual pacing, media synthesis, and creative storytelling skills.';
  }
  if (cat.includes('problem') || cat.includes('solving')) {
    return 'Superior analytical logic and structured problem breakdown in evaluation rounds.';
  }
  if (cat.includes('decision') || cat.includes('making')) {
    return 'Sound judgment and consistent ability to select optimal trade-offs under constraints.';
  }
  if (cat.includes('communication')) {
    return 'Clear verbal articulation, active listening, and structured presentation of technical ideas.';
  }
  if (cat.includes('emotional') || cat.includes('intelligence')) {
    return 'High workplace empathy, professional composure, and interpersonal situational awareness.';
  }
  if (cat.includes('leadership') || cat.includes('initiative')) {
    return 'Proactive mindset with high ownership, project initiative, and peer alignment.';
  }
  if (cat.includes('teamwork') || cat.includes('collaboration')) {
    return 'Excellent collaborative dynamics, active peer cooperation, and group synergy.';
  }
  if (cat.includes('adaptability')) {
    return 'High learning agility to quickly adjust to shifting tools and evolving project contexts.';
  }
  if (cat.includes('time') || cat.includes('management')) {
    return 'Efficient delivery pacing, task prioritization, and adherence to time boundaries.';
  }
  if (cat.includes('power bi') || cat.includes('analytics') || cat.includes('sql')) {
    return 'Solid data visualization, dashboard generation, and metrics interpretation capability.';
  }
  if (cat.includes('photoshop') || cat.includes('graphic')) {
    return 'Proficient digital asset creation, image balancing, and visual layout principles.';
  }
  return 'High accuracy and solid conceptual mastery demonstrated across assessment questions.';
}

function getCategoryWeaknessSummary(category, score) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('analytical') || cat.includes('logical')) {
    return 'Needs focused drills in deductive logic, numerical pattern deduction, and structured reasoning.';
  }
  if (cat.includes('critical') || cat.includes('thinking')) {
    return 'Strengthen multi-angle objective evaluation, assumption testing, and complex scenario analysis.';
  }
  if (cat.includes('time') || cat.includes('management')) {
    return 'Focus on timed speed drills, pacing strategies, and prompt delivery under tight deadlines.';
  }
  if (cat.includes('adaptability')) {
    return 'Strengthen readiness to transition smoothly between different software tools and project paradigms.';
  }
  if (cat.includes('teamwork') || cat.includes('collaboration')) {
    return 'Engage in collaborative team tasks, peer code reviews, and cross-functional feedback sessions.';
  }
  if (cat.includes('communication')) {
    return 'Practice concise technical summaries and structured interview explanation techniques.';
  }
  if (cat.includes('photoshop') || cat.includes('graphic') || cat.includes('design')) {
    return 'Dedicate hands-on practice hours to design tools, shortcut mastery, and compositional layout.';
  }
  if (cat.includes('problem') || cat.includes('solving')) {
    return 'Reinforce step-by-step problem deconstruction and exploring multiple edge-case solutions.';
  }
  return 'Recommended for focused Skilldome foundational review and targeted mentoring drills.';
}

function renderStrengthsAndWeaknesses(allScores) {
  const strengthsList = document.getElementById('swStrengthsList');
  const weaknessesList = document.getElementById('swWeaknessesList');
  const badgeTag = document.getElementById('swScoreBasedBadge');

  if (!strengthsList || !weaknessesList) return;

  if (!allScores || allScores.length === 0) {
    if (badgeTag) badgeTag.textContent = 'Pending Assessment';
    strengthsList.innerHTML = `<li class="sw-bullet-placeholder">No test answers recorded yet. Competency summary will auto-generate once assessment is completed.</li>`;
    weaknessesList.innerHTML = `<li class="sw-bullet-placeholder">Awaiting candidate evaluation to identify targeted skill-building areas.</li>`;
    return;
  }

  const validScores = [...allScores].filter(s => typeof s.score === 'number' && !isNaN(s.score));
  if (validScores.length === 0) {
    strengthsList.innerHTML = `<li class="sw-bullet-placeholder">No numeric score records found.</li>`;
    weaknessesList.innerHTML = `<li class="sw-bullet-placeholder">No numeric score records found.</li>`;
    return;
  }

  if (badgeTag) {
    badgeTag.textContent = `${validScores.length} Competencies Evaluated`;
  }

  // 1. Identify Strengths (Sorted Descending)
  const sortedDesc = [...validScores].sort((a, b) => b.score - a.score);
  let strengths = sortedDesc.filter(s => s.score >= 70).slice(0, 3);
  if (strengths.length === 0) {
    strengths = sortedDesc.slice(0, 2); // Relative top performers
  }

  // 2. Identify Weaknesses / Areas for Improvement (Sorted Ascending)
  const sortedAsc = [...validScores].sort((a, b) => a.score - b.score);
  let weaknesses = sortedAsc.filter(s => s.score < 75).slice(0, 3);

  // Render Key Strengths as Bullet Points Summary
  strengthsList.innerHTML = strengths.map(s => {
    const scoreVal = Math.round(s.score);
    const summary = getCategoryStrengthSummary(s.category, scoreVal);
    return `
      <li class="sw-bullet-row">
        <span class="sw-bullet-marker text-grade-green">✔</span>
        <div class="sw-bullet-body">
          <strong class="sw-bullet-heading">${s.category} (${scoreVal}%):</strong>
          <span class="sw-bullet-text">${summary}</span>
        </div>
      </li>
    `;
  }).join('');

  // Render Areas for Improvement as Bullet Points Summary
  if (weaknesses.length === 0) {
    const lowest = sortedAsc.slice(0, 2);
    weaknessesList.innerHTML = `
      <li class="sw-bullet-row">
        <span class="sw-bullet-marker text-grade-green">🌟</span>
        <div class="sw-bullet-body">
          <strong class="sw-bullet-heading">Exceptional Baseline (≥75%):</strong>
          <span class="sw-bullet-text">All evaluated competencies scored above 75%. Recommended focus: Advance from foundational theory to enterprise-scale system design and high-pressure mock interview simulations.</span>
        </div>
      </li>
      ${lowest.map(s => {
        const scoreVal = Math.round(s.score);
        return `
          <li class="sw-bullet-row">
            <span class="sw-bullet-marker text-grade-amber">•</span>
            <div class="sw-bullet-body">
              <strong class="sw-bullet-heading">${s.category} (${scoreVal}%):</strong>
              <span class="sw-bullet-text">Refine from good to advanced enterprise mastery through senior-level architecture reviews.</span>
            </div>
          </li>
        `;
      }).join('')}
    `;
  } else {
    weaknessesList.innerHTML = weaknesses.map(s => {
      const scoreVal = Math.round(s.score);
      const summary = getCategoryWeaknessSummary(s.category, scoreVal);
      const isRed = scoreVal < 50;
      const markerColor = isRed ? 'text-grade-red' : 'text-grade-amber';
      const markerIcon = '•';

      return `
        <li class="sw-bullet-row">
          <span class="sw-bullet-marker ${markerColor}">${markerIcon}</span>
          <div class="sw-bullet-body">
            <strong class="sw-bullet-heading">${s.category} (${scoreVal}%):</strong>
            <span class="sw-bullet-text">${summary}</span>
          </div>
        </li>
      `;
    }).join('');
  }
}

// ============================================================================
// Render Assessment Area Scores (AREA | SCORE | LEVEL matching Image 3)
// ============================================================================
// Test 1: Render Aptitude & Core Competencies (AREA | SCORE | LEVEL)
// ============================================================================
// ============================================================================
// Test 1: Render Aptitude & Core Competencies (STRICTLY Aptitude Domain)
// ============================================================================
function renderAptitudeTestBars(allScores) {
  const container = document.getElementById('assessmentAreaBars');
  if (!container) return;

  // STRICTLY Aptitude ONLY (Domain === 'Aptitude')
  const aptitudeScores = (allScores || []).filter(sc =>
    sc.domain && sc.domain.toLowerCase() === 'aptitude'
  );

  if (aptitudeScores.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.78rem;">
        No Aptitude test answers recorded for this candidate in <code>test_answers</code>.
      </div>
    `;
    return;
  }

  const categoryIcons = {
    'Decision Making': '⚖️',
    'Critical Thinking': '🔍',
    'Problem Solving': '🧩',
    'Communication Skills': '💬',
    'Time Management': '⏱️',
    'Adaptability': '🔄',
    'Emotional Intelligence': '❤️',
    'Teamwork & Collaboration': '🤝',
    'Leadership & Initiative': '🚀',
    'Analytical & Logical Thinking': '💡'
  };

  container.innerHTML = aptitudeScores.map(sc => {
    const icon = categoryIcons[sc.category] || '★';

    let levelText = 'Good';
    let levelClass = 'text-grade-green';
    let fillClass = 'fill-grade-green';

    if (sc.score >= 70) {
      levelText = sc.score >= 85 ? 'Excellent' : 'Good';
      levelClass = 'text-grade-green';
      fillClass = 'fill-grade-green';
    } else if (sc.score >= 50) {
      levelText = 'Average';
      levelClass = 'text-grade-amber';
      fillClass = 'fill-grade-amber';
    } else {
      levelText = 'Needs Focus';
      levelClass = 'text-grade-red';
      fillClass = 'fill-grade-red';
    }

    return `
      <div class="score-bar-row" style="padding: 0.5px 0 !important; gap: 4px !important; font-size: 0.56rem !important; line-height: 1.1 !important;">
        <div class="bar-icon-box" style="width: 11px !important; height: 11px !important; font-size: 0.50rem !important; flex-shrink: 0 !important;">${icon}</div>
        <span class="bar-area-name" style="font-size: 0.56rem !important; font-weight: 600 !important; white-space: nowrap !important; overflow: visible !important; line-height: 1.1 !important;">${sc.category}</span>
        <div class="bar-score-group" style="width: 44px !important; gap: 2px !important; flex-shrink: 0 !important;">
          <span class="bar-num" style="font-size: 0.56rem !important; width: 14px !important;">${Math.round(sc.score)}</span>
          <div class="bar-track" style="height: 2.5px !important;">
            <div class="bar-fill ${fillClass}" style="width: ${sc.score}%; height: 100%;"></div>
          </div>
        </div>
        <span class="bar-level-badge ${levelClass}" style="width: 36px !important; font-size: 0.52rem !important; flex-shrink: 0 !important;">${levelText}</span>
      </div>
    `;
  }).join('');
}

// ============================================================================
// Test 2: Render Technical & Domain Skills (STRICTLY Coding & Non-Coding)
// Blank / Pending if not attended yet; fills automatically when test answers exist!
// ============================================================================
function renderTechnicalTestBars(allScores, student) {
  const container = document.getElementById('technicalSkillsBars');
  if (!container) return;

  // STRICTLY Coding & Non-Coding ONLY (Zero Aptitude!)
  const technicalScores = (allScores || []).filter(sc =>
    sc.domain && (
      sc.domain.toLowerCase() === 'coding' ||
      sc.domain.toLowerCase() === 'non-coding' ||
      sc.domain.toLowerCase() === 'non coding'
    )
  );

  // If student has NOT attended Technical Test (like Sanjeevi currently)
  if (technicalScores.length === 0) {
    container.innerHTML = `
      <div class="technical-test-blank-card" style="padding: 3px 6px !important; margin: 1px !important; gap: 2px !important;">
        <div class="test-pending-icon" style="font-size: 0.9rem !important; margin: 0 !important; line-height: 1 !important;">⏳</div>
        <div class="test-pending-title" style="font-size: 0.62rem !important; margin: 0 !important; font-weight: 800 !important;">Technical Test Not Attended Yet</div>
        <div class="test-pending-desc" style="font-size: 0.52rem !important; line-height: 1.15 !important; max-width: 240px !important;">
          Candidate <strong>${student ? student.name : 'Selected Student'}</strong> has completed <strong>Test 1 (Aptitude & Core Competencies)</strong>, but has not yet attended <strong>Test 2 (Technical / Coding & Tools)</strong>.
        </div>
        <div class="test-pending-footer" style="font-size: 0.48rem !important; padding: 1px 5px !important;">
          <span class="pulse-indicator"></span>
          <span>Awaiting technical submission in <code>test_answers</code></span>
        </div>
      </div>
    `;
    return;
  }

  // When student attends Test 2 (e.g. Santhosh: UI/UX, Video Editing, Graphic Design), render exact bars!
  const techIcons = {
    'UI/UX Design': '🎨',
    'Graphic Design': '✨',
    'Video Editing': '🎬',
    'Adobe Illustrator': '📐',
    'Adobe Photoshop': '🖼️',
    'Microsoft Excel': '📊',
    'Microsoft Office': '📄',
    'Power BI': '📈',
    'Tableau': '📉',
    'Google Analytics GA4': '📊',
    'Meta Ads Manager': '📢',
    'SEO': '🔍',
    'SMM': '📱',
    'Playwright': '🎭',
    'Selenium': '🤖',
    'Postman': '📫',
    'WordPress': '🌐',
    'Python': '🐍',
    'JavaScript': '⚡',
    'SQL': '🗄️',
    'MySQL': '🐬',
    'MongoDB': '🍃',
    'Java': '☕',
    'C++': '⚙️',
    'C Programming': '💻',
    'React': '⚛️',
    'React JS': '⚛️',
    'Angular': '🅰️',
    'Node JS': '🟢',
    'Express JS': '🚂',
    'Django': '🎸',
    'Data Structures': '🌲',
    'Algorithms': '⚙️',
    'HTML/CSS': '🎨',
    'Git': '🐙',
    'GitHub': '🐙',
    'Docker': '🐳',
    'AWS': '☁️',
    'Linux': '🐧',
    'REST API': '🔌',
    'Cloud / DevOps': '☁️'
  };

  container.innerHTML = technicalScores.map(sc => {
    const icon = techIcons[sc.category] || '💻';

    let levelText = 'Good';
    let levelClass = 'text-grade-green';
    let fillClass = 'fill-grade-green';

    if (sc.score >= 70) {
      levelText = sc.score >= 85 ? 'Excellent' : 'Good';
      levelClass = 'text-grade-green';
      fillClass = 'fill-grade-green';
    } else if (sc.score >= 50) {
      levelText = 'Average';
      levelClass = 'text-grade-amber';
      fillClass = 'fill-grade-amber';
    } else {
      levelText = 'Needs Focus';
      levelClass = 'text-grade-red';
      fillClass = 'fill-grade-red';
    }

    return `
      <div class="score-bar-row">
        <div class="bar-icon-box">${icon}</div>
        <span class="bar-area-name">${sc.category}</span>
        <div class="bar-score-group">
          <span class="bar-num">${Math.round(sc.score)}</span>
          <div class="bar-track">
            <div class="bar-fill ${fillClass}" style="width: ${sc.score}%;"></div>
          </div>
        </div>
        <span class="bar-level-badge ${levelClass}">${levelText}</span>
      </div>
    `;
  }).join('');
}

// ============================================================================
// Render Skill Profile Radar Chart (Precision Label Alignment & No Overlaps)
// ============================================================================
function renderSkillProfileRadar(scores) {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;

  const categories = scores && scores.length > 0 ? scores : [];
  if (categories.length === 0) {
    svg.innerHTML = '<text x="230" y="165" text-anchor="middle" fill="#94a3b8">No scores recorded</text>';
    return;
  }

  const centerX = 170;
  const centerY = 115;
  const radius = 72;
  const numAxes = categories.length;

  let svgContent = '';

  // 1. Concentric grid lines (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.50, 0.75, 1.0];
  levels.forEach(lvl => {
    const points = [];
    for (let i = 0; i < numAxes; i++) {
      const angle = (Math.PI * 2 / numAxes) * i - (Math.PI / 2);
      const r = radius * lvl;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    svgContent += `<polygon points="${points.join(' ')}" class="radar-grid-polygon" />`;
  });

  // Scale level numbers cleanly offset from vertices
  [0.25, 0.50, 0.75].forEach(lvl => {
    const y = centerY - (radius * lvl);
    svgContent += `<text x="${centerX + 4}" y="${y + 3}" fill="#94a3b8" font-size="6.5">${lvl * 100}</text>`;
  });

  // 2. Radial Axis Lines & Smart Anchor Labels
  const dataPoints = [];
  categories.forEach((cat, i) => {
    const angle = (Math.PI * 2 / numAxes) * i - (Math.PI / 2);
    const endX = centerX + radius * Math.cos(angle);
    const endY = centerY + radius * Math.sin(angle);

    svgContent += `<line x1="${centerX}" y1="${centerY}" x2="${endX.toFixed(1)}" y2="${endY.toFixed(1)}" class="radar-axis" />`;

    const scoreVal = Math.min(100, Math.max(0, cat.score));
    const dataR = radius * (scoreVal / 100);
    const dataX = centerX + dataR * Math.cos(angle);
    const dataY = centerY + dataR * Math.sin(angle);
    dataPoints.push(`${dataX.toFixed(1)},${dataY.toFixed(1)}`);

    const cosVal = Math.cos(angle);
    const sinVal = Math.sin(angle);

    let textAnchor = 'middle';
    let lx = centerX;
    let ly = centerY;

    if (cosVal > 0.28) {
      textAnchor = 'start';
      lx = centerX + (radius + 10) * cosVal;
      ly = centerY + (radius + 8) * sinVal;
    } else if (cosVal < -0.28) {
      textAnchor = 'end';
      lx = centerX + (radius + 10) * cosVal;
      ly = centerY + (radius + 8) * sinVal;
    } else {
      textAnchor = 'middle';
      if (sinVal < 0) {
        lx = centerX;
        ly = centerY - radius - 10;
      } else {
        lx = centerX;
        ly = centerY + radius + 14;
      }
    }

    const words = cat.category.split(' ');
    if (words.length > 1) {
      const mid = Math.ceil(words.length / 2);
      const line1 = words.slice(0, mid).join(' ');
      const line2 = words.slice(mid).join(' ');
      svgContent += `
        <text x="${lx.toFixed(1)}" y="${(ly - 3).toFixed(1)}" text-anchor="${textAnchor}" class="radar-label">
          <tspan x="${lx.toFixed(1)}" dy="0">${line1}</tspan>
          <tspan x="${lx.toFixed(1)}" dy="8">${line2}</tspan>
        </text>
      `;
    } else {
      svgContent += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${textAnchor}" class="radar-label">${cat.category}</text>`;
    }
  });

  // 3. Data Polygon
  svgContent += `<polygon points="${dataPoints.join(' ')}" class="radar-data-polygon" />`;

  // 4. Dot markers
  dataPoints.forEach(pt => {
    const [x, y] = pt.split(',');
    svgContent += `<circle cx="${x}" cy="${y}" r="3" class="radar-point" />`;
  });

  svg.innerHTML = svgContent;
}

// ============================================================================
// Feature 3: Recommended Career Domains Table
// STRICT COLOR GRADING (Red, Amber, Green) & Centered Readiness Alignment
// ============================================================================
function renderRecommendedCareerDomains(allScores, student) {
  const tbody = document.getElementById('recCareerTableBody');
  if (!tbody) return;

  // 1. If NO assessment answers exist in DB test_answers, DO NOT FAKE ANY DATA! Show empty state
  if (!allScores || allScores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 36px 16px; background: #f8fafc; border: 1px dashed #cbd5e1;">
          <div style="font-size: 1.5rem; margin-bottom: 6px;">📂</div>
          <div style="font-weight: 700; font-size: 0.85rem; color: #0c192c; margin-bottom: 4px;">
            No Assessment Test Answers Recorded in Database (<code>test_answers</code>)
          </div>
          <div style="font-size: 0.72rem; color: #64748b; max-width: 480px; margin: 0 auto; line-height: 1.4;">
            Candidate <strong>${student ? student.name : 'Selected Student'}</strong> is registered in <code>candidate_registrations</code>, but has no submitted test answers in <code>test_answers</code>. Career recommendations will be dynamically evaluated once assessment questions are answered.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // 2. Build score map from candidate's real evaluated test_answers
  const scoreMap = {};
  allScores.forEach(s => {
    scoreMap[s.category] = s.score;
  });

  const getScore = cat => scoreMap[cat] !== undefined ? scoreMap[cat] : 50;

  const critScore = getScore('Critical Thinking');
  const probScore = getScore('Problem Solving');
  const decScore = getScore('Decision Making');
  const anaScore = getScore('Analytical & Logical Thinking');
  const adapScore = getScore('Adaptability');
  const commScore = getScore('Communication Skills');
  const emoScore = getScore('Emotional Intelligence');

  const candidateTarget = (student && student.targetCareer) ? student.targetCareer : 'Full Stack Development';

  // Helper to dynamically calculate stars, labels, and readiness strictly from skill marks
  function evaluateDomainFit(score, isPrimary = false) {
    if (score >= 85) {
      return {
        stars: isPrimary ? '★★★★★' : '★★★★☆',
        starClass: 'stars-green',
        matchLabel: isPrimary ? 'Strong Match' : 'Good Match',
        matchClass: 'text-grade-green',
        readiness: 'High',
        readinessSub: 'Best Fit',
        circleClass: 'circle-high',
        captionClass: 'text-grade-green'
      };
    } else if (score >= 70) {
      return {
        stars: '★★★★☆',
        starClass: 'stars-green',
        matchLabel: 'Good Match',
        matchClass: 'text-grade-green',
        readiness: isPrimary ? 'High' : 'Medium',
        readinessSub: isPrimary ? 'Best Fit' : 'Potential',
        circleClass: isPrimary ? 'circle-high' : 'circle-medium',
        captionClass: isPrimary ? 'text-grade-green' : 'text-grade-amber'
      };
    } else if (score >= 50) {
      return {
        stars: '★★★☆☆',
        starClass: 'stars-amber',
        matchLabel: 'Explore',
        matchClass: 'text-grade-amber',
        readiness: 'Medium',
        readinessSub: 'Potential',
        circleClass: 'circle-medium',
        captionClass: 'text-grade-amber'
      };
    } else {
      return {
        stars: '★★☆☆☆',
        starClass: 'stars-red',
        matchLabel: 'Development Needed',
        matchClass: 'text-grade-red',
        readiness: 'Low',
        readinessSub: 'Explore',
        circleClass: 'circle-low',
        captionClass: 'text-grade-red'
      };
    }
  }

  // 1. Registered Target Domain Match (Evaluates Critical Thinking + Problem Solving + Decision Making)
  const targetMark = Math.round((critScore + probScore + decScore) / 3);
  const targetFit = evaluateDomainFit(targetMark, true);

  // 2. Data & Analytics Match (Evaluates Analytical Thinking + Decision Making)
  const dataMark = Math.round((anaScore + decScore) / 2);
  const dataFit = evaluateDomainFit(dataMark, false);

  // 3. QA & Testing Match (Evaluates Adaptability + Problem Solving)
  const qaMark = Math.round((adapScore + probScore) / 2);
  const qaFit = evaluateDomainFit(qaMark, false);

  // 4. Consulting & Client Solutions Match (Evaluates Communication + Emotional Intelligence)
  const consultingMark = Math.round((commScore + emoScore) / 2);
  const consultingFit = evaluateDomainFit(consultingMark, false);

  const domains = [
    {
      domain: candidateTarget,
      sub: 'Candidate Registered Target',
      icon: '🎯',
      iconClass: 'icon-bg-blue',
      stars: targetFit.stars,
      starClass: targetFit.starClass,
      matchLabel: targetFit.matchLabel,
      matchClass: targetFit.matchClass,
      why: `Strong mastery in Critical Thinking, Problem Solving & Decision Making (${targetMark}%).`,
      designations: ['• Junior Developer / Associate', '• Full Stack Trainee'],
      readiness: targetFit.readiness,
      readinessSub: targetFit.readinessSub,
      circleClass: targetFit.circleClass,
      captionClass: targetFit.captionClass,
      focus: ['• Production Projects on GitHub', '• API & Database Schemas']
    },
    {
      domain: 'Data & Analytics',
      sub: 'Analytical & BI Systems',
      icon: '📊',
      iconClass: 'icon-bg-green',
      stars: dataFit.stars,
      starClass: dataFit.starClass,
      matchLabel: dataFit.matchLabel,
      matchClass: dataFit.matchClass,
      why: `High aptitude in Analytical Thinking & Decision Making (${dataMark}%).`,
      designations: ['• Junior Data Analyst', '• BI / Reporting Trainee'],
      readiness: dataFit.readiness,
      readinessSub: dataFit.readinessSub,
      circleClass: dataFit.circleClass,
      captionClass: dataFit.captionClass,
      focus: ['• Master SQL & Relational Queries', '• Data Modeling with Python']
    },
    {
      domain: 'QA & Automation Testing',
      sub: 'Software Quality & Validation',
      icon: '🛡️',
      iconClass: 'icon-bg-purple',
      stars: qaFit.stars,
      starClass: qaFit.starClass,
      matchLabel: qaFit.matchLabel,
      matchClass: qaFit.matchClass,
      why: `Excellent Adaptability & Problem Solving competencies (${qaMark}%).`,
      designations: ['• QA Engineer (Trainee)', '• Software Test Engineer'],
      readiness: qaFit.readiness,
      readinessSub: qaFit.readinessSub,
      circleClass: qaFit.circleClass,
      captionClass: qaFit.captionClass,
      focus: ['• Test Case Design & Automation', '• CI/CD Quality Gates']
    }
  ];

  tbody.innerHTML = domains.map(d => `
    <tr class="clickable-domain-row" onclick="openCareerRoadmap('${d.domain.replace(/'/g, "\\'")}')" title="Click to view 10–15 Year Career Roadmap for ${d.domain}" style="line-height: 1.15 !important;">
      <td style="padding: 2px 4px !important; font-size: 0.58rem !important; vertical-align: top !important;">
        <div class="domain-cell" style="display: flex !important; align-items: center !important; gap: 4px !important;">
          <div class="rec-icon ${d.iconClass}" style="width: 14px !important; height: 14px !important; font-size: 0.65rem !important;">${d.icon}</div>
          <div>
            <div class="rec-domain-title" style="font-size: 0.60rem !important; font-weight: 700 !important; line-height: 1.15 !important;">${d.domain}</div>
            <div class="rec-domain-sub" style="font-size: 0.50rem !important; line-height: 1.05 !important;">${d.sub}</div>
          </div>
        </div>
      </td>
      <td style="padding: 2px 4px !important; font-size: 0.54rem !important; vertical-align: top !important;">
        <div class="star-rating ${d.starClass}" style="font-size: 0.60rem !important; line-height: 1 !important;">${d.stars}</div>
        <div class="match-label ${d.matchClass}" style="font-size: 0.52rem !important; font-weight: 700 !important;">${d.matchLabel}</div>
      </td>
      <td style="padding: 2px 4px !important; font-size: 0.54rem !important; vertical-align: top !important;">
        <p class="why-text" style="font-size: 0.54rem !important; line-height: 1.14 !important; margin: 0 !important;">${d.why}</p>
      </td>
      <td style="padding: 2px 4px !important; font-size: 0.54rem !important; vertical-align: top !important;">
        <ul class="designation-list" style="margin: 0 !important; padding: 0 !important; list-style: none !important;">
          ${d.designations.map(x => `<li style="font-size: 0.54rem !important; line-height: 1.14 !important;">${x}</li>`).join('')}
        </ul>
      </td>
      <td style="text-align: center !important; vertical-align: middle !important; padding: 2px 4px !important;">
        <div class="readiness-col-wrap" style="display: flex !important; flex-direction: column !important; align-items: center !important; gap: 1px !important;">
          <div class="readiness-circle ${d.circleClass}" style="font-size: 0.54rem !important; font-weight: 800 !important; padding: 1px 3px !important;" title="${d.readiness} (${d.readinessSub})">${d.readiness}</div>
          <div class="readiness-caption ${d.captionClass}" style="font-size: 0.48rem !important;">${d.readinessSub}</div>
        </div>
      </td>
      <td style="padding: 2px 4px !important; font-size: 0.54rem !important; vertical-align: top !important;">
        <ul class="focus-list" style="margin: 0 !important; padding: 0 !important; list-style: none !important;">
          ${d.focus.map(x => `<li style="font-size: 0.54rem !important; line-height: 1.14 !important;">${x}</li>`).join('')}
        </ul>
      </td>
    </tr>
  `).join('');
}


function renderCategoryScoresTable(scoresList) {
  const tbody = document.getElementById('categoryScoresTableBody');
  if (!tbody) return;

  const subTitle = document.getElementById('categoryDataSubtitle');
  let list = [...scoresList];

  if (state.selectedDomain !== 'All') {
    list = list.filter(item => item.domain.toLowerCase() === state.selectedDomain.toLowerCase());
  }

  if (subTitle) {
    subTitle.textContent = `Showing ${list.length} categories for ${state.currentStudentData ? state.currentStudentData.student.name : 'Candidate'}`;
  }

  list.sort((a, b) => {
    let valA = a[state.categorySort.column];
    let valB = b[state.categorySort.column];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return state.categorySort.order === 'asc' ? -1 : 1;
    if (valA > valB) return state.categorySort.order === 'asc' ? 1 : -1;
    return 0;
  });

  state.categoryScoresData = list;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 24px; color: #94a3b8;">
          No category records match domain filter "${state.selectedDomain}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const domainTagClass = item.domain === 'Coding' ? 'tag-coding' : (item.domain === 'Aptitude' ? 'tag-aptitude' : 'tag-noncoding');
    return `
      <tr>
        <td>
          <span class="category-name-bold">${item.category}</span>
        </td>
        <td>
          <span class="domain-tag-pill ${domainTagClass}">${item.domain}</span>
        </td>
        <td>
          <div class="score-display-cell">
            <span style="font-weight: 700; width: 28px;">${Math.round(item.score)}</span>
            <div class="score-mini-track">
              <div class="score-mini-fill" style="width: ${item.score}%;"></div>
            </div>
            <span style="color: #94a3b8; font-size: 0.72rem;">/100</span>
          </div>
        </td>
        <td style="color: #64748b;">${item.formattedDate || formatDate(item.date)}</td>
      </tr>
    `;
  }).join('');
}

function sortCategoryList(column) {
  if (state.categorySort.column === column) {
    state.categorySort.order = state.categorySort.order === 'asc' ? 'desc' : 'asc';
  } else {
    state.categorySort.column = column;
    state.categorySort.order = 'desc';
  }

  document.getElementById('catSort-category').textContent = state.categorySort.column === 'category' ? (state.categorySort.order === 'asc' ? '↑' : '↓') : '↕';
  document.getElementById('catSort-domain').textContent = state.categorySort.column === 'domain' ? (state.categorySort.order === 'asc' ? '↑' : '↓') : '↕';
  document.getElementById('catSort-score').textContent = state.categorySort.column === 'score' ? (state.categorySort.order === 'asc' ? '↑' : '↓') : '↕';

  if (state.currentStudentData) {
    renderCategoryScoresTable(state.currentStudentData.allScores);
  }
}

// ============================================================================
// Feature 4: Admin Directory Table (from candidate_registrations)
// ============================================================================
async function fetchAdminStudents() {
  const { page, limit, search, sortBy, sortOrder } = state.adminTable;

  try {
    const url = `/api/admin/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&domain=${encodeURIComponent(state.selectedDomain)}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    const res = await apiRequest(url);

    if (res && res.success) {
      state.adminTable.items = res.data;
      state.adminTable.totalPages = res.pagination.totalPages;
      state.adminTable.totalItems = res.pagination.totalItems;

      if (res.metrics) {
        document.getElementById('kpiTotalStudents').textContent = res.metrics.totalStudents;
        document.getElementById('kpiAvgScore').textContent = res.metrics.averageReadiness;
        document.getElementById('kpiAvgTier').textContent = res.metrics.averageReadiness >= 75 ? 'Job / Industry Ready' : 'Developing Tier';
        const topScoreEl = document.getElementById('kpiTopScore');
        if (topScoreEl && res.data && res.data.length > 0) {
          const topScore = Math.max(...res.data.map(d => d.overallScore));
          topScoreEl.innerHTML = `${topScore}<span class="kpi-max">/100</span>`;
        }
      }

      renderAdminTable(res.data, res.pagination);
    }
  } catch (err) {
    console.error('Failed to load candidate directory:', err);
  }
}

function renderAdminTable(students, pagination) {
  const tbody = document.getElementById('adminStudentsTableBody');

  document.getElementById('pageStart').textContent = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  document.getElementById('pageEnd').textContent = Math.min(pagination.page * pagination.limit, pagination.totalItems);
  document.getElementById('totalStudentsCount').textContent = pagination.totalItems;

  document.getElementById('btnPrevPage').disabled = pagination.page <= 1;
  document.getElementById('btnNextPage').disabled = pagination.page >= pagination.totalPages;

  const pillsContainer = document.getElementById('pageNumberPills');
  pillsContainer.innerHTML = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    const pill = document.createElement('button');
    pill.className = `page-pill ${i === pagination.page ? 'active' : ''}`;
    pill.textContent = i;
    pill.onclick = () => {
      state.adminTable.page = i;
      fetchAdminStudents();
    };
    pillsContainer.appendChild(pill);
  }

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px; color: #94a3b8;">
          No candidates found in candidate_registrations.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const normPhoto = normalizePhotoUrl(s.photo);
    const avatarHtml = normPhoto
      ? `<img src="${normPhoto}" class="table-photo-thumb" alt="${s.name}" onerror="this.outerHTML='<div class=\\'table-monogram\\'>${s.initials || 'SK'}</div>'" />`
      : `<div class="table-monogram">${s.initials || 'SK'}</div>`;

    return `
      <tr>
        <td>
          <span class="student-id-tag">${s.studentId}</span>
        </td>
        <td>
          <div class="student-col">
            ${avatarHtml}
            <div class="student-primary-info">
              <span class="student-name-link" onclick="selectStudent('${s.studentId}')">${s.name}</span>
              <span class="student-sub-info">${s.degree} • ${s.college}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight: 500; font-size: 0.82rem;">${s.targetCareer || 'Full Stack'}</span>
        </td>
        <td>
          <div class="badge-score-pill ${s.badgeClass}">
            <span class="badge-score-num">${s.overallScore}/100</span>
            <span>${s.level}</span>
          </div>
        </td>
        <td>
          <div class="domain-breakdown-cell">
            <div class="mini-bar-row">
              <span class="mini-bar-label">Coding</span>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-coding" style="width: ${s.domainBreakdown.Coding}%;"></div>
              </div>
              <span class="mini-bar-val">${s.domainBreakdown.Coding}</span>
            </div>
            <div class="mini-bar-row">
              <span class="mini-bar-label">Non-Code</span>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-noncoding" style="width: ${s.domainBreakdown.NonCoding}%;"></div>
              </div>
              <span class="mini-bar-val">${s.domainBreakdown.NonCoding}</span>
            </div>
            <div class="mini-bar-row">
              <span class="mini-bar-label">Aptitude</span>
              <div class="mini-bar-track">
                <div class="mini-bar-fill fill-aptitude" style="width: ${s.domainBreakdown.Aptitude}%;"></div>
              </div>
              <span class="mini-bar-val">${s.domainBreakdown.Aptitude}</span>
            </div>
          </div>
        </td>
        <td style="color: #64748b; font-size: 0.8rem;">
          ${s.assessmentDate}
        </td>
        <td class="th-action" style="white-space: nowrap;">
          <button class="btn-view-card" onclick="selectStudent('${s.studentId}')" title="View Career Readiness Scorecard">
            <span>Scorecard</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
          <button class="btn-view-roadmap-inline" onclick="openStudentRoadmapDirect('${s.studentId}', '${(s.targetCareer || 'Python Developer').replace(/'/g, "\\'")}')" title="View 10–15 Year Career Roadmap for this Candidate">
            <span>Roadmap</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

let searchDebounceTimeout = null;
function handleAdminTableSearch(query) {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    state.adminTable.search = query;
    state.adminTable.page = 1;
    fetchAdminStudents();
  }, 250);
}

function changeAdminPage(delta) {
  const newPage = state.adminTable.page + delta;
  if (newPage >= 1 && newPage <= state.adminTable.totalPages) {
    state.adminTable.page = newPage;
    fetchAdminStudents();
  }
}

function sortAdminTable(column) {
  if (state.adminTable.sortBy === column) {
    state.adminTable.sortOrder = state.adminTable.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    state.adminTable.sortBy = column;
    state.adminTable.sortOrder = 'desc';
  }

  document.querySelectorAll('.data-table th .sort-icon').forEach(el => el.classList.remove('active'));
  const activeIcon = document.getElementById(`sort-${column}`);
  if (activeIcon) {
    activeIcon.classList.add('active');
    activeIcon.textContent = state.adminTable.sortOrder === 'asc' ? '↑' : '↓';
  }

  fetchAdminStudents();
}

function updateActiveFilterTags() {
  const bar = document.getElementById('activeFilterTags');
  if (!bar) return;

  const tags = [];

  if (state.selectedDomain !== 'All') {
    tags.push(`
      <span class="filter-tag">
        <span>Domain: <strong>${state.selectedDomain}</strong></span>
        <button class="tag-remove-btn" onclick="setDomainFilter('All')">×</button>
      </span>
    `);
  }

  if (state.selectedStudentId) {
    tags.push(`
      <span class="filter-tag">
        <span>Candidate: <strong>${state.selectedStudentId}</strong></span>
        <button class="tag-remove-btn" onclick="clearSelectedStudent()">×</button>
      </span>
    `);
  }

  if (tags.length === 0) {
    bar.innerHTML = '<span class="tag-label">All live database records active • No filters applied</span>';
  } else {
    bar.innerHTML = `<span class="tag-label">Active Filters:</span> ${tags.join('')}`;
  }
}

function resetAllFilters() {
  state.selectedDomain = 'All';
  state.selectedStudentId = '';
  state.adminTable.search = '';

  document.querySelectorAll('.domain-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-domain') === 'All');
  });

  const searchInput = document.getElementById('studentSearchInput');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('clearStudentBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  const tableSearch = document.getElementById('adminTableSearch');
  if (tableSearch) tableSearch.value = '';

  switchView('overview');
  fetchAdminStudents();
}

function refreshCurrentView() {
  if (state.currentView === 'overview') {
    fetchAdminStudents();
    fetchDomainCounts();
  } else {
    fetchStudentDetails(state.selectedStudentId);
  }
  checkDbHealth();
}

// ============================================================================
// SQL Query Inspector & DB Diagnostics Modal
// ============================================================================
async function openQueryInspector() {
  const modal = document.getElementById('inspectorModal');
  if (modal) modal.classList.remove('hidden');
  await refreshQueryLogs();
  await checkDbHealth();
}

function closeQueryInspector() {
  const modal = document.getElementById('inspectorModal');
  if (modal) modal.classList.add('hidden');
}

async function refreshQueryLogs() {
  try {
    const res = await apiRequest('/api/system/query-logs');
    if (res && res.logs) {
      renderQueryStream(res.logs);
    }
  } catch (err) {
    console.warn('Could not fetch query logs:', err);
  }
}

function renderQueryStream(logs) {
  const container = document.getElementById('queryStreamContainer');
  const countEl = document.getElementById('queryLogCount');

  if (countEl) countEl.textContent = `${logs.length} queries logged`;

  if (!logs || logs.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.8rem;">
        No SQL queries executed yet.
      </div>
    `;
    return;
  }

  container.innerHTML = logs.map(q => {
    const dbTagClass = q.database === 'Student Master DB' ? 'tag-student-db' : 'tag-assessment-db';
    return `
      <div class="query-card" style="border-left: 3px solid ${q.success ? '#22c55e' : '#ef4444'};">
        <div class="query-card-header">
          <span class="query-db-tag ${dbTagClass}">${q.database}</span>
          <span class="query-time">${new Date(q.timestamp).toLocaleTimeString()} • ${q.durationMs}ms</span>
        </div>
        <div class="query-sql">${q.sql}</div>
        ${q.params && q.params.length > 0 ? `<div style="color: #64748b; font-size: 0.68rem;">Params: ${JSON.stringify(q.params)}</div>` : ''}
        ${!q.success ? `<div style="color: #ef4444; font-size: 0.7rem; font-weight: bold;">Error: ${q.error}</div>` : ''}
      </div>
    `;
  }).join('');
}

function clearQueryLogs() {
  const container = document.getElementById('queryStreamContainer');
  const countEl = document.getElementById('queryLogCount');
  if (container) container.innerHTML = '<div style="padding: 24px; text-align: center; color: #94a3b8;">Logs cleared.</div>';
  if (countEl) countEl.textContent = '0 queries logged';
}

async function checkDbHealth() {
  try {
    const res = await fetch('/api/system/health');
    const data = await res.json();
    const statusBadge = document.getElementById('dbStatusBadge');

    if (statusBadge) {
      const isHealthy = data && data.status === 'ok';
      statusBadge.className = isHealthy ? 'db-pill db-online' : 'db-pill db-offline';
      const label = statusBadge.querySelector('.db-label');
      if (label) {
        label.textContent = isHealthy ? 'Hostinger DB: Connected' : 'Database: Offline';
      }
    }
  } catch (err) {
    console.warn('System health check error:', err);
  }
}

async function toggleSimulatedFailure(target) {
  let failValue = false;
  if (target === 'student') failValue = !state.isStudentDbOffline;
  if (target === 'assessment') failValue = !state.isAssessmentDbOffline;

  try {
    await apiRequest('/api/system/toggle-db-failure', {
      method: 'POST',
      body: JSON.stringify({ targetDb: target, fail: failValue })
    });
    await checkDbHealth();
    await refreshQueryLogs();
  } catch (err) {
    console.warn('Failed to toggle simulation:', err);
  }
}

// ============================================================================
// Export Utilities
// ============================================================================
function exportAdminTableToCSV() {
  if (!state.adminTable.items || state.adminTable.items.length === 0) {
    alert('No candidate records to export.');
    return;
  }

  const headers = ['StudentID', 'Name', 'Email', 'Degree', 'College', 'TargetCareer', 'OverallScore', 'ReadinessTier', 'CodingScore', 'NonCodingScore', 'AptitudeScore', 'AssessmentDate'];
  const rows = state.adminTable.items.map(s => [
    s.studentId,
    `"${s.name}"`,
    s.email,
    `"${s.degree || ''}"`,
    `"${s.college || ''}"`,
    `"${s.targetCareer || ''}"`,
    s.overallScore,
    s.level,
    s.domainBreakdown.Coding,
    s.domainBreakdown.NonCoding,
    s.domainBreakdown.Aptitude,
    `"${s.assessmentDate}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `skilldome_candidate_readiness_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportCategoryScoresCSV() {
  if (!state.categoryScoresData || state.categoryScoresData.length === 0) {
    alert('No category data to export.');
    return;
  }

  const candidateName = state.currentStudentData ? state.currentStudentData.student.name : 'Candidate';
  const headers = ['CandidateName', 'Category', 'Domain', 'Score', 'AssessmentDate'];
  const rows = state.categoryScoresData.map(c => [
    `"${candidateName}"`,
    `"${c.category}"`,
    c.domain,
    c.score,
    `"${c.formattedDate || c.date}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `skilldome_${candidateName.replace(/\s+/g, '_')}_scores.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// Universal PDF Download System (Exact Single-Page A4 Precision)
// ============================================================================
function downloadScorecardPDF() {
  const candidate = (state.currentStudentData && state.currentStudentData.student) ? state.currentStudentData.student : null;
  const name = candidate ? candidate.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Candidate';
  const id = candidate ? candidate.studentId : (state.selectedStudentId || 'Scorecard');
  const prevTitle = document.title;
  document.title = `Skilldome_Career_Scorecard_${name}_${id}`;
  window.print();
  setTimeout(() => { document.title = prevTitle; }, 1200);
}

function downloadMockScorecardPDF() {
  const nameEl = document.getElementById('mockStudentName');
  const idEl = document.getElementById('mockStudentId');
  const numEl = document.getElementById('mockInterviewNumber');
  const name = (nameEl ? nameEl.textContent : 'Candidate').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const id = (idEl ? idEl.textContent : 'Mock').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const sessionNum = (numEl ? numEl.textContent : '1').trim().replace(/[^0-9]/g, '') || '1';
  const prevTitle = document.title;
  document.title = `Skilldome_Mock_Interview_Scorecard_${name}_${id}_Session_${sessionNum}`;
  window.print();
  setTimeout(() => { document.title = prevTitle; }, 1200);
}

function downloadRoadmapPDF() {
  const nameEl = document.getElementById('crmCandidateName');
  const candidateName = (nameEl ? nameEl.textContent : 'Candidate').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const select = document.getElementById('crmDomainSelect');
  const domain = select ? select.value.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Career';
  const prevTitle = document.title;
  document.title = `Skilldome_Career_Roadmap_${candidateName}_${domain}`;
  window.print();
  setTimeout(() => { document.title = prevTitle; }, 1200);
}

function downloadDirectoryPDF() {
  const prevTitle = document.title;
  document.title = `Skilldome_Candidate_Assessment_Directory_${new Date().toISOString().slice(0, 10)}`;
  window.print();
  setTimeout(() => { document.title = prevTitle; }, 1200);
}

async function openStudentRoadmapDirect(studentId, domain) {
  if (studentId) {
    state.selectedStudentId = studentId;
    await selectStudent(studentId);
  }
  await openCareerRoadmap(domain);
}

window.downloadScorecardPDF = downloadScorecardPDF;
window.downloadMockScorecardPDF = downloadMockScorecardPDF;
window.downloadRoadmapPDF = downloadRoadmapPDF;
window.downloadDirectoryPDF = downloadDirectoryPDF;
window.openStudentRoadmapDirect = openStudentRoadmapDirect;


function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getInitials(name) {
  if (!name) return 'SK';
  const clean = String(name).trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SK';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function safeJsonParse(str, fallback = []) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// ============================================================================
// Feature 6: Mock Interview Evaluation & Scorecard System
// Matches Reference Blueprint 4 (Pre-loaded with Dinesh Demo Check Data)
// ============================================================================
state.currentMockInterview = null;
state.mockInterviewHistory = [];
state.selectedMockStudentId = 'SKD-2026-0001'; // Default to Dinesh demo check data

async function loadMockInterviewView(targetSessionId) {
  const studentSelect = document.getElementById('mockSelectStudent');
  if (!studentSelect) return;

  if (!state.allStudentsMaster || state.allStudentsMaster.length === 0) {
    try {
      await loadStudentsListDropdown();
    } catch (e) {}
  }

  // Build list of candidates including Dinesh Kumar demo
  let studentOptions = [];
  const hasDinesh = (state.allStudentsMaster || []).some(s => s.studentId === 'SKD-2026-0001');

  if (!hasDinesh) {
    studentOptions.push({
      studentId: 'SKD-2026-0001',
      name: 'Dinesh Kumar',
      college: 'Skilldome Demo'
    });
  }

  (state.allStudentsMaster || []).forEach(s => {
    studentOptions.push(s);
  });

  const activeStudentId = state.selectedMockStudentId || 'SKD-2026-0001';

  studentSelect.innerHTML = studentOptions.map(s => `
    <option value="${s.studentId}" ${s.studentId === activeStudentId ? 'selected' : ''}>
      ${s.studentId} — ${s.name} ${s.studentId === 'SKD-2026-0001' ? '(Temporary Check Data)' : ''}
    </option>
  `).join('');

  studentSelect.value = activeStudentId;
  state.selectedMockStudentId = activeStudentId;
  const studentId = activeStudentId;

  // If a specific session ID was requested (e.g. freshly submitted evaluation), load and display it immediately
  if (targetSessionId) {
    await displayMockInterviewById(targetSessionId);
  }

  try {
    const res = await apiRequest(`/api/students/${encodeURIComponent(studentId)}/mock-interviews`);
    const sessionSelect = document.getElementById('mockSelectSession');

    if (res && res.history && res.history.length > 0) {
      state.mockInterviewHistory = res.history;

      if (sessionSelect) {
        sessionSelect.innerHTML = res.history.map((h) => `
          <option value="${h.id}">Interview #${h.interview_number} – ${h.interview_name} (${h.total_score}/100)</option>
        `).join('');
      }

      let selectedId = targetSessionId;
      if (!selectedId || !res.history.some(h => String(h.id) === String(targetSessionId))) {
        selectedId = res.history[res.history.length - 1].id;
      }
      if (sessionSelect) sessionSelect.value = selectedId;
      if (!targetSessionId || String(selectedId) !== String(targetSessionId)) {
        await displayMockInterviewById(selectedId);
      }
    } else if (!targetSessionId) {
      state.mockInterviewHistory = [];
      if (sessionSelect) {
        sessionSelect.innerHTML = `<option value="">Interview #1 – CodeStart Sprint</option>`;
      }
      renderMockInterviewBlueprintData(studentId);
    }
  } catch (err) {
    console.error('Failed to load student mock interviews:', err);
    if (!targetSessionId) {
      renderMockInterviewBlueprintData(studentId);
    }
  }
}

async function onMockStudentChange(studentId) {
  state.selectedMockStudentId = studentId;
  await loadMockInterviewView();
}

async function onMockSessionChange(interviewId) {
  if (interviewId) {
    await displayMockInterviewById(interviewId);
  }
}

async function displayMockInterviewById(interviewId) {
  if (!interviewId) return;
  try {
    const res = await apiRequest(`/api/mock-interviews/${encodeURIComponent(interviewId)}`);
    if (res && res.success && res.interview) {
      state.currentMockInterview = res.interview;
      if (res.interview.student_id) {
        state.selectedMockStudentId = res.interview.student_id;
        const studentSelect = document.getElementById('mockSelectStudent');
        if (studentSelect) {
          studentSelect.value = res.interview.student_id;
        }
      }
      const sessionSelect = document.getElementById('mockSelectSession');
      if (sessionSelect) {
        sessionSelect.value = interviewId;
      }
      renderMockInterviewScorecard(res.interview);
    }
  } catch (err) {
    console.error('Failed to fetch mock interview session:', err);
  }
}

function renderMockInterviewBlueprintData(studentId) {
  const isDinesh = studentId === 'SKD-2026-0001';
  const candidate = (state.allStudentsMaster || []).find(s => s.studentId === studentId);
  const studentName = isDinesh ? 'Dinesh Kumar' : (candidate ? candidate.name : 'Candidate');
  const targetRole = isDinesh ? 'Python Developer' : (candidate ? (candidate.interested_domain || candidate.department || 'Python Developer') : 'Python Developer');

  let baseScore = 61;
  if (!isDinesh && candidate && candidate.overallScore) {
    baseScore = Math.round(candidate.overallScore);
  }

  // Scale 7 areas according to baseScore percentage
  const factor = baseScore / 100;
  const comm = Math.min(15, Math.max(1, Math.round(15 * factor)));
  const tech = Math.min(20, Math.max(1, Math.round(20 * factor)));
  const prob = Math.min(15, Math.max(1, Math.round(15 * factor)));
  const resume = Math.min(15, Math.max(1, Math.round(15 * factor)));
  const behav = Math.min(10, Math.max(1, Math.round(10 * factor)));
  const conf = Math.min(10, Math.max(1, Math.round(10 * factor)));
  const role = Math.min(15, Math.max(1, Math.round(15 * factor)));
  const calculatedTotal = comm + tech + prob + resume + behav + conf + role;

  const scores = isDinesh ?
    { comm: 9, tech: 14, prob: 10, resume: 8, behav: 6, conf: 6, role: 8 } :
    { comm, tech, prob, resume, behav, conf, role };

  const autoSummary = generateMockInterviewSummary({
    studentName,
    targetRole,
    interviewNum: 1,
    scores
  });

  const blueprintData = {
    student_id: isDinesh ? 'SKD-2026-0001' : (studentId || 'SKD-2026-0001'),
    student_name: studentName,
    photo: candidate ? candidate.photo : null,
    email: isDinesh ? 'dinesh.kumar@email.com' : (candidate ? candidate.email : `${(studentId || 'sdc00001').toLowerCase()}@email.com`),
    target_role: targetRole,
    experience_level: 'Fresher / 0–1 Year',
    interview_number: 1,
    interview_name: 'CodeStart Sprint',
    interview_date: '2026-09-02',
    interview_mode: 'Online (Google Meet)',
    interviewer: 'Skilldome Panel',
    interview_type: 'Technical + HR',
    duration_minutes: 42,
    focus_areas: isDinesh ? 'Python Fundamentals, Problem Solving, OOPs, SQL, API Basics & HR Fit' : `${targetRole.split(' ')[0]} Fundamentals, Problem Solving, Core Tools & HR Fit`,
    score_communication: scores.comm,
    score_technical: scores.tech,
    score_problem_solving: scores.prob,
    score_resume_projects: scores.resume,
    score_behavioral: scores.behav,
    score_confidence: scores.conf,
    score_role_knowledge: scores.role,
    total_score: isDinesh ? 61 : calculatedTotal,
    result_level: (isDinesh ? 61 : calculatedTotal) >= 80 ? 'JOB READY' : ((isDinesh ? 61 : calculatedTotal) >= 65 ? 'PROFICIENT' : 'DEVELOPING'),
    evaluation_scores: [
      { area_number: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max_score: 15, given_score: scores.comm, percentage: Math.round((scores.comm / 15) * 100), color: '#8b5cf6', badge_class: 'badge-purple' },
      { area_number: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max_score: 20, given_score: scores.tech, percentage: Math.round((scores.tech / 20) * 100), color: '#2563eb', badge_class: 'badge-blue' },
      { area_number: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max_score: 15, given_score: scores.prob, percentage: Math.round((scores.prob / 15) * 100), color: '#16a34a', badge_class: 'badge-green' },
      { area_number: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max_score: 15, given_score: scores.resume, percentage: Math.round((scores.resume / 15) * 100), color: '#ea580c', badge_class: 'badge-orange' },
      { area_number: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max_score: 10, given_score: scores.behav, percentage: Math.round((scores.behav / 10) * 100), color: '#db2777', badge_class: 'badge-pink' },
      { area_number: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max_score: 10, given_score: scores.conf, percentage: Math.round((scores.conf / 10) * 100), color: '#0891b2', badge_class: 'badge-teal' },
      { area_number: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max_score: 15, given_score: scores.role, percentage: Math.round((scores.role / 15) * 100), color: '#1d4ed8', badge_class: 'badge-navy' }
    ],
    strengths: isDinesh ? [
      'Explained Python concepts (Lists, Dicts, Functions) clearly.',
      'Demonstrated good logical thinking while solving coding problem.',
      'Understood the project requirement and explained it well.',
      'Good attitude and willingness to learn.'
    ] : autoSummary.strengths,
    improvements: isDinesh ? [
      'Answers were sometimes too lengthy and less structured.',
      'Need to strengthen knowledge in REST API and status codes.',
      'Could not optimize the code in the session.',
      'Need more confidence while answering conceptual questions.'
    ] : autoSummary.improvements,
    questions: isDinesh ? [
      'Tell me about yourself.',
      'What are the key features of Python?',
      'Write a program to check if a number is prime.',
      'Explain the difference between List and Tuple.',
      'What is a REST API? How does it work?',
      'Describe a challenge you faced in a project.'
    ] : autoSummary.questions,
    overall_feedback: isDinesh ?
      `Dinesh has a good foundation in Python and logical thinking. He is able to answer direct questions well but needs to work on structured communication, depth in concepts (APIs, OOPs), and code optimization. With consistent practice and focused preparation, he can perform strongly in real interviews.` :
      autoSummary.overall_feedback,
    rating_stars: isDinesh ? 3 : autoSummary.rating_stars,
    action_plan: isDinesh ? [
      'Practice 15 Python coding problems (Easy–Medium).',
      'Revise REST API concepts, HTTP methods & status codes.',
      'Prepare a 2-minute elevator pitch for yourself and projects.',
      'Practice 5 behavioral questions using STAR format.',
      'Improve communication – be concise and structured.'
    ] : autoSummary.action_plan,
    next_interview_name: 'Interview #2 – LogicLeap Challenge',
    next_interview_date: '2026-09-05'
  };

  renderMockInterviewScorecard(blueprintData);
}

function renderMockInterviewScorecard(interview) {
  if (!interview) return;

  // Sidebar elements
  const nameEl = document.getElementById('mockStudentName');
  const avatarImg = document.getElementById('mockAvatarImg');
  const monogramFallback = document.getElementById('mockMonogramFallback');
  const idEl = document.getElementById('mockStudentId');
  const emailEl = document.getElementById('mockEmail');
  const roleEl = document.getElementById('mockTargetRole');
  const expEl = document.getElementById('mockExperienceLevel');
  const dateEl = document.getElementById('mockInterviewDate');
  const modeEl = document.getElementById('mockInterviewMode');
  const interviewerEl = document.getElementById('mockInterviewer');
  const typeEl = document.getElementById('mockInterviewType');
  const durationEl = document.getElementById('mockDuration');
  const footerIdEl = document.getElementById('mockFooterStudentId');

  const fullName = interview.student_name || interview.student_id;
  const isDinesh = interview.student_id === 'SKD-2026-0001' || fullName.toLowerCase().includes('dinesh');

  if (nameEl) nameEl.textContent = fullName.toUpperCase();

  // Set Profile Avatar (Candidate Monogram Initials Badge)
  const mockInitials = getInitials(fullName) || 'SK';
  updateAvatarDisplay('mockStudentPhoto', 'mockMonogram', null, mockInitials);
  const mockInitialsEl = document.getElementById('mockMonogram');
  if (mockInitialsEl) mockInitialsEl.textContent = mockInitials;

  if (idEl) idEl.textContent = interview.student_id;
  if (emailEl) emailEl.textContent = interview.email || `${interview.student_id.toLowerCase()}@email.com`;
  if (roleEl) roleEl.textContent = interview.target_role || 'Python Developer';
  if (expEl) expEl.textContent = interview.experience_level || 'Fresher / 0–1 Year';
  if (dateEl) dateEl.textContent = formatDate(interview.interview_date || '2026-09-02');
  if (modeEl) modeEl.textContent = interview.interview_mode || 'Online (Google Meet)';
  if (interviewerEl) interviewerEl.textContent = interview.interviewer || 'Skilldome Panel';
  if (typeEl) typeEl.textContent = interview.interview_type || 'Technical + HR';
  if (durationEl) durationEl.textContent = `${interview.duration_minutes || 42} Minutes`;
  if (footerIdEl) footerIdEl.textContent = interview.student_id;

  // Header & Number
  const numBadgeEl = document.getElementById('mockInterviewNumber');
  if (numBadgeEl) numBadgeEl.textContent = `${interview.interview_number || 1} / 10`;

  // Row 1: Interview Name & Focus
  const intNameEl = document.getElementById('mockInterviewName');
  const focusEl = document.getElementById('mockFocusAreas');
  if (intNameEl) intNameEl.textContent = `★ ${interview.interview_name || 'CodeStart Sprint'}`;
  if (focusEl) {
    focusEl.innerHTML = `<strong>Focus:</strong> ${interview.focus_areas || 'Python Fundamentals, Problem Solving, OOPs, SQL, API Basics & HR Fit'}`;
  }

  // 1. Get structured evaluation scores directly from Database record
  let evalScores = Array.isArray(interview.evaluation_scores) && interview.evaluation_scores.length > 0
    ? interview.evaluation_scores
    : safeJsonParse(interview.evaluation_scores_json, null);

  // Fallback if not yet populated in DB
  if (!evalScores || evalScores.length === 0) {
    const defaultCriteriaList = [
      { area_number: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max_score: 15, key: 'score_communication', defaultScore: 9, color: '#8b5cf6', badge_class: 'badge-purple' },
      { area_number: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max_score: 20, key: 'score_technical', defaultScore: 14, color: '#2563eb', badge_class: 'badge-blue' },
      { area_number: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max_score: 15, key: 'score_problem_solving', defaultScore: 10, color: '#16a34a', badge_class: 'badge-green' },
      { area_number: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max_score: 15, key: 'score_resume_projects', defaultScore: 8, color: '#ea580c', badge_class: 'badge-orange' },
      { area_number: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max_score: 10, key: 'score_behavioral', defaultScore: 6, color: '#db2777', badge_class: 'badge-pink' },
      { area_number: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max_score: 10, key: 'score_confidence', defaultScore: 6, color: '#0891b2', badge_class: 'badge-teal' },
      { area_number: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max_score: 15, key: 'score_role_knowledge', defaultScore: 8, color: '#1d4ed8', badge_class: 'badge-navy' }
    ];
    evalScores = defaultCriteriaList.map(c => {
      const given = (interview[c.key] !== undefined && interview[c.key] !== null) ? Number(interview[c.key]) : c.defaultScore;
      return {
        area_number: c.area_number,
        area: c.area,
        criteria: c.criteria,
        max_score: c.max_score,
        given_score: given,
        percentage: Math.round((given / c.max_score) * 100),
        color: c.color,
        badge_class: c.badge_class
      };
    });
  }

  let calculatedMaxTotal = 0;
  let calculatedGivenTotal = 0;
  evalScores.forEach(a => {
    calculatedMaxTotal += Number(a.max_score || 0);
    calculatedGivenTotal += Number(a.given_score !== undefined ? a.given_score : (a.score !== undefined ? a.score : 0));
  });

  // Total Score: Strictly match the actual sum of given scores so circular gauge and table breakdown ALWAYS match 100%
  const totalScore = calculatedGivenTotal > 0
    ? calculatedGivenTotal
    : ((interview.total_score !== undefined && interview.total_score !== null) ? Number(interview.total_score) : 0);

  // Row 1: Overall Result Circular Gauge
  const scoreNumEl = document.getElementById('mockOverallScore');
  const levelTitleEl = document.getElementById('mockResultLevel');
  const levelDescEl = document.getElementById('mockResultDesc');
  const gaugeBar = document.getElementById('mockGaugeBar');

  if (scoreNumEl) scoreNumEl.textContent = totalScore;

  let levelColor = '#10b981'; // Green
  let levelTitle = 'JOB READY';
  let levelDesc = `Outstanding performance, ${fullName}! You demonstrate strong conceptual depth and articulate solution design.`;

  if (totalScore < 65) {
    levelColor = '#ea580c'; // Orange / Amber
    levelTitle = 'DEVELOPING';
    levelDesc = `Good start, ${fullName}! You have shown potential. Consistent practice and focused improvement in weak areas will help you perform much better.`;
  } else if (totalScore < 80) {
    levelColor = '#2563eb'; // Blue
    levelTitle = 'PROFICIENT';
    levelDesc = `Solid effort, ${fullName}! You possess good foundational grasp. Polishing system depth will propel you to placement readiness.`;
  }

  if (levelTitleEl) {
    levelTitleEl.textContent = interview.result_level || levelTitle;
    levelTitleEl.style.color = levelColor;
  }
  if (levelDescEl) {
    levelDescEl.textContent = levelDesc;
  }

  // Circular gauge math: 2 * PI * r = 2 * 3.14159 * 42 = 263.89
  if (gaugeBar) {
    const circumference = 263.89;
    const offset = circumference - (Math.min(100, Math.max(0, totalScore)) / 100) * circumference;
    gaugeBar.style.strokeDasharray = `${circumference}`;
    gaugeBar.style.strokeDashoffset = `${offset}`;
    gaugeBar.style.stroke = levelColor;
  }

  // Row 2: Score Breakdown Table (7 Evaluation Criteria from Database)
  const breakdownTbody = document.getElementById('mockScoreBreakdownBody');
  const totalMaxBadge = document.getElementById('mockTotalMaxBadge');
  const totalYourScoreEl = document.getElementById('mockTotalYourScore');
  const totalProgressBar = document.getElementById('mockTotalProgressBar');
  const totalPercentEl = document.getElementById('mockTotalPercent');

  if (breakdownTbody) {
    breakdownTbody.innerHTML = evalScores.map((a, idx) => {
      const num = a.area_number || (idx + 1);
      const maxScore = Number(a.max_score || 0);
      const givenScore = Number(a.given_score !== undefined ? a.given_score : (a.score !== undefined ? a.score : 0));
      const pct = maxScore > 0 ? Math.round((givenScore / maxScore) * 100) : (a.percentage || 0);
      const color = a.color || (['#8b5cf6', '#2563eb', '#16a34a', '#ea580c', '#db2777', '#0891b2', '#1d4ed8'][idx % 7]);
      const badgeClass = a.badge_class || (`badge-${['purple', 'blue', 'green', 'orange', 'pink', 'teal', 'navy'][idx % 7]}`);

      return `
        <tr>
          <td style="text-align: center; vertical-align: middle;">
            <span class="matrix-num-badge ${badgeClass}">${num}</span>
          </td>
          <td>
            <div class="matrix-area-col">
              <span class="matrix-area-name">${a.area || a.name || ''}</span>
              <span class="matrix-area-desc">${a.criteria || a.desc || ''}</span>
            </div>
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <span class="matrix-max-badge">${maxScore}</span>
          </td>
          <td style="text-align: center; vertical-align: middle;">
            <span class="matrix-given-badge">${givenScore}</span>
          </td>
          <td style="vertical-align: middle;">
            <div class="score-matrix-progress-wrap">
              <div class="score-matrix-track">
                <div class="score-matrix-fill" style="width: ${pct}%; background: ${color};"></div>
              </div>
              <span class="score-matrix-pct-label">${pct}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  const finalOverallScore = totalScore;
  const overallPct = calculatedMaxTotal > 0 ? Math.round((finalOverallScore / calculatedMaxTotal) * 100) : finalOverallScore;

  if (totalMaxBadge) totalMaxBadge.textContent = calculatedMaxTotal || 100;
  if (totalYourScoreEl) totalYourScoreEl.textContent = finalOverallScore;
  if (totalProgressBar) totalProgressBar.style.width = `${overallPct}%`;
  if (totalPercentEl) totalPercentEl.textContent = `${overallPct}%`;

  // Row 3: Feedback Lists
  const didWellHeader = document.getElementById('mockDidWellHeader');
  if (didWellHeader) {
    const firstName = fullName.split(' ')[0] || 'CANDIDATE';
    didWellHeader.textContent = `WHAT ${firstName.toUpperCase()} DID WELL`;
  }

  const didWellList = document.getElementById('mockDidWellList');
  const improveList = document.getElementById('mockImproveList');
  const questionsList = document.getElementById('mockQuestionsList');

  const strengths = Array.isArray(interview.strengths) ? interview.strengths : safeJsonParse(interview.strengths_json, []);
  const improvements = Array.isArray(interview.improvements) ? interview.improvements : safeJsonParse(interview.improvements_json, []);
  const questions = Array.isArray(interview.questions) ? interview.questions : safeJsonParse(interview.questions_json, []);

  const defaultStrengths = [
    'Explained Python concepts (Lists, Dicts, Functions) clearly.',
    'Demonstrated good logical thinking while solving coding problem.',
    'Understood the project requirement and explained it well.',
    'Good attitude and willingness to learn.'
  ];

  const defaultImprovements = [
    'Answers were sometimes too lengthy and less structured.',
    'Need to strengthen knowledge in REST API and status codes.',
    'Could not optimize the code in the session.',
    'Need more confidence while answering conceptual questions.'
  ];

  const defaultQuestions = [
    'Tell me about yourself.',
    'What are the key features of Python?',
    'Write a program to check if a number is prime.',
    'Explain the difference between List and Tuple.',
    'What is a REST API? How does it work?',
    'Describe a challenge you faced in a project.'
  ];

  if (didWellList) {
    const items = (strengths && strengths.length > 0) ? strengths : defaultStrengths;
    didWellList.innerHTML = items.map(s => `
      <li>
        <span class="list-item-bullet bullet-green">✔</span>
        <span>${s}</span>
      </li>
    `).join('');
  }

  if (improveList) {
    const items = (improvements && improvements.length > 0) ? improvements : defaultImprovements;
    improveList.innerHTML = items.map(s => `
      <li>
        <span class="list-item-bullet bullet-orange">!</span>
        <span>${s}</span>
      </li>
    `).join('');
  }

  if (questionsList) {
    const items = (questions && questions.length > 0) ? questions : defaultQuestions;
    questionsList.innerHTML = items.map((q, idx) => `
      <li>
        <span class="number-bullet">${idx + 1}</span>
        <span>${q}</span>
      </li>
    `).join('');
  }

  // Row 4: Remarks & Rating
  const overallFeedbackEl = document.getElementById('mockOverallFeedback');
  const ratingStarsEl = document.getElementById('mockRatingStars');
  const ratingVerdictEl = document.getElementById('mockRatingVerdict');

  if (overallFeedbackEl) {
    overallFeedbackEl.textContent = interview.overall_feedback || `${fullName} has a good foundation in Python and logical thinking. He is able to answer direct questions well but needs to work on structured communication, depth in concepts (APIs, OOPs), and code optimization. With consistent practice and focused preparation, he can perform strongly in real interviews.`;
  }

  const starsCount = Math.min(5, Math.max(1, parseInt(interview.rating_stars) || 3));
  if (ratingStarsEl) {
    const filled = '★'.repeat(starsCount);
    const outline = '☆'.repeat(5 - starsCount);
    ratingStarsEl.innerHTML = `<span style="color: #1e40af;">${filled}</span><span style="color: #94a3b8;">${outline}</span>`;
  }

  if (ratingVerdictEl) {
    if (starsCount === 5) ratingVerdictEl.textContent = 'Outstanding! Job Ready.';
    else if (starsCount === 4) ratingVerdictEl.textContent = 'Very Good! Proficient.';
    else if (starsCount === 3) ratingVerdictEl.textContent = 'Good Effort! Keep Improving.';
    else if (starsCount === 2) ratingVerdictEl.textContent = 'Needs Focus & Practice.';
    else ratingVerdictEl.textContent = 'Critical Preparation Needed.';
  }

  // Row 5: Action Plan Checklist
  const actionPlanList = document.getElementById('mockActionPlanList');
  const actionPlan = Array.isArray(interview.action_plan) ? interview.action_plan : safeJsonParse(interview.action_plan_json, []);

  const defaultActionPlan = [
    'Practice 15 Python coding problems (Easy–Medium).',
    'Revise REST API concepts, HTTP methods & status codes.',
    'Prepare a 2-minute elevator pitch for yourself and projects.',
    'Practice 5 behavioral questions using STAR format.',
    'Improve communication – be concise and structured.'
  ];

  if (actionPlanList) {
    const items = (actionPlan && actionPlan.length > 0) ? actionPlan : defaultActionPlan;
    actionPlanList.innerHTML = items.map(a => `
      <li>
        <span class="list-item-bullet bullet-blue">✔</span>
        <span>${a}</span>
      </li>
    `).join('');
  }

  // Row 5: 10-Interview Journey Table
  renderMockJourneyTracker(interview.student_id, interview.interview_number || 1, totalScore);

  // Row 5: Next Interview Box
  const nextNameEl = document.getElementById('mockNextInterviewName');
  const nextDateEl = document.getElementById('mockNextInterviewDate');
  if (nextNameEl) {
    nextNameEl.textContent = interview.next_interview_name || 'Interview #2 – LogicLeap Challenge';
  }
  if (nextDateEl) {
    nextDateEl.textContent = `Scheduled On: ${formatDate(interview.next_interview_date || '2026-09-05')}`;
  }
}

function renderMockJourneyTracker(studentId, currentNum, currentScore) {
  const scoreRow = document.getElementById('journeyScoreRow');
  const levelRow = document.getElementById('journeyLevelRow');
  const journeyTitle = document.getElementById('mockJourneyTitle');

  const fullName = (studentId === 'SKD-2026-0001') ? 'Dinesh' : (
    (state.allStudentsMaster || []).find(s => s.studentId === studentId) ?
      (state.allStudentsMaster || []).find(s => s.studentId === studentId).name : 'Candidate'
  );
  const firstName = fullName.split(' ')[0] || 'CANDIDATE';
  if (journeyTitle) journeyTitle.textContent = `${firstName.toUpperCase()}'S MOCK INTERVIEW JOURNEY`;

  // Map scores across 10 interviews
  const historyMap = {};
  (state.mockInterviewHistory || []).forEach(h => {
    historyMap[h.interview_number] = h;
  });

  if (!historyMap[currentNum]) {
    historyMap[currentNum] = {
      interview_number: currentNum,
      total_score: currentScore,
      result_level: currentScore >= 80 ? 'R' : (currentScore >= 65 ? 'P' : 'D')
    };
  }

  if (scoreRow) {
    let scoreCells = '<td class="row-label">Score (/100)</td>';
    for (let i = 1; i <= 10; i++) {
      if (historyMap[i]) {
        scoreCells += `<td class="cell-highlight-score" style="background: #dcfce7; color: #166534; font-weight: 900;">${historyMap[i].total_score}</td>`;
      } else {
        scoreCells += `<td style="color: #94a3b8; font-weight: 600;">–</td>`;
      }
    }
    scoreRow.innerHTML = scoreCells;
  }

  if (levelRow) {
    let levelCells = '<td class="row-label">Level</td>';
    for (let i = 1; i <= 10; i++) {
      if (historyMap[i]) {
        const sc = historyMap[i].total_score;
        let code = 'D';
        let style = 'background: #ffedd5; color: #9a3412; font-weight: 900;';
        if (sc >= 80) {
          code = 'R';
          style = 'background: #dcfce7; color: #166534; font-weight: 900;';
        } else if (sc >= 65) {
          code = 'P';
          style = 'background: #dbeafe; color: #1e40af; font-weight: 900;';
        }
        levelCells += `<td style="${style}">${code}</td>`;
      } else {
        levelCells += `<td style="color: #94a3b8; font-weight: 600;">–</td>`;
      }
    }
    levelRow.innerHTML = levelCells;
  }
}

// ============================================================================
// Automatic Mock Interview Summary & Insights Generator
// ============================================================================
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

// ============================================================================
// Dedicated Evaluation Input Form Handlers
// ============================================================================
async function loadMockInputFormCandidates(preSelectStudentId) {
  const selectEl = document.getElementById('formStudentSelect');
  if (!selectEl) return;

  if (!state.allStudentsMaster || state.allStudentsMaster.length === 0) {
    try {
      await loadStudentsListDropdown();
    } catch (e) {}
  }

  // Build list of all students (Hostinger MySQL + Dinesh demo)
  let candidates = [];
  const hasDinesh = (state.allStudentsMaster || []).some(s => s.studentId === 'SKD-2026-0001');
  if (!hasDinesh) {
    candidates.push({
      studentId: 'SKD-2026-0001',
      name: 'Dinesh Kumar',
      email: 'dinesh.kumar@email.com',
      department: 'Computer Science',
      college: 'Skilldome Demo',
      interested_domain: 'Python Developer'
    });
  }

  (state.allStudentsMaster || []).forEach(s => candidates.push(s));

  const targetId = preSelectStudentId || state.selectedMockStudentId || (candidates[0] ? candidates[0].studentId : '');

  selectEl.innerHTML = candidates.map(c => `
    <option value="${c.studentId}" ${c.studentId === targetId ? 'selected' : ''}>
      ${c.studentId} — ${c.name} (${c.college || 'Skilldome'})
    </option>
  `).join('');

  // Pre-set dates
  const dateInput = document.getElementById('formInterviewDate');
  const nextDateInput = document.getElementById('formNextInterviewDate');
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  if (dateInput && !dateInput.value) dateInput.value = today;
  if (nextDateInput && !nextDateInput.value) nextDateInput.value = nextWeek;

  onFormCandidateSelect(targetId);
}

function onFormCandidateSelect(studentId) {
  let candidate = (state.allStudentsMaster || []).find(s => s.studentId === studentId);
  if (!candidate && studentId === 'SKD-2026-0001') {
    candidate = {
      studentId: 'SKD-2026-0001',
      name: 'Dinesh Kumar',
      email: 'dinesh.kumar@email.com',
      interested_domain: 'Python Developer'
    };
  }

  const nameInput = document.getElementById('formStudentNameDisplay');
  const emailInput = document.getElementById('formStudentEmailDisplay');
  const roleInput = document.getElementById('formTargetRole');

  if (candidate) {
    if (nameInput) nameInput.value = candidate.name || candidate.studentId;
    if (emailInput) emailInput.value = candidate.email || `${candidate.studentId.toLowerCase()}@email.com`;
    if (roleInput) {
      roleInput.value = candidate.interested_domain || candidate.department || 'Python Developer';
    }
  }

  updateFormAutoSummary(true);
}

function updateFormAutoSummary(force = false) {
  const studentSelect = document.getElementById('formStudentSelect');
  const studentId = studentSelect ? studentSelect.value : '';
  let candidate = (state.allStudentsMaster || []).find(s => s.studentId === studentId);
  const studentName = (document.getElementById('formStudentNameDisplay')?.value || (candidate ? candidate.name : 'Candidate')).trim();
  const targetRole = (document.getElementById('formTargetRole')?.value || (candidate ? (candidate.interested_domain || candidate.department || 'Python Developer') : 'Python Developer')).trim();
  const interviewNumber = parseInt(document.getElementById('formInterviewNumber')?.value) || 1;

  const comm = parseInt(document.getElementById('formScoreComm')?.value) || 0;
  const tech = parseInt(document.getElementById('formScoreTech')?.value) || 0;
  const prob = parseInt(document.getElementById('formScoreProb')?.value) || 0;
  const resume = parseInt(document.getElementById('formScoreResume')?.value) || 0;
  const behav = parseInt(document.getElementById('formScoreBehav')?.value) || 0;
  const conf = parseInt(document.getElementById('formScoreConf')?.value) || 0;
  const role = parseInt(document.getElementById('formScoreRole')?.value) || 0;

  const total = Math.min(100, Math.max(0, comm + tech + prob + resume + behav + conf + role));
  const autoSummary = generateMockInterviewSummary({
    studentName,
    targetRole,
    interviewNum: interviewNumber,
    scores: { comm, tech, prob, resume, behav, conf, role }
  });

  const firstName = (studentName || 'Candidate').split(' ')[0];

  // Update card title
  const didWellTitle = document.getElementById('formDidWellTitle');
  if (didWellTitle) {
    didWellTitle.textContent = `WHAT ${firstName.toUpperCase()} DID WELL`;
  }

  // Populate What Candidate Did Well points (Green circle bullets)
  const didWellList = document.getElementById('formDidWellList');
  if (didWellList) {
    didWellList.innerHTML = autoSummary.strengths.map(s => `
      <li class="point-item-row">
        <span class="point-circle-bullet bullet-green">✔</span>
        <span class="point-text-content" contenteditable="true">${s}</span>
      </li>
    `).join('');
  }

  // Populate Areas to Improve points (Orange circle bullets)
  const improveList = document.getElementById('formImproveList');
  if (improveList) {
    improveList.innerHTML = autoSummary.improvements.map(i => `
      <li class="point-item-row">
        <span class="point-circle-bullet bullet-orange">!</span>
        <span class="point-text-content" contenteditable="true">${i}</span>
      </li>
    `).join('');
  }

  // Populate Top Questions Asked points (Blue circle numbered bullets)
  const questionsList = document.getElementById('formQuestionsList');
  if (questionsList) {
    questionsList.innerHTML = autoSummary.questions.map((q, idx) => `
      <li class="point-item-row">
        <span class="point-circle-bullet bullet-blue">${idx + 1}</span>
        <span class="point-text-content" contenteditable="true">${q}</span>
      </li>
    `).join('');
  }

  // Populate Overall Feedback narrative text
  const feedbackEl = document.getElementById('formOverallFeedbackText');
  if (feedbackEl) {
    feedbackEl.textContent = autoSummary.overall_feedback;
  }

  // Populate Rating
  const ratingEl = document.getElementById('formRating');
  if (ratingEl) {
    ratingEl.value = autoSummary.rating_stars;
  }

  // Populate Action Plan items
  const actionPlanList = document.getElementById('formActionPlanList');
  if (actionPlanList) {
    actionPlanList.innerHTML = autoSummary.action_plan.map(a => `
      <li class="point-item-row">
        <span class="point-circle-bullet bullet-blue">✔</span>
        <span class="point-text-content" contenteditable="true">${a}</span>
      </li>
    `).join('');
  }

  // Next Challenge Name
  const nextNameEl = document.getElementById('formNextInterviewName');
  if (nextNameEl && (force || !nextNameEl.value)) {
    nextNameEl.value = autoSummary.next_interview_name;
  }

  // Update live status bar
  const statusEl = document.getElementById('autoSummaryStatusText');
  if (statusEl) {
    let tier = total >= 80 ? 'JOB READY' : (total >= 65 ? 'PROFICIENT' : 'DEVELOPING');
    statusEl.textContent = `Auto-generated points for ${firstName} (${targetRole}) based on marks (${total}/100 • ${tier})`;
  }
}

function triggerRegenerateSummary() {
  updateFormAutoSummary(true);
  const btn = document.querySelector('.btn-regenerate-summary');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span>✔</span> <span>Summary Generated!</span>';
    btn.style.background = '#10b981';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 1200);
  }
}

function calcFormMockTotal() {
  const comm = parseInt(document.getElementById('formScoreComm')?.value) || 0;
  const tech = parseInt(document.getElementById('formScoreTech')?.value) || 0;
  const prob = parseInt(document.getElementById('formScoreProb')?.value) || 0;
  const resume = parseInt(document.getElementById('formScoreResume')?.value) || 0;
  const behav = parseInt(document.getElementById('formScoreBehav')?.value) || 0;
  const conf = parseInt(document.getElementById('formScoreConf')?.value) || 0;
  const role = parseInt(document.getElementById('formScoreRole')?.value) || 0;

  // Update live row percentages and progress bars
  updateRowPercent('formScoreComm', 15, 'commPercentBar', 'commPercentText');
  updateRowPercent('formScoreTech', 20, 'techPercentBar', 'techPercentText');
  updateRowPercent('formScoreProb', 15, 'probPercentBar', 'probPercentText');
  updateRowPercent('formScoreResume', 15, 'resumePercentBar', 'resumePercentText');
  updateRowPercent('formScoreBehav', 10, 'behavPercentBar', 'behavPercentText');
  updateRowPercent('formScoreConf', 10, 'confPercentBar', 'confPercentText');
  updateRowPercent('formScoreRole', 15, 'rolePercentBar', 'rolePercentText');

  const total = Math.min(100, Math.max(0, comm + tech + prob + resume + behav + conf + role));
  const totalEl = document.getElementById('liveFormTotalScore');
  const badgeEl = document.getElementById('liveFormLevelBadge');
  const rowScore = document.getElementById('formTotalRowScore');
  const rowPercent = document.getElementById('formTotalRowPercent');
  const rowBar = document.getElementById('formTotalRowBar');

  if (totalEl) totalEl.textContent = total;
  if (rowScore) rowScore.textContent = total;
  if (rowPercent) rowPercent.textContent = `${total}%`;
  if (rowBar) rowBar.style.width = `${total}%`;

  if (badgeEl) {
    if (total >= 80) {
      badgeEl.textContent = 'JOB READY';
      badgeEl.className = 'live-level-badge badge-jobready';
    } else if (total >= 65) {
      badgeEl.textContent = 'PROFICIENT';
      badgeEl.className = 'live-level-badge badge-proficient';
    } else {
      badgeEl.textContent = 'DEVELOPING';
      badgeEl.className = 'live-level-badge badge-developing';
    }
  }

  // Update live generated summary in Section 3
  updateFormAutoSummary(false);
}

function updateRowPercent(inputId, maxScore, barId, textId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  const val = Math.min(maxScore, Math.max(0, parseInt(inputEl.value) || 0));
  const pct = Math.round((val / maxScore) * 100);
  const bar = document.getElementById(barId);
  const txt = document.getElementById(textId);
  if (bar) bar.style.width = `${pct}%`;
  if (txt) txt.textContent = `${pct}%`;
}

async function handleSaveMockInterview(e) {
  e.preventDefault();

  const studentSelect = document.getElementById('formStudentSelect');
  const studentId = studentSelect ? studentSelect.value : '';
  if (!studentId) {
    alert('Please select a student from the dropdown.');
    return;
  }

  const interviewNumber = parseInt(document.getElementById('formInterviewNumber').value) || 1;
  const interviewName = (document.getElementById('formInterviewName').value || 'CodeStart Sprint').trim();
  const targetRole = (document.getElementById('formTargetRole').value || 'Python Developer').trim();
  const expLevel = document.getElementById('formExperienceLevel').value;
  const interviewDate = document.getElementById('formInterviewDate').value || new Date().toISOString().split('T')[0];
  const interviewMode = document.getElementById('formInterviewMode').value;
  const interviewer = (document.getElementById('formInterviewer').value || 'Skilldome Panel').trim();
  const interviewType = document.getElementById('formInterviewType').value;
  const duration = parseInt(document.getElementById('formDuration').value) || 42;
  const focusAreas = (document.getElementById('formFocusAreas').value || 'Python Fundamentals & Problem Solving').trim();

  // Scores
  const comm = parseInt(document.getElementById('formScoreComm').value) || 0;
  const tech = parseInt(document.getElementById('formScoreTech').value) || 0;
  const prob = parseInt(document.getElementById('formScoreProb').value) || 0;
  const resume = parseInt(document.getElementById('formScoreResume').value) || 0;
  const behav = parseInt(document.getElementById('formScoreBehav').value) || 0;
  const conf = parseInt(document.getElementById('formScoreConf').value) || 0;
  const role = parseInt(document.getElementById('formScoreRole').value) || 0;

  // Candidate and session details
  const studentName = (document.getElementById('formStudentNameDisplay')?.value || '').trim();
  const studentEmail = (document.getElementById('formStudentEmailDisplay')?.value || '').trim();

  // Auto-generate comprehensive summary as fallback
  const autoSummary = generateMockInterviewSummary({
    studentName,
    targetRole,
    interviewNum: interviewNumber,
    scores: { comm, tech, prob, resume, behav, conf, role }
  });

  // Read the generated (or evaluator-edited) points from Section 3
  const strengthsInput = Array.from(document.querySelectorAll('#formDidWellList .point-text-content'))
    .map(el => el.textContent.trim()).filter(Boolean);
  const improvementsInput = Array.from(document.querySelectorAll('#formImproveList .point-text-content'))
    .map(el => el.textContent.trim()).filter(Boolean);
  const questionsInput = Array.from(document.querySelectorAll('#formQuestionsList .point-text-content'))
    .map(el => el.textContent.trim()).filter(Boolean);
  const actionPlanInput = Array.from(document.querySelectorAll('#formActionPlanList .point-text-content'))
    .map(el => el.textContent.trim()).filter(Boolean);
  const feedbackInput = (document.getElementById('formOverallFeedbackText')?.textContent || '').trim();
  const ratingStarsInput = parseInt(document.getElementById('formRating')?.value) || autoSummary.rating_stars;

  const nextInterviewName = (document.getElementById('formNextInterviewName')?.value || '').trim() || autoSummary.next_interview_name;
  const nextInterviewDate = document.getElementById('formNextInterviewDate')?.value || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  const payload = {
    student_id: studentId,
    student_name: studentName,
    email: studentEmail,
    interview_number: interviewNumber,
    interview_name: interviewName,
    target_role: targetRole,
    experience_level: expLevel,
    interview_date: interviewDate,
    interview_mode: interviewMode,
    interviewer: interviewer,
    interview_type: interviewType,
    duration_minutes: duration,
    focus_areas: focusAreas,

    score_communication: comm,
    score_technical: tech,
    score_problem_solving: prob,
    score_resume_projects: resume,
    score_behavioral: behav,
    score_confidence: conf,
    score_role_knowledge: role,
    total_score: comm + tech + prob + resume + behav + conf + role,

    evaluation_scores: [
      { area_number: 1, area: 'Communication & Clarity', criteria: 'Expressing thoughts clearly, structured articulation', max_score: 15, given_score: comm, percentage: Math.round((comm / 15) * 100), color: '#8b5cf6', badge_class: 'badge-purple' },
      { area_number: 2, area: 'Technical Knowledge', criteria: 'Concepts, accuracy, syntax and technical depth', max_score: 20, given_score: tech, percentage: Math.round((tech / 20) * 100), color: '#2563eb', badge_class: 'badge-blue' },
      { area_number: 3, area: 'Problem Solving', criteria: 'Approach, logical thinking, edge case handling', max_score: 15, given_score: prob, percentage: Math.round((prob / 15) * 100), color: '#16a34a', badge_class: 'badge-green' },
      { area_number: 4, area: 'Understanding of Resume / Projects', criteria: 'Explaining projects, tech stack used, challenges faced', max_score: 15, given_score: resume, percentage: Math.round((resume / 15) * 100), color: '#ea580c', badge_class: 'badge-orange' },
      { area_number: 5, area: 'Behavioral / HR Responses', criteria: 'Situational questions, culture fit, attitude, ethics', max_score: 10, given_score: behav, percentage: Math.round((behav / 10) * 100), color: '#db2777', badge_class: 'badge-pink' },
      { area_number: 6, area: 'Confidence & Professionalism', criteria: 'Demeanor, composure under pressure, professional attitude', max_score: 10, given_score: conf, percentage: Math.round((conf / 10) * 100), color: '#0891b2', badge_class: 'badge-teal' },
      { area_number: 7, area: 'Role-specific Knowledge', criteria: 'Domain standards, tools, industry awareness', max_score: 15, given_score: role, percentage: Math.round((role / 15) * 100), color: '#1d4ed8', badge_class: 'badge-navy' }
    ],

    strengths: strengthsInput.length > 0 ? strengthsInput : autoSummary.strengths,
    improvements: improvementsInput.length > 0 ? improvementsInput : autoSummary.improvements,
    questions: questionsInput.length > 0 ? questionsInput : autoSummary.questions,
    overall_feedback: feedbackInput || autoSummary.overall_feedback,
    rating_stars: ratingStarsInput,
    action_plan: actionPlanInput.length > 0 ? actionPlanInput : autoSummary.action_plan,
    next_interview_name: nextInterviewName,
    next_interview_date: nextInterviewDate
  };

  const btn = document.getElementById('btnSubmitMockForm');
  if (btn) btn.disabled = true;

  try {
    showLoading(true);
    const res = await apiRequest('/api/mock-interviews', 'POST', payload);
    if (res && res.success) {
      state.selectedMockStudentId = studentId;
      await openMockScorecardDashboard(studentId, res.id);
    } else {
      alert('Could not save mock interview: ' + (res.error || 'Server error'));
    }
  } catch (err) {
    alert('Failed to save mock interview: ' + err.message);
  } finally {
    showLoading(false);
    if (btn) btn.disabled = false;
  }
}

// ============================================================================
// Feature: Career Roadmap View (10-15 Year Progression)
// Matches Reference Design in Image 2
// ============================================================================
let careerRoadmapsData = null;

async function loadCareerRoadmaps() {
  if (careerRoadmapsData) return careerRoadmapsData;
  try {
    const res = await apiRequest('/api/career-roadmaps');
    if (res && res.success && res.data) {
      careerRoadmapsData = res.data;
      return careerRoadmapsData;
    }
  } catch (err) {
    console.warn('API /api/career-roadmaps failed, trying static /career_roadmaps.json:', err);
  }
  try {
    const res = await fetch('/career_roadmaps.json');
    careerRoadmapsData = await res.json();
    return careerRoadmapsData;
  } catch (err) {
    console.error('Failed to load career_roadmaps.json:', err);
    return null;
  }
}

async function openCareerRoadmap(domainName) {
  state.currentSection = 'careerRoadmap';
  state.currentView = 'careerRoadmap';

  const allViews = [
    'viewPortalHome', 'viewMockHub', 'viewOverview',
    'viewScorecard', 'viewMockInputForm', 'viewMockInterview', 'viewCareerRoadmap'
  ];
  allViews.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('active-view');
    }
  });

  const crmView = document.getElementById('viewCareerRoadmap');
  if (crmView) {
    crmView.classList.remove('hidden');
    crmView.classList.add('active-view');
  }

  // Header controls
  const returnBtn = document.getElementById('btnPortalHomeReturn');
  if (returnBtn) returnBtn.classList.remove('hidden');

  const assessTabs = document.getElementById('assessmentNavTabs');
  if (assessTabs) assessTabs.classList.add('hidden');

  const mockTabs = document.getElementById('mockNavTabs');
  if (mockTabs) mockTabs.classList.add('hidden');

  const filterToolbar = document.getElementById('assessmentFilterToolbar');
  if (filterToolbar) filterToolbar.classList.add('hidden');

  // Load roadmaps data
  const lib = await loadCareerRoadmaps();
  if (!lib) {
    alert('Career Roadmap data is currently unavailable.');
    return;
  }

  // Resolve Student Info
  let student = (state.currentStudentData && state.currentStudentData.student) ? state.currentStudentData.student : null;
  let readinessScore = (state.currentStudentData && state.currentStudentData.readiness && state.currentStudentData.readiness.score) || 68;

  if (!student) {
    // Check if Dinesh is in allStudentsMaster
    const dinesh = (state.allStudentsMaster || []).find(s => s.name && s.name.toLowerCase().includes('dinesh'));
    if (dinesh) {
      student = {
        name: dinesh.name,
        studentId: dinesh.studentId,
        email: dinesh.email || 'dinesh.kumar@email.com',
        degree: dinesh.degree || 'B.E. Computer Science and Engineering',
        college: dinesh.college || 'ABC Engineering College',
        batch: dinesh.batch || '2026',
        targetCareer: dinesh.interested_domain || 'Python Developer'
      };
    } else {
      student = {
        name: 'DINESH',
        studentId: 'SKD-2026-0001',
        email: 'dinesh.kumar@email.com',
        degree: 'B.E. Computer Science and Engineering',
        college: 'ABC Engineering College',
        batch: '2026',
        targetCareer: 'Python Developer'
      };
    }
  }

  // Determine requested domain
  let targetDomain = domainName;
  if (!targetDomain) {
    if (student && student.name && student.name.toLowerCase().includes('harshini')) {
      targetDomain = 'Human Resources';
    } else {
      targetDomain = student.targetCareer || 'Python Development';
    }
  }

  // Match domain in library
  const normalizedKey = targetDomain.trim().toLowerCase();
  let matchedKey = lib.domainAliases[normalizedKey] || Object.keys(lib.roadmaps).find(k => k.toLowerCase() === normalizedKey);
  
  if (!matchedKey) {
    for (const key of Object.keys(lib.roadmaps)) {
      if (normalizedKey.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedKey)) {
        matchedKey = key;
        break;
      }
    }
  }

  if (!matchedKey) {
    matchedKey = 'Python Development';
  }

  renderCareerRoadmapView(lib.roadmaps[matchedKey], student, readinessScore);
}

function renderCareerRoadmapView(roadmap, student, readinessScore) {
  if (!roadmap) return;

  // Dropdown selector sync
  const select = document.getElementById('crmDomainSelect');
  if (select) {
    let opt = Array.from(select.options).find(o => o.value === roadmap.domainKey);
    if (!opt) {
      opt = document.createElement('option');
      opt.value = roadmap.domainKey;
      opt.textContent = roadmap.domainKey;
      select.appendChild(opt);
    }
    select.value = roadmap.domainKey;
  }

  // Breadcrumb
  const breadcrumb = document.getElementById('crmBreadcrumbTitle');
  if (breadcrumb) breadcrumb.textContent = `${roadmap.domainKey} Roadmap`;

  // Headers
  const pathTitle = document.getElementById('crmPathTitle');
  if (pathTitle) pathTitle.textContent = roadmap.title;

  const journeySub = document.getElementById('crmPathSubtitle');
  if (journeySub) journeySub.textContent = roadmap.subtitle;

  const banner = document.getElementById('crmTimelineBanner');
  if (banner) banner.textContent = roadmap.tableHeader;

  // Student Profile Sidebar
  const nameEl = document.getElementById('crmCandidateName');
  if (nameEl) nameEl.textContent = (student.name || 'DINESH').toUpperCase();

  const emailEl = document.getElementById('crmCandidateEmail');
  if (emailEl) emailEl.textContent = student.email || 'dinesh.kumar@email.com';

  const dateEl = document.getElementById('crmReportDate');
  if (dateEl) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    dateEl.textContent = student.assessmentDate || formattedDate;
  }

  const degreeEl = document.getElementById('crmCandidateDegree');
  if (degreeEl) degreeEl.textContent = student.degree || 'B.E. Computer Science and Engineering';

  const collegeEl = document.getElementById('crmCandidateCollege');
  if (collegeEl) collegeEl.textContent = student.college || 'ABC Engineering College';

  const batchEl = document.getElementById('crmGraduationYear');
  if (batchEl) batchEl.textContent = student.batch || student.graduationYear || '2026';

  const targetEl = document.getElementById('crmTargetCareer');
  if (targetEl) {
    if (student && student.name && student.name.toLowerCase().includes('harshini')) {
      targetEl.textContent = student.targetCareer || 'Recruiter';
    } else {
      targetEl.textContent = student.targetCareer || roadmap.defaultTargetCareer || roadmap.domainKey;
    }
  }

  const scoreEl = document.getElementById('crmReadinessScore');
  if (scoreEl) scoreEl.textContent = readinessScore || 68;

  // Profile Avatar (Candidate Photo with Monogram Fallback)
  const rawName = student.name ? student.name.trim() : 'SANJEEVI K';
  const parts = rawName.split(/\s+/).filter(Boolean);
  let initials = 'SK';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1) {
    initials = parts[0].substring(0, 2).toUpperCase();
  }
  updateAvatarDisplay('crmStudentPhoto', 'crmAvatarInitials', null, initials);
  const crmInitialsEl = document.getElementById('crmAvatarInitials');
  if (crmInitialsEl) crmInitialsEl.textContent = initials;


  // Populate Timeline Table
  const tbody = document.getElementById('crmTimelineBody');
  if (tbody) {
    tbody.innerHTML = roadmap.timeline.map(stage => `
      <tr>
        <td>
          <div class="crm-stage-wrap">
            <div class="crm-stage-badge stage-badge-${stage.stageNum}">${stage.stageNum}</div>
            <div class="crm-stage-name">${stage.stageName}</div>
          </div>
        </td>
        <td class="crm-exp-cell">
          ${stage.experience}
        </td>
        <td class="crm-designation-cell">
          ${stage.designation}
        </td>
        <td>
          <ul class="crm-focus-list">
            ${stage.focusAreas.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </td>
        <td class="crm-package-cell">
          ${stage.package}
        </td>
        <td class="crm-nextstep-cell">
          ${stage.potentialNextStep}
        </td>
      </tr>
    `).join('');
  }

  // Populate Skills Grid
  const skillsGrid = document.getElementById('crmSkillsGrid');
  if (skillsGrid) {
    skillsGrid.innerHTML = roadmap.skills.map(s => `
      <div class="crm-skill-item">
        <span class="crm-skill-icon">${s.icon}</span>
        <span>${s.name}</span>
      </div>
    `).join('');
  }

  // Scroll to top of document
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeRoadmapDomain(domainKey) {
  if (careerRoadmapsData && careerRoadmapsData.roadmaps && careerRoadmapsData.roadmaps[domainKey]) {
    let student = (state.currentStudentData && state.currentStudentData.student) || { name: 'DINESH' };
    let score = (state.currentStudentData && state.currentStudentData.readiness && state.currentStudentData.readiness.score) || 68;
    renderCareerRoadmapView(careerRoadmapsData.roadmaps[domainKey], student, score);
  } else {
    openCareerRoadmap(domainKey);
  }
}

function returnToScorecard() {
  openAssessmentModule('scorecard');
}

// ============================================================================
// Startup Trigger
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  checkAuthSession();
});

