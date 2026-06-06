(async function () {
  setActiveNav('by');
  document.getElementById('disc-by').append(disclaimerBox());
  let d;
  try { d = await loadJSON('data/byelections.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }

  const stats = document.getElementById('by-stats');
  [[String(d.rows.length), 'by-elections'],
   [`LDF ${d.front.LDF} · UDF ${d.front.UDF}${d.front.NDA ? ' · NDA ' + d.front.NDA : ''}`, 'by winning front']
  ].forEach(([n, l]) => stats.append(el('div', { class: 'stat' }, el('div', { class: 'n', style: 'font-size:19px' }, n), el('div', { class: 'l' }, l))));

  const order = FRONT_ORDER.filter(f => d.front[f] > 0);
  new Chart(document.getElementById('byChart'), {
    type: 'doughnut',
    data: { labels: order, datasets: [{ data: order.map(f => d.front[f]), backgroundColor: order.map(f => FRONT[f].color), borderColor: '#fff', borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '55%', plugins: { legend: { position: 'bottom' } } }
  });

  const an = document.getElementById('by-analysis'); d.prose.forEach(p => an.append(el('p', {}, p)));

  buildTable(document.getElementById('by-table'), d.rows, [
    { key: 'year', label: 'Year', num: true, sortVal: r => parseInt(r.year) || 0 },
    { key: 'date', label: 'Date of poll' },
    { key: 'const', label: 'Constituency' },
    { key: 'winner', label: 'Winner' },
    { key: 'party', label: 'Party' },
    { key: 'winner_votes', label: 'Votes', num: true },
    { key: 'margin', label: 'Margin', num: true },
    { key: 'runner', label: 'Runner-up' },
    { key: 'runner_party', label: 'R-up party' },
    { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
  ], { initialSort: { key: 'year', dir: -1 } });
})();
