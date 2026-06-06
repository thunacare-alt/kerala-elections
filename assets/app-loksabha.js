(async function () {
  initPage('ls');
  let d;
  try { d = await loadJSON('data/loksabha.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }

  const stats = document.getElementById('lsStats');
  [['20', 'Lok Sabha seats'],
   [`${d.front.UDF}`, 'UDF seats', 'UDF'],
   [`${d.front.LDF}`, 'LDF seats', 'LDF'],
   [`${d.front.NDA}`, 'NDA seats', 'NDA']
  ].forEach(([n, l, f]) => stats.append(el('div', { class: 'stat' + (f ? ' win-' + f : '') },
    el('div', { class: 'n' }, n), el('div', { class: 'l' }, l))));

  const tally = Object.entries(d.tally).sort((a, b) => b[1] - a[1]);
  const pf = p => { const c = p.toUpperCase().replace(/[^A-Z]/g, '');
    if (['CPIM', 'CPI', 'CPM'].includes(c)) return 'LDF';
    if (['BJP', 'BDJS'].includes(c)) return 'NDA';
    if (['INC', 'IUML', 'KEC', 'KC', 'RSP', 'KCJ'].includes(c)) return 'UDF'; return 'OTH'; };
  makeChart('lsParty', {
    type: 'bar',
    data: { labels: tally.map(t => t[0]), datasets: [{ data: tally.map(t => t[1]),
      backgroundColor: tally.map(t => FRONT[pf(t[0])].color), borderRadius: 4, maxBarThickness: 30 }] },
    options: { indexAxis: 'y', scales: { x: { title: { display: true, text: 'Seats' }, ticks: { stepSize: 2, precision: 0 } }, y: { grid: { display: false } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.parsed.x} seat${c.parsed.x > 1 ? 's' : ''}` } } } }
  });

  const an = document.getElementById('lsAnalysis'); d.prose.forEach(p => an.append(el('p', {}, p)));

  buildTable(document.getElementById('lsTable'), d.seats, [
    { key: 'no', label: '#', num: true },
    { key: 'name', label: 'Constituency' },
    { key: 'winner', label: 'Winner' },
    { key: 'party', label: 'Party' },
    { key: 'winner_votes', label: 'Votes', num: true },
    { key: 'margin', label: 'Margin', num: true },
    { key: 'runner', label: 'Runner-up' },
    { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
  ], { initialSort: { key: 'no', dir: 1 }, placeholder: 'Search constituency, winner or party…' });
})();
