/* ═══════════════════════════════════════════════════════
   QUANTIMEASURE — dashboard.js
   Navigation, stats, recent records
═══════════════════════════════════════════════════════ */

/* ── Navigation ── */
function go(name, el) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('sec-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nl, .sb-menu a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');

  /* Lazy-load section data */
  if (name === 'dashboard') loadDashboard();
  if (name === 'history')   loadHistory();
  if (name === 'errors')    loadErrors();
  if (name === 'converter') loadStats();
  if (name === 'profile')   loadProfile();
}

/* ── Logout ── */
function logout() {
  clearSession();
  window.location.href = 'auth.html';
}

/* ── Dashboard ── */
async function loadDashboard() {
  await Promise.allSettled([loadStats(), loadRecentRecords()]);
}

/* ── Stats ── */
async function loadStats() {
  const ops  = ['COMPARE', 'ADD', 'SUBTRACT', 'DIVIDE', 'CONVERT'];
  const sIds = ['sC', 'sA', 'sSub', 'sD', 'sCv'];
  let total  = 0;

  const res = await Promise.allSettled(ops.map(op => apiClient.get(ENDPOINTS.count(op))));

  res.forEach((r, i) => {
    const n = r.status === 'fulfilled' ? (r.value?.data ?? 0) : 0;
    total += n;
    setEl(sIds[i], n);
  });

  setEl('statTotal',   total);
  setEl('statCompare', res[0].status === 'fulfilled' ? (res[0].value?.data ?? '—') : '—');
  setEl('statAdd',     res[1].status === 'fulfilled' ? (res[1].value?.data ?? '—') : '—');

  try {
    const er = await apiClient.get(ENDPOINTS.errored);
    setEl('statErrors', Array.isArray(er.data) ? er.data.length : 0);
  } catch {
    setEl('statErrors', '—');
  }
}

function setEl(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

/* ── Recent records ── */
async function loadRecentRecords() {
  const tb = document.getElementById('recentBody');
  if (!tb) return;
  try {
    /* Try empty op (all records) first; fall back to COMPARE */
    let rows = [];
    try {
      const r = await apiClient.get(ENDPOINTS.histOp(''));
      rows = Array.isArray(r.data) ? r.data.slice(0, 8) : [];
    } catch {
      const r = await apiClient.get(ENDPOINTS.histOp('COMPARE'));
      rows = Array.isArray(r.data) ? r.data.slice(0, 8) : [];
    }
    renderTbody(tb, rows, 6);
    renderSideHist(rows);
  } catch {
    tb.innerHTML = '<tr><td colspan="6" class="ec">No data — backend may be offline.</td></tr>';
  }
}

/* ── Sidebar recent history ── */
function renderSideHist(rows) {
  const ul = document.getElementById('sideHist');
  if (!ul) return;
  if (!rows.length) {
    ul.innerHTML = '<li class="h-item" style="color:var(--text3)">No records yet</li>';
    return;
  }
  ul.innerHTML = rows.slice(0, 5).map(r => `
    <li class="h-item">
      <span class="h-type">${r.operation || '—'}</span>
      <span class="h-text">${r.thisValue ?? ''} ${r.thisUnit || ''} → ${r.resultString || r.resultValue ?? '—'} ${r.resultUnit || ''}</span>
    </li>`).join('');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  if (!isAuth()) { window.location.href = 'auth.html'; return; }

  const user    = getUser();
  const name    = user?.username || 'User';
  const initial = name.charAt(0).toUpperCase();

  ['userName', 'userDisplay'].forEach(id => setEl(id, name));
  const av = document.getElementById('avatarInitial');
  if (av) av.textContent = initial;

  initParticles();
  updateUnits();
  checkConn();
  setTimeout(() => { loadDashboard().catch(() => {}); }, 150);
});
