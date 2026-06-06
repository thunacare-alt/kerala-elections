(async function () {
  initPage('home');
  let combined, meta;
  try { [combined, meta] = await Promise.all([loadJSON('data/combined.json'), loadJSON('data/meta.json')]); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }
  const s = combined.series, st = combined.stats, years = s.map(r => r.year);

  // hero standout
  document.querySelector('#heroStat .big').textContent = `${st.ldf_wins}–${st.udf_wins}`;

  // quick stats
  const qs = document.getElementById('quickStats');
  [['10', 'elections, 1982–2026'],
   [String(st.alternations), 'changes of ruling front'],
   [`${st.turnout_min.turnout}–${st.turnout_max.turnout}%`, 'turnout range'],
   [`+${Math.abs(st.big_swing.delta)}`, `biggest seat swing (${st.big_swing.year})`]
  ].forEach(([n, l]) => qs.append(el('div', { class: 'stat' }, el('div', { class: 'n' }, n), el('div', { class: 'l' }, l))));

  // seats stacked bar
  makeChart('seatsChart', {
    type: 'bar',
    data: { labels: years, datasets: FRONT_ORDER.map(f => ({
      label: f, backgroundColor: FRONT[f].color, data: s.map(r => r['s_' + f]),
      stack: 'a', borderRadius: 2, borderWidth: 0, maxBarThickness: 46 })) },
    options: { scales: { x: { stacked: true, grid: { display: false } },
        y: { stacked: true, max: 140, ticks: { stepSize: 35 }, title: { display: true, text: 'Seats (of 140)' } } },
      plugins: { legend: { display: false },
        tooltip: { callbacks: { footer: i => 'Total ' + i.reduce((a, b) => a + b.parsed.y, 0) } } } }
  });
  const lg = document.getElementById('seatsLegend');
  FRONT_ORDER.forEach(f => lg.append(el('span', {}, el('i', { class: 'dot', style: `background:${FRONT[f].color}` }), FRONT[f].label)));

  // combined prose + data-derived pull-quote
  const cp = document.getElementById('combinedProse');
  combined.prose.forEach((p, i) => {
    cp.append(el('p', {}, p));
    if (i === 1) cp.append(el('blockquote', { class: 'pullquote' },
      `The ruling front changed at ${st.alternations} of the last ${years.length - 1} elections — power in Kerala is borrowed, never owned.`));
  });

  // vote share line
  makeChart('voteChart', {
    type: 'line',
    data: { labels: years, datasets: ['LDF', 'UDF', 'NDA'].map(f => ({
      label: f, borderColor: FRONT[f].color, backgroundColor: FRONT[f].color, data: s.map(r => r['v_' + f]),
      tension: .32, borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5, spanGaps: true })) },
    options: { scales: { y: { title: { display: true, text: '% of valid votes' } }, x: { grid: { display: false } } },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y}%` } } } }
  });

  // turnout area
  makeChart('turnoutChart', {
    type: 'line',
    data: { labels: years, datasets: [{ label: 'Turnout', data: s.map(r => r.turnout),
      borderColor: '#0d6e74', backgroundColor: 'rgba(13,110,116,.14)', fill: true, tension: .32,
      borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5 }] },
    options: { scales: { y: { suggestedMin: 68, suggestedMax: 82, title: { display: true, text: 'Turnout %' } }, x: { grid: { display: false } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.y}% turnout` } } } }
  });

  // election cards
  const grid = document.getElementById('yearGrid');
  s.slice().reverse().forEach(r => {
    const sf = meta.year_meta[String(r.year)].seats, total = 140;
    const bar = FRONT_ORDER.map(f => sf[f] ? `<i style="width:${sf[f] / total * 100}%;background:${FRONT[f].color}"></i>` : '').join('');
    const cm = meta.year_meta[String(r.year)].cm;
    grid.append(el('a', { class: 'ycard', href: `year.html?year=${r.year}`, style: `--c:${FRONT[r.winner].color}` },
      el('div', { class: 'yr' }, String(r.year)),
      el('div', { class: 'won' }, `${r.winner} ${r.winner === prevWinner(r.year) ? 'held' : 'won'}`),
      el('div', { class: 'cm', html: cm ? cm : '—' }),
      el('div', { class: 'role' }, cm ? 'Chief Minister' : 'government formed'),
      el('div', { class: 'seatbar', html: bar }),
      el('div', { class: 'seatbar-key', html: `LDF ${sf.LDF} · UDF ${sf.UDF}${sf.NDA ? ' · NDA ' + sf.NDA : ''}` })));
  });
  function prevWinner(y) { const i = years.indexOf(y); return i > 0 ? s[i - 1].winner : null; }
})();
