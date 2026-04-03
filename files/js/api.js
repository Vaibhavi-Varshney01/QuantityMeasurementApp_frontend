const API_BASE  = 'http://localhost:5207';
const TOKEN_KEY = 'qm_token';
const USER_KEY  = 'qm_user';
const HISTORY_KEY = 'qm_history';

const ENDPOINTS = {
  login:    '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  compare:  '/api/v1/quantities/compare',
  add:      '/api/v1/quantities/add',
  subtract: '/api/v1/quantities/subtract',
  divide:   '/api/v1/quantities/divide',
  convert:  '/api/v1/quantities/convert',
  histOp:   (op)   => `/api/v1/quantities/history/operation/${op}`,
  histType: (type) => `/api/v1/quantities/history/type/${type}`,
  errored:  '/api/v1/quantities/history/errored',
  count:    (op)   => `/api/v1/quantities/count/${op}`,
};

const MEASUREMENT_CONFIG = {
  LengthUnit: {
    base: 'Meter',
    units: {
      Feet:  0.3048,
      Inch:  0.0254,
      Yard:  0.9144,
      Cm:    0.01,
      Meter: 1,
    },
  },
  WeightUnit: {
    base: 'Kilogram',
    units: {
      Kilogram: 1,
      Gram:     0.001,
      Pound:    0.45359237,
      Tonne:    1000,
    },
  },
  VolumeUnit: {
    base: 'Litre',
    units: {
      Litre:      1,
      Millilitre: 0.001,
      Gallon:     3.78541,
    },
  },
  TemperatureUnit: {
    base: 'Kelvin',
  },
};

const HISTORY_LIMIT = 250;
const COMPARE_TOLERANCE = 1e-6;

let localHistory = loadHistoryFromStorage();

const apiClient = {
  get: (url) => localRequest('GET', url),
  post: (url, body) => localRequest('POST', url, body),
};

function localRequest(method, url, body) {
  const path = normalizePath(url);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const payload = method === 'GET' ? handleGet(path) : handlePost(path, body);
        resolve({ data: payload });
      } catch (error) {
        reject(error);
      }
    }, 100);
  });
}

function normalizePath(url) {
  if (!url) return '';
  if (url.startsWith(API_BASE)) return url.slice(API_BASE.length);
  return url;
}

function handleGet(path) {
  if (!path) return [];
  if (path.startsWith('/api/v1/quantities/count')) {
    const op = suffix(path, '/api/v1/quantities/count');
    return countOperations(op);
  }
  if (path.startsWith('/api/v1/quantities/history/operation')) {
    const op = suffix(path, '/api/v1/quantities/history/operation');
    return queryHistory({ operation: op });
  }
  if (path.startsWith('/api/v1/quantities/history/type')) {
    const type = suffix(path, '/api/v1/quantities/history/type');
    return queryHistory({ type });
  }
  if (path === '/api/v1/quantities/history/errored') {
    return localHistory.filter(entry => entry.isError);
  }
  throw new Error(`Unsupported endpoint: ${path}`);
}

function handlePost(path, body) {
  const prefix = '/api/v1/quantities/';
  if (!path.startsWith(prefix)) throw new Error(`Unsupported endpoint: ${path}`);
  const op = path.slice(prefix.length).replace(/\/+$/, '').toUpperCase();
  if (!op) throw new Error('Operation not specified');

  const payload = buildPayload(body, op);
  try {
    const response = executeOperation(op, payload);
    const record = buildRecord(op, payload, response, false);
    pushHistory(record);
    return response;
  } catch (error) {
    const errorRecord = buildRecord(op, payload, null, true, error.message);
    pushHistory(errorRecord);
    throw error;
  }
}

function suffix(path, prefix) {
  if (!path.startsWith(prefix)) return '';
  return path.slice(prefix.length).replace(/\/+$/, '');
}

function buildPayload(body, op) {
  const thisDto = body?.thisQuantityDTO || {};
  const thatDto = body?.thatQuantityDTO || {};
  const type      = thisDto.measurementType || thatDto.measurementType || 'LengthUnit';
  const thisValue = Number(thisDto.value);
  const thatValue = Number(thatDto.value);
  const thisUnit  = thisDto.unit;
  const thatUnit  = thatDto.unit;

  if (!type || !MEASUREMENT_CONFIG[type]) throw new Error('Unsupported measurement type');
  if (Number.isNaN(thisValue)) throw new Error('Value 1 is required');
  if (!thisUnit) throw new Error('Unit 1 is required');
  if (op !== 'CONVERT') {
    if (Number.isNaN(thatValue)) throw new Error('Value 2 is required');
    if (!thatUnit) throw new Error('Unit 2 is required');
  } else if (!thatUnit) {
    throw new Error('Target unit is required for conversion');
  }

  return { type, thisValue, thatValue, thisUnit, thatUnit };
}

