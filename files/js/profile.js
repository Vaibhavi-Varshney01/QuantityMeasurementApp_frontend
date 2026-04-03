/* ═══════════════════════════════════════════════════════
   QUANTIMEASURE — profile.js
   My Profile section: info, stats breakdown, activity
═══════════════════════════════════════════════════════ */

async function loadProfile() {
  const user    = getUser();
  const name    = user?.username || 'User';
  const role    = user?.role     || 'User';
  const initial = name.charAt(0).toUpperCase();

  /* Set name / role / initial */
  setEl('profileName', name);
  setEl('profileRole', role);
  setEl('infoUsername', name);
  setEl('infoRole', role);
  const pa = document.getElementById('profileAvatar');
  if (pa) pa.textContent = initial;

  /* Load stats and activity in parallel */
  await Promise.allSettled([loadProfileStats(), loadRecentActivity()]);

  /* Update connection indicator */
  checkConn();
}

async function loadProfileStats() {
  const ops  = ['COMPARE', 'ADD', 'SUBTRACT', 'DIVIDE', 'CONVERT'];
  const ids  = ['pCompares', 'pAdd', 'pSub', 'pDiv', 'pConverts'];
  let total  = 0;
  let maxOp  = '';
  let maxVal = 0;

  const res = await Promise.allSettled(ops.map(op => apiClient.get(ENDPOINTS.count(op))));
  res.forEach((r, i) => {
    const n = r.status === 'fulfilled' ? (r.value?.data ?? 0) : 0;
    total += n;
    setEl(ids[i], n);
    if (n > maxVal) { maxVal = n; maxOp = ops[i]; }
  });

  setEl('pTotalOps', total);
  setEl('pMostUsed', maxOp || '—');

  try {
    const er = await apiClient.get(ENDPOINTS.errored);
    setEl('pErrors', Array.isArray(er.data) ? er.data.length : 0);
  } catch {
    setEl('pErrors', '—');
  }
}

async function loadRecentActivity() {
  const ul = document.getElementById('recentActivity');
  if (!ul) return;
  ul.innerHTML = '<li class="h-item" style="color:var(--text3);padding:.5rem 0">Loading…</li>';

  try {
    const r    = await apiClient.get(ENDPOINTS.histOp(''));
    const rows = Array.isArray(r.data) ? r.data.slice(0, 6) : [];

    if (!rows.length) {
      ul.innerHTML = '<li class="h-item" style="color:var(--text3);padding:.5rem 0">No activity yet — use the Converter to get started!</li>';
      return;
    }

    const opColors = { COMPARE: '#3b82f6', ADD: '#22c55e', SUBTRACT: '#8b5cf6', DIVIDE: '#f59e0b', CONVERT: '#60a5fa', ERROR: '#f87171' };
    const opIcons  = { COMPARE: 'fas fa-equals', ADD: 'fas fa-plus', SUBTRACT: 'fas fa-minus', DIVIDE: 'fas fa-divide', CONVERT: 'fas fa-exchange-alt', ERROR: 'fas fa-circle-exclamation' };

    ul.innerHTML = rows.map((row, i) => {
      const op  = (row.operation || 'COMPARE').toUpperCase();
      const col = opColors[op] || '#3b82f6';
      const ico = opIcons[op]  || 'fas fa-calculator';
      return `<li class="act-item">
        <div class="act-icon" style="background:${col}18;border:1px solid ${col}30;color:${col}">
          <i class="${ico}"></i>
        </div>
        <div>
          <div class="act-text"><strong>${op}</strong> — ${row.thisValue ?? '?'} ${row.thisUnit || ''} → ${row.thatValue ?? ''} ${row.thatUnit || ''}</div>
          <div style="font-size:.72rem;color:var(--text3)">${row.thisMeasurementType || '—'} • Result: ${row.resultString || (row.resultValue !== undefined ? row.resultValue.toFixed(3) : '—')} ${row.resultUnit || ''}</div>
        </div>
        <span class="act-time">#${i + 1}</span>
      </li>`;
    }).join('');
  } catch {
    ul.innerHTML = '<li class="h-item" style="color:var(--text3);padding:.5rem 0">Could not load activity.</li>';
  }
}
