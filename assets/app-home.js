(async function () {
  setActiveNav('home');
  document.getElementById('disc-home').append(disclaimerBox());
  let combined, meta;
  try {
    [combined, meta] = await Promise.all([loadJSON('data/combined.json'), loadJSON('data/meta.json')]);
  } catch (e) {
    document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message));
    return;
  }
  const s = combined.series;
  const years = s.map(r => r.year);

  // headline stats
  const st = combined.stats;
  const hs = document.getElementById('headline-stats');
  [['10', 'elections (1982–2026)'],
   [String(st.alternations), 'times power changed front'],
   [`${st.ldf_wins}–${st.udf_wins}`, 'LDF–UDF elections led'],
   [`${st.turnout_min.turnout}–${st.turnout_max.turnout}%`, 'turnout range']
  ].forEach(([n, l]) => hs.append(el('div', { class: 'stat' }, el('div', { class: 'n' }, n), el('div', { class: 'l' }, l))));

  // seats stacked bar
  new Chart(document.getElementById('seatsChart'), {
    type: 'bar',
    data: {
      labels: years,
      datasets: FRONT_ORDER.map(f => ({
        label: f, backgroundColor: FRONT[f].color, data: s.map(r => r['s_' + f]),
        stack: 'seats', borderWidth: 0
      }))
    },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { x: { stacked: true, grid: { display: false } },
                y: { stacked: true, max: 140, title: { display: true, text: 'Seats' } } },
      plugins: { legend: { position: 'bottom' },
        tooltip: { callbacks: { footer: items => 'Total: ' + items.reduce((a, b) => a + b.parsed.y, 0) } } } }
  });

  // vote share line
  new Chart(document.getElementById('voteChart'), {
    type: 'line',
    data: { labels: years, datasets: FRONT_ORDER.filter(f => f !== 'OTH').map(f => ({
      label: f, borderColor: FRONT[f].color, backgroundColor: FRONT[f].color,
      data: s.map(r => r['v_' + f]), tension: .25, spanGaps: true, pointRadius: 3 })) },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { y: { title: { display: true, text: '% of valid votes' } }, x: { grid: { display: false } } },
      plugins: { legend: { position: 'bottom' },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}%` } } } }
  });

  // turnout line
  new Chart(document.getElementById('turnoutChart'), {
    type: 'line',
    data: { labels: years, datasets: [{ label: 'Turnout %', borderColor: '#0b4f75',
      backgroundColor: 'rgba(11,79,117,.12)', fill: true, data: s.map(r => r.turnout), tension: .25, pointRadius: 3 }] },
    options: { responsive: true, maintainAspectRatio: false,
      scales: { y: { suggestedMin: 65, suggestedMax: 85, title: { display: true, text: 'Turnout %' } }, x: { grid: { display: false } } },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y}% turnout` } } } }
  });

  // combined analysis prose
  const ca = document.getElementById('combined-analysis');
  combined.prose.forEach(p => ca.append(el('p', {}, p)));

  // year cards
  const grid = document.getElementById('year-cards');
  s.slice().reverse().forEach(r => {
    const sf = meta.year_meta[String(r.year)].seats;
    grid.append(el('a', { class: 'card year-card', href: `year.html?year=${r.year}` },
      el('div', { class: 'yr' }, String(r.year)),
      el('div', { class: 'win', html: `${frontTag(r.winner)} led` }),
      el('div', { class: 'meta' }, `LDF ${sf.LDF} · UDF ${sf.UDF}${sf.NDA ? ' · NDA ' + sf.NDA : ''}`),
      el('div', { class: 'meta' }, `Turnout ${r.turnout}%`)));
  });
})();