function executeOperation(op, payload) {
  const { type, thisValue, thisUnit, thatValue, thatUnit } = payload;
  const normalizedOp = op.toUpperCase();
  const config = MEASUREMENT_CONFIG[type];
  if (!config) throw new Error('Unsupported measurement type');

  const baseA = toBase(thisValue, thisUnit, type);

  if (normalizedOp === 'CONVERT') {
    const converted = fromBase(baseA, thatUnit, type);
    const rounded = normalizeNumber(converted);
    return {
      thisValue,
      thisUnit,
      thatValue: rounded,
      thatUnit,
      thisMeasurementType: type,
      resultValue: rounded,
      resultUnit: thatUnit,
      resultString: 'Converted',
    };
  }

  const baseB = toBase(thatValue, thatUnit, type);
  switch (normalizedOp) {
    case 'COMPARE': {
      const equal = Math.abs(baseA - baseB) < COMPARE_TOLERANCE;
      return {
        thisValue,
        thisUnit,
        thatValue,
        thatUnit,
        thisMeasurementType: type,
        resultValue: equal ? 1 : 0,
        resultUnit: '',
        resultString: equal ? 'true' : 'false',
      };
    }
    case 'ADD': {
      const sum = baseA + baseB;
      return {
        thisValue,
        thisUnit,
        thatValue,
        thatUnit,
        thisMeasurementType: type,
        resultValue: normalizeNumber(fromBase(sum, thisUnit, type)),
        resultUnit: thisUnit,
        resultString: 'Sum',
      };
    }
    case 'SUBTRACT': {
      const diff = baseA - baseB;
      return {
        thisValue,
        thisUnit,
        thatValue,
        thatUnit,
        thisMeasurementType: type,
        resultValue: normalizeNumber(fromBase(diff, thisUnit, type)),
        resultUnit: thisUnit,
        resultString: 'Diff',
      };
    }
    case 'DIVIDE': {
      if (Math.abs(baseB) < Number.EPSILON) throw new Error('Cannot divide by zero');
      const ratio = baseA / baseB;
      return {
        thisValue,
        thisUnit,
        thatValue,
        thatUnit,
        thisMeasurementType: type,
        resultValue: normalizeNumber(ratio),
        resultUnit: '',
        resultString: 'Ratio',
      };
    }
    default:
      throw new Error(`Unsupported operation: ${normalizedOp}`);
  }
}

function toBase(value, unit, type) {
  if (type === 'TemperatureUnit') return temperatureToKelvin(value, unit);
  const factor = MEASUREMENT_CONFIG[type]?.units?.[unit];
  if (factor == null) throw new Error(`Unknown unit: ${unit}`);
  return value * factor;
}

function fromBase(value, unit, type) {
  if (type === 'TemperatureUnit') return temperatureFromKelvin(value, unit);
  const factor = MEASUREMENT_CONFIG[type]?.units?.[unit];
  if (factor == null) throw new Error(`Unknown unit: ${unit}`);
  return value / factor;
}

function temperatureToKelvin(value, unit) {
  switch (unit) {
    case 'Kelvin': return value;
    case 'Celsius': return value + 273.15;
    case 'Fahrenheit': return (value - 32) * (5 / 9) + 273.15;
    default: throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

function temperatureFromKelvin(value, unit) {
  switch (unit) {
    case 'Kelvin': return value;
    case 'Celsius': return value - 273.15;
    case 'Fahrenheit': return (value - 273.15) * (9 / 5) + 32;
    default: throw new Error(`Unknown temperature unit: ${unit}`);
  }
}

function normalizeNumber(value) {
  if (!Number.isFinite(value)) return value;
  const rounded = Number(value.toFixed(6));
  return Math.abs(rounded) === 0 ? 0 : rounded;
}

function buildRecord(op, payload, response, isError, errorMessage = '') {
  const base = {
    operation: op.toUpperCase(),
    thisMeasurementType: payload?.type || 'LengthUnit',
    thisValue: payload?.thisValue ?? null,
    thisUnit: payload?.thisUnit || '',
    thatValue: payload?.thatValue ?? null,
    thatUnit: payload?.thatUnit || '',
    resultValue: response?.resultValue ?? null,
    resultUnit: response?.resultUnit || '',
    resultString: response?.resultString || '',
    isError,
    errorMessage,
    timestamp: new Date().toISOString(),
  };

  if (response && response.thatValue !== undefined) {
    base.thatValue = response.thatValue;
    base.thatUnit = response.thatUnit || base.thatUnit;
  }

  return base;
}

function pushHistory(entry) {
  localHistory.unshift(entry);
  if (localHistory.length > HISTORY_LIMIT) localHistory.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(localHistory));
}

function loadHistoryFromStorage() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Failed to read local history', error);
    return [];
  }
}

