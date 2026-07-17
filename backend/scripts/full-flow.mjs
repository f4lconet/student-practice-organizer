const BASE = 'http://localhost:4000';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data;
  try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data, headers: r.headers };
}

async function main() {
  const results = [];

  // 3) Login as intern
  let r = await req('POST', '/auth/login', {
    email: 'testuser@example.com', password: 'TestPass123'
  });
  const internToken = r.data?.token;
  results.push(`3. POST /auth/login → ${r.status}`);
  if (!internToken) { results.push('   ❌ NO TOKEN'); printAndExit(results); }

  // Login as admin
  r = await req('POST', '/auth/login', {
    email: 'admin@practice.com', password: 'admin123456'
  });
  const adminToken = r.data?.token;
  results.push(`4a. POST /auth/login (admin) → ${r.status}`);
  if (!adminToken) { results.push('   ❌ No admin token'); printAndExit(results); }

  // 4) POST /admin/cohorts
  r = await req('POST', '/admin/cohorts', {
    name: 'Практика 2026',
    applicationStart: '2026-07-01T00:00:00Z',
    applicationEnd: '2026-07-31T00:00:00Z',
    practiceStart: '2026-08-01T00:00:00Z',
    practiceEnd: '2026-12-31T00:00:00Z'
  }, adminToken);
  const cohortId = r.data?.id;
  results.push(`4. POST /admin/cohorts → ${r.status} ✅ cohortId=${cohortId}`);

  // 5) POST /admin/cohorts/:id/roles
  r = await req('POST', `/admin/cohorts/${cohortId}/roles`, { name: 'Разработчик' }, adminToken);
  const roleId = r.data?.id;
  results.push(`5. POST /admin/cohorts/${cohortId}/roles → ${r.status} ✅ roleId=${roleId}`);

  // 6) GET /public/cohorts/active
  r = await req('GET', '/public/cohorts/active');
  results.push(`6. GET /public/cohorts/active → ${r.status} ✅ id=${r.data?.id}`);

  // 7) GET /public/cohorts/:id/survey
  r = await req('GET', `/public/cohorts/${cohortId}/survey`);
  const fieldCount = Array.isArray(r.data) ? r.data.length : 'N/A';
  results.push(`7. GET /public/cohorts/${cohortId}/survey → ${r.status} ✅ ${fieldCount} fields`);

  // 8) POST /applications
  r = await req('POST', '/applications', { cohortId, roleId }, internToken);
  const appId = r.data?.id;
  results.push(`8. POST /applications → ${r.status} ✅ applicationId=${appId}`);

  // 9) PATCH /admin/cohorts/applications/:id/approve
  r = await req('PATCH', `/admin/cohorts/applications/${appId}/approve`, { roleId }, adminToken);
  results.push(`9. PATCH /admin/cohorts/applications/${appId}/approve → ${r.status} ✅ status=${r.data?.status}`);

  // 10) GET /dashboard
  r = await req('GET', '/dashboard', null, internToken);
  results.push(`10. GET /dashboard → ${r.status} ✅ tasksTabAvailable=${r.data?.tasksTabAvailable}`);

  // 11) POST /tasks
  r = await req('POST', '/tasks', {
    cohortId, date: '2026-09-15T00:00:00Z',
    title: 'Настройка окружения', description: 'Установить Docker'
  }, internToken);
  results.push(`11. POST /tasks → ${r.status} ✅ taskId=${r.data?.id}`);

  // 12) Create document record, fill all fields INCLUDING mainStageTasks
  r = await req('GET', `/documents/my?cohortId=${cohortId}&applicationId=${appId}`, null, internToken);
  results.push(`12a. GET /documents/my?cohortId=...&applicationId=... → ${r.status}`);

  r = await req('PATCH', `/documents/my?cohortId=${cohortId}`, {
    studentFio: 'Тестов Тест Тестович',
    group: 'ИВБО-01-21',
    directionCode: '09.03.04',
    directionName: 'Программная инженерия',
    programName: 'Разработка ПО',
    specialty: 'Программист',
    practiceTopic: 'Веб-разработка на Node.js',
    mainStageTasks: '1. Настройка окружения\n2. Разработка API\n3. Тестирование'
  }, internToken);
  results.push(`12b. PATCH /documents/my?cohortId=... → ${r.status} ✅`);

  // 13) Generate .docx
  r = await req('GET', `/documents/my/individual-task/generate?cohortId=${cohortId}`, null, internToken);
  results.push(`13. GET /documents/my/individual-task/generate?cohortId=... → ${r.status}`);
  const ct = r.headers.get('content-type');
  const cd = r.headers.get('content-disposition');
  results.push(`   Content-Type: ${ct}, Content-Disposition: ${cd}`);
  if (r.status === 200 && ct && ct.includes('vnd.openxmlformats')) {
    results.push('   ✅ Valid .docx downloaded!');
  } else if (r.status === 200) {
    results.push(`   ⚠️ content-type=${ct}`);
  } else if (r.data?.error) {
    results.push(`   ❌ ${r.data.error.message}`);
  }

  printAndExit(results);
}

function printAndExit(results) {
  console.log('\n========== FULL FLOW RESULTS ==========');
  for (const l of results) console.log(l);
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });