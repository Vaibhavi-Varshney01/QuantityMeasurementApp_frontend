const USER_STORE_KEY = 'qm_users';

function switchForm(t) {
  document.getElementById('loginForm').classList.toggle('active',  t === 'login');
  document.getElementById('signupForm').classList.toggle('active', t === 'signup');
  document.getElementById('tabLogin').classList.toggle('active',   t === 'login');
  document.getElementById('tabSignup').classList.toggle('active',  t === 'signup');
}

function togglePw(id) {
  const inp = document.getElementById(id);
  const btn = inp.parentElement.querySelector('.pw-toggle i');
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (btn) btn.className = inp.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function checkStrength(pw) {
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 8)  s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  const pct  = (s / 6) * 100;
  const fill = document.getElementById('strengthFill');
  const txt  = document.getElementById('strengthText');
  fill.style.width = pct + '%';
  if (s <= 2) { fill.style.background = '#f87171'; txt.textContent = 'Weak'; }
  else if (s <= 4) { fill.style.background = '#f59e0b'; txt.textContent = 'Fair'; }
  else { fill.style.background = '#22c55e'; txt.textContent = 'Strong'; }
}

function showAlert(id, msg, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert ${type}`;
  el.style.display = 'block';
}

function hideAlert(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function socialToast(name) { showToast(`${name} login coming soon`, 'info'); }

function loadUsers() {
  try {
    const raw = localStorage.getItem(USER_STORE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function persistUsers(users) {
  localStorage.setItem(USER_STORE_KEY, JSON.stringify(users));
}

function normalizeUsername(username) {
  return username?.trim().toLowerCase() || '';
}

async function handleLogin(e) {
  e.preventDefault();
  hideAlert('loginAlert');
  document.getElementById('loginUsernameError').textContent = '';
  document.getElementById('loginPasswordError').textContent = '';

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username) { document.getElementById('loginUsernameError').textContent = 'Username is required'; return; }
  if (password.length < 6) { document.getElementById('loginPasswordError').textContent = 'Min 6 characters'; return; }

  const btn = document.getElementById('loginBtn');
  const txt = document.getElementById('loginBtnText');
  btn.disabled = true; txt.textContent = 'Signing in…';

  try {
    const users = loadUsers();
    const normalized = normalizeUsername(username);
    const user = users[normalized];
    if (!user || user.password !== password) {
      const msg = 'Invalid username or password';
      showAlert('loginAlert', msg, 'error');
      showToast(msg, 'error');
      return;
    }
    const token = `qm-local-${Date.now()}`;
    saveSession(token, user.username, user.role || 'Member');
    showToast('Login successful! Redirecting…', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
  } finally {
    btn.disabled = false; txt.textContent = 'Sign In';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  hideAlert('signupAlert');
  ['signupUsernameError', 'signupPasswordError', 'signupConfirmError']
    .forEach(id => { document.getElementById(id).textContent = ''; });

  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const agree    = document.getElementById('agreeTerms')?.checked;
  let ok = true;

  if (!username || username.length < 3) { document.getElementById('signupUsernameError').textContent = 'Min 3 characters'; ok = false; }
  if (password.length < 6)              { document.getElementById('signupPasswordError').textContent = 'Min 6 characters'; ok = false; }
  if (password !== confirm)             { document.getElementById('signupConfirmError').textContent = 'Passwords do not match'; ok = false; }
  if (!agree) { showToast('Please accept the terms', 'error'); ok = false; }
  if (!ok) return;

  const btn = document.getElementById('signupBtn');
  const txt = document.getElementById('signupBtnText');
  btn.disabled = true; txt.textContent = 'Creating account…';

  try {
    const users = loadUsers();
    const normalized = normalizeUsername(username);
    if (users[normalized]) {
      const msg = 'Username already taken';
      showAlert('signupAlert', msg, 'error');
      showToast(msg, 'error');
      return;
    }
    users[normalized] = { username, password, role: 'Member' };
    persistUsers(users);
    const token = `qm-local-${Date.now()}`;
    saveSession(token, username, 'Member');
    showToast('Account created! Welcome 🎉', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
  } finally {
    btn.disabled = false; txt.textContent = 'Create Account';
  }
}