function queryHistory(filter = {}) {
  const rows = [...localHistory];
  if (filter.operation) {
    const op = filter.operation.toUpperCase();
    return rows.filter(r => r.operation === op);
  }
  if (filter.type) {
    return rows.filter(r => r.thisMeasurementType === filter.type);
  }
  return rows;
}

function countOperations(op) {
  if (!op) return localHistory.length;
  const normalized = op.toUpperCase();
  return localHistory.filter(r => r.operation === normalized).length;
}

/* â”€â”€ Session helpers â”€â”€ */
function saveSession(token, username, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify({ username, role }));
}
function getToken()     { return localStorage.getItem(TOKEN_KEY); }
function getUser()      { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function isAuth()       { return !!getToken(); }
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* â”€â”€ Error helper â”€â”€ */
function errMsg(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.errors)  return Object.values(err.response.data.errors).flat().join(', ');
  if (err.message) return err.message;
  return 'Unknown error';
}

/* â”€â”€ Toast â”€â”€ */
let _toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  if (_toastTimer) clearTimeout(_toastTimer);
  el.textContent = msg;
  el.className = `toast ${type} show`;
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3800);
}

/* â”€â”€ Connection checker (stubbed) â”€â”€ */
async function checkConn() {
  const el  = document.getElementById('connStatus');
  const txt = document.getElementById('connText');
  const infoBe = document.getElementById('infoBackend');
  try {
    await apiClient.get(ENDPOINTS.count('COMPARE'));
    if (el)  { el.className = 'conn-status ok'; }
    if (txt) { txt.textContent = 'Connected'; }
    if (infoBe) infoBe.innerHTML = '<span class="badge badge-ok">Online</span>';
  } catch {
    if (el)  { el.className = 'conn-status err'; }
    if (txt) { txt.textContent = 'Offline'; }
    if (infoBe) infoBe.innerHTML = '<span class="badge badge-err">Offline</span>';
  }
}

/* â”€â”€ Badge helpers â”€â”€ */
const BADGE_COLORS = {
  compare:  '#3b82f6',
  add:      '#22c55e',
  subtract: '#8b5cf6',
  divide:   '#f59e0b',
  convert:  '#60a5fa',
  error:    '#f87171',
};
function makeBadge(text, type) {
  const c = BADGE_COLORS[type] || BADGE_COLORS[text?.toLowerCase()] || '#666';
  return `<span style="background:${c}18;color:${c};padding:.16rem .58rem;border-radius:50px;font-size:.68rem;font-weight:800;border:1px solid ${c}35;letter-spacing:.03em">${text}</span>`;
}

/* â”€â”€ Table renderer â”€â”€ */
function renderTbody(tb, rows, cols) {
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="${cols}" class="ec">No records found.</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(r => {
    if (cols === 3) return `<tr>
      <td>${makeBadge(r.operation || 'ERROR', 'error')}</td>
      <td>${r.thisMeasurementType || '—'}</td>
      <td style="color:var(--danger);font-size:.8rem">${r.errorMessage || '—'}</td></tr>`;
    return `<tr>
      <td>${makeBadge(r.operation || '—', (r.operation || '').toLowerCase())}</td>
      <td>${r.thisMeasurementType || '—'}</td>
      <td>${formatMeasureValue(r.thisValue)} ${r.thisUnit || ''}</td>
      <td>${formatMeasureValue(r.thatValue)} ${r.thatUnit || ''}</td>
      <td>${(r.resultString || (r.resultValue !== null && r.resultValue !== undefined ? formatMeasureValue(r.resultValue) : '—'))} ${r.resultUnit || ''}</td>
      <td>${r.isError ? '<span class="badge badge-err">Error</span>' : '<span class="badge badge-ok">OK</span>'}</td>
    </tr>`;
  }).join('');
}

function formatMeasureValue(val) {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return typeof val === 'number' ? Number(val.toFixed(6)) : val;
}
