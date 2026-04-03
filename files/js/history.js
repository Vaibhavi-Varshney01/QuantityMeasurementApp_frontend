/* ═══════════════════════════════════════════════════════
   QUANTIMEASURE — history.js
   History table, filters, CSV export, error logs
═══════════════════════════════════════════════════════ */

/* ── Load history ── */
async function loadHistory() {
  const tb = document.getElementById('histBody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="6" class="ec">Loading…</td></tr>';

  const op   = document.getElementById('hOpFilter')?.value   || '';
  const type = document.getElementById('hTypeFilter')?.value || '';

  try {
    let r;
    if (type)    r = await apiClient.get(ENDPOINTS.histType(type));
    else if (op) r = await apiClient.get(ENDPOINTS.histOp(op));
    else         r = await apiClient.get(ENDPOINTS.histOp(''));
    renderTbody(tb, Array.isArray(r.data) ? r.data : [], 6);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="6" class="ec">Error: ${errMsg(e)}</td></tr>`;
  }
}

/* ── Export history as CSV ── */
function exportHistory() {
  const tb = document.getElementById('histBody');
  if (!tb) return;
  const rows = [...tb.querySelectorAll('tr')];
  if (!rows.length) { showToast('No data to export', 'error'); return; }

  const headers = 'Operation,Type,Input1,Input2,Result,Status\n';
  const csv = rows
    .map(r => [...r.querySelectorAll('td')].map(td => td.textContent.trim()).join(','))
    .join('\n');

  const blob = new Blob([headers + csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'quantimeasure-history.csv';
  a.click();
  showToast('History exported!', 'success');
}

/* ── Load error logs ── */
async function loadErrors() {
  const tb = document.getElementById('errBody');
  if (!tb) return;
  tb.innerHTML = '<tr><td colspan="3" class="ec">Loading…</td></tr>';

  try {
    const r    = await apiClient.get(ENDPOINTS.errored);
    const rows = Array.isArray(r.data) ? r.data : [];
    if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="3" class="ec">✅ No errors logged.</td></tr>';
      return;
    }
    tb.innerHTML = rows.map(r => `<tr>
      <td>${makeBadge(r.operation || 'ERROR', 'error')}</td>
      <td>${r.thisMeasurementType || '—'}</td>
      <td style="color:var(--danger);font-size:.8rem">${r.errorMessage || '—'}</td>
    </tr>`).join('');
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="3" class="ec">Error: ${errMsg(e)}</td></tr>`;
  }
}
