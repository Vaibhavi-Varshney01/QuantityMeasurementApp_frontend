/* ═══════════════════════════════════════════════════════
   QUANTIMEASURE — theme.js
   Dark/light toggle + canvas particle background
═══════════════════════════════════════════════════════ */

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.innerHTML  = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.title = t === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode';
  }
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const nxt = cur === 'dark' ? 'light' : 'dark';
  applyTheme(nxt);
  localStorage.setItem('qm_theme', nxt);
}

/* Apply immediately to prevent flicker */
(function () {
  applyTheme(localStorage.getItem('qm_theme') || 'dark');
})();

/* ── Particles ── */
function initParticles() {
  const c = document.getElementById('px');
  if (!c) return;
  const ctx = c.getContext('2d');

  function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
  resize();

  const pts = Array.from({ length: 45 }, () => ({
    x:   Math.random() * c.width,
    y:   Math.random() * c.height,
    r:   Math.random() * 1.5 + 0.4,
    vx:  Math.random() * 0.22 - 0.11,
    vy:  Math.random() * 0.22 - 0.11,
    op:  Math.random() * 0.25 + 0.05,
    col: Math.random() > 0.5 ? 'blue' : 'purple',
  }));

  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    pts.forEach(p => {
      p.x = (p.x + p.vx + c.width)  % c.width;
      p.y = (p.y + p.vy + c.height) % c.height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      const op = dark ? p.op : p.op * 0.3;
      ctx.fillStyle = p.col === 'blue'
        ? `rgba(59,130,246,${op})`
        : `rgba(139,92,246,${op})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  draw();
  window.addEventListener('resize', resize);
}
