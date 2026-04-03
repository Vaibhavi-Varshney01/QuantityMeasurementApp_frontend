/* ═══════════════════════════════════════════════════════
   QUANTIMEASURE — converter.js
   Operation picker, unit dropdowns, execute & results
═══════════════════════════════════════════════════════ */

const UNITS = {
  LengthUnit:      ['Feet', 'Inch', 'Yard', 'Cm'],
  WeightUnit:      ['Kilogram', 'Gram', 'Pound', 'Tonne'],
  VolumeUnit:      ['Litre', 'Millilitre', 'Gallon'],
  TemperatureUnit: ['Celsius', 'Fahrenheit', 'Kelvin'],
};

let curOp = 'compare';

/* ── Operation pill select ── */
function selectOp(btn) {
  document.querySelectorAll('.op-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  curOp = btn.dataset.op;

  const urlEl = document.getElementById('apiUrl');
  if (urlEl) urlEl.textContent = `${API_BASE}${ENDPOINTS[curOp] || '/api/v1/quantities/' + curOp}`;

  const v2  = document.getElementById('val2wrap');
  const u2l = document.getElementById('unit2lbl');

  if (curOp === 'convert') {
    if (v2)  v2.style.display = 'none';
    if (u2l) u2l.innerHTML = '<i class="fas fa-tag"></i> Target Unit';
  } else {
    if (v2)  v2.style.display = '';
    if (u2l) u2l.innerHTML = '<i class="fas fa-tag"></i> Unit 2';
  }

  document.getElementById('resultBox').style.display = 'none';
}

/* ── Update unit dropdowns ── */
function updateUnits() {
  const type  = document.getElementById('measType')?.value || 'LengthUnit';
  const units = UNITS[type] || [];
  ['unit1', 'unit2'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  });
}

/* ── Build request body ── */
function buildBody(v1, u1, v2, u2, t) {
  return {
    thisQuantityDTO: { value: v1, unit: u1, measurementType: t },
    thatQuantityDTO: { value: v2, unit: u2, measurementType: t },
  };
}

/* ── Execute operation ── */
async function runOp() {
  const v1   = parseFloat(document.getElementById('val1')?.value);
  const u1   = document.getElementById('unit1')?.value;
  const v2   = parseFloat(document.getElementById('val2')?.value);
  const u2   = document.getElementById('unit2')?.value;
  const type = document.getElementById('measType')?.value || 'LengthUnit';

  if (isNaN(v1) || !u1) { showToast('Please enter Value 1', 'error'); return; }
  if (curOp !== 'convert' && isNaN(v2)) { showToast('Please enter Value 2', 'error'); return; }

  const btn = document.getElementById('runBtn');
  const txt = document.getElementById('runTxt');
  btn.disabled = true; txt.textContent = 'Running…';

  try {
    let r;
    if (curOp === 'convert') r = await apiClient.post(ENDPOINTS.convert, buildBody(v1, u1, 0, u2, type));
    else                     r = await apiClient.post(ENDPOINTS[curOp],  buildBody(v1, u1, v2, u2, type));

    showResult(r.data, curOp);
    showToast('✓ Result saved to database', 'success');
    loadStats();
  } catch (e) {
    const m = errMsg(e);
    showToast(m, 'error');
    showResultErr(m);
  } finally {
    btn.disabled = false; txt.textContent = 'Execute';
  }
}

/* ── Show success result ── */
function showResult(data, op) {
  const box  = document.getElementById('resultBox');
  const val  = document.getElementById('rVal');
  const meta = document.getElementById('rMeta');
  box.style.display = 'block';
  box.classList.remove('error');

  let disp = '—';
  if (op === 'compare')     disp = data.resultString === 'true' ? '✓ Equal' : '✗ Not Equal';
  else if (op === 'divide') disp = data.resultValue?.toFixed(4) ?? '—';
  else                      disp = `${data.resultValue ?? '—'} ${data.resultUnit ?? ''}`.trim();

  val.textContent  = disp;
  val.style.color  = '';
  if (meta) meta.textContent = `${data.thisValue} ${data.thisUnit}  ${op.toUpperCase()}  ${data.thatValue ?? ''} ${data.thatUnit ?? ''}  →  ${data.thisMeasurementType}`;
}

/* ── Show error result ── */
function showResultErr(msg) {
  const box = document.getElementById('resultBox');
  const val = document.getElementById('rVal');
  box.style.display = 'block';
  box.classList.add('error');
  val.textContent = msg;
  val.style.color = 'var(--danger)';
}
