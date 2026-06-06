/* Kerala Elections — shared front-end helpers */
const FRONT = {
  LDF: { color: '#E03131', label: 'Left Democratic Front' },
  UDF: { color: '#1971C2', label: 'United Democratic Front' },
  NDA: { color: '#F08C00', label: 'NDA (BJP-led)' },
  OTH: { color: '#868E96', label: 'Others / Independents' },
};
const FRONT_ORDER = ['LDF', 'UDF', 'NDA', 'OTH'];
const KE = { charts: [] };

async function loadJSON(p) {
  const r = await fetch(p, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${p} → HTTP ${r.status}`);
  return r.json();
}
const fmt = n => (n === null || n === undefined || n === '') ? '–' : Number(n).toLocaleString('en-IN');
const pctv = n => (n === null || n === undefined) ? '–' : Number(n).toFixed(2) + '%';

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) e.setAttribute(k, v);
  }
  for (const kid of kids) if (kid !== null && kid !== undefined)
    e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
}
const chip = f => `<span class="chip ${f}">${f}</span>`;
const ftext = (f, t) => `<span class="ftext ${f}">${t ?? f}</span>`;

/* ── Theme ─────────────────────────────────────────── */
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('ke-theme', t); } catch (e) {}
  const b = document.getElementById('themeBtn');
  if (b) b.textContent = t === 'dark' ? '☀' : '☾';
  retheme();
}
function initTheme() {
  let t;
  try { t = localStorage.getItem('ke-theme'); } catch (e) {}
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  const b = document.getElementById('themeBtn');
  if (b) { b.textContent = t === 'dark' ? '☀' : '☾'; b.addEventListener('click', () =>
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')); }
}

/* ── Charts (theme-aware) ──────────────────────────── */
function themeColors() {
  const dark = document.documentElement.dataset.theme === 'dark';
  return { tick: dark ? '#9aa1ac' : '#7a756c', grid: dark ? '#2c313a' : '#ece7dd',
           legend: dark ? '#d7d2c8' : '#3d3a36' };
}
function applyChartTheme(opt) {
  const t = themeColors();
  if (opt.scales) for (const s of Object.values(opt.scales)) {
    s.grid = Object.assign({}, s.grid, { color: t.grid, drawTicks: false });
    s.border = Object.assign({}, s.border, { display: false });
    s.ticks = Object.assign({}, s.ticks, { color: t.tick });
    if (s.title) s.title = Object.assign({}, s.title, { color: t.tick });
  }
  const lg = opt.plugins && opt.plugins.legend;
  if (lg && lg.display !== false) {
    lg.labels = Object.assign({ usePointStyle: true, boxWidth: 8, padding: 16 }, lg.labels, { color: t.legend });
  }
}
function makeChart(id, config) {
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  config.options = config.options || {};
  config.options.responsive = true; config.options.maintainAspectRatio = false;
  config.options.animation = { duration: 600, easing: 'easeOutQuart' };
  applyChartTheme(config.options);
  const ch = new Chart(ctx, config);
  KE.charts.push(ch);
  return ch;
}
function retheme() { KE.charts.forEach(c => { applyChartTheme(c.options); c.update('none'); }); }

/* ── Scroll reveal ─────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

function setActiveNav(name) {
  document.querySelectorAll('.nav-links a').forEach(a => { if (a.dataset.nav === name) a.classList.add('active'); });
}

function initPage(nav) {
  initTheme(); setActiveNav(nav); initReveal();
  const y = document.getElementById('footyear'); if (y) y.textContent = new Date().getFullYear();
}

/* ── Sortable + searchable table ───────────────────── */
function buildTable(container, rows, cols, { search = true, initialSort, placeholder } = {}) {
  container.innerHTML = '';
  const state = { key: initialSort?.key || cols[0].key, dir: initialSort?.dir || 1, q: '' };
  if (search) {
    const ctrl = el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('input', { type: 'search',
        placeholder: placeholder || 'Search…', oninput: e => { state.q = e.target.value.toLowerCase(); render(); } })),
      el('span', { class: 'rowcount', id: 'rc' }));
    container.append(ctrl);
  }
  const wrap = el('div', { class: 'table-wrap' });
  const table = el('table'); const thead = el('thead'); const htr = el('tr');
  cols.forEach(c => {
    const th = el('th', { class: c.num ? 'num' : '', onclick: () => {
      if (state.key === c.key) state.dir *= -1; else { state.key = c.key; state.dir = 1; } render();
    } }, c.label);
    th.dataset.key = c.key; htr.append(th);
  });
  thead.append(htr); table.append(thead);
  const tbody = el('tbody'); table.append(tbody); wrap.append(table); container.append(wrap);
  function render() {
    const col = cols.find(x => x.key === state.key);
    const sv = r => col.sortVal ? col.sortVal(r) : r[state.key];
    let data = rows.filter(r => !state.q || cols.some(c => String(r[c.key] ?? '').toLowerCase().includes(state.q)));
    data.sort((a, b) => {
      let x = sv(a), y = sv(b);
      if (typeof x === 'string' || typeof y === 'string') return state.dir * String(x ?? '').localeCompare(String(y ?? ''));
      return state.dir * ((x ?? -Infinity) - (y ?? -Infinity));
    });
    tbody.innerHTML = '';
    data.forEach(r => {
      const tr = el('tr');
      cols.forEach(c => {
        const td = el('td', { class: c.num ? 'num' : '' });
        const v = c.render ? c.render(r) : (c.num ? fmt(r[c.key]) : (r[c.key] ?? ''));
        if (v && v.nodeType) td.append(v); else td.innerHTML = v;
        tr.append(td);
      });
      tbody.append(tr);
    });
    htr.querySelectorAll('th').forEach(th => { th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.key === state.key) th.classList.add(state.dir === 1 ? 'sorted-asc' : 'sorted-desc'); });
    const rc = document.getElementById('rc'); if (rc) rc.textContent = `${data.length} of ${rows.length}`;
  }
  render();
}

// Chart defaults — only on pages that actually load Chart.js (Explorer / About do not).
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  Chart.defaults.font.size = 12.5;
  // Guard the default legend label generator: during async resize/animation frames a chart's
  // data can momentarily be undefined, which throws inside generateLabels. Return [] instead.
  const orig = Chart.defaults.plugins.legend.labels.generateLabels;
  Chart.defaults.plugins.legend.labels.generateLabels = function (chart) {
    return (chart && chart.data && chart.data.datasets) ? orig(chart) : [];
  };
}
