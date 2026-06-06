(async function () {
  initPage('by');
  let d;
  try { d = await loadJSON('data/byelections.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }

  const stats = document.getElementById('byStats');
  [[String(d.rows.length), 'by-elections'],
   [`${d.front.LDF}`, 'won by LDF', 'LDF'],
   [`${d.front.UDF}`, 'won by UDF', 'UDF']
  ].forEach(([n, l, f]) => stats.append(el('div', { class: 'stat' + (f ? ' win-' + f : '') },
    el('div', { class: 'n' }, n), el('div', { class: 'l' }, l))));

  const order = FRONT_ORDER.filter(f => d.front[f] > 0);
  makeChart('byChart', {
    type: 'doughnut',
    data: { labels: order, datasets: [{ data: order.map(f => d.front[f]),
      backgroundColor: order.map(f => FRONT[f].color), borderColor: 'transparent', hoverOffset: 6 }] },
    options: { cutout: '62%', plugins: { legend: { position: 'bottom' },
      tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed}` } } } }
  });

  const an = document.getElementById('byAnalysis'); d.prose.forEach(p => an.append(el('p', {}, p)));

  buildTable(document.getElementById('byTable'), d.rows, [
    { key: 'year', label: 'Year', num: true, sortVal: r => parseInt(r.year) || 0 },
    { key: 'date', label: 'Date of poll' },
    { key: 'const', label: 'Constituency' },
    { key: 'winner', label: 'Winner' },
    { key: 'party', label: 'Party' },
    { key: 'winner_votes', label: 'Votes', num: true },
    { key: 'margin', label: 'Margin', num: true },
    { key: 'runner', label: 'Runner-up' },
    { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
  ], { initialSort: { key: 'year', dir: -1 }, placeholder: 'Search constituency, winner or party…' });
})();
