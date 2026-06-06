(async function () {
  setActiveNav('ls');
  document.getElementById('disc-ls').append(disclaimerBox());
  let d;
  try { d = await loadJSON('data/loksabha.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }

  const stats = document.getElementById('ls-stats');
  [['20', 'Lok Sabha seats'],
   [`UDF ${d.front.UDF} · LDF ${d.front.LDF}${d.front.NDA ? ' · NDA ' + d.front.NDA : ''}`, 'by front'],
   [String(Object.keys(d.tally).length), 'parties winning']
  ].forEach(([n, l]) => stats.append(el('div', { class: 'stat' }, el('div', { class: 'n', style: 'font-size:19px' }, n), el('div', { class: 'l' }, l))));

  const tally = Object.entries(d.tally).sort((a, b) => b[1] - a[1]);
  new Chart(document.getElementById('lsParty'), {
    type: 'bar',
    data: { labels: tally.map(t => t[0]), datasets: [{ data: tally.map(t => t[1]),
      backgroundColor: tally.map(t => FRONT[partyFront(t[0])].color) }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      scales: { x: { title: { display: true, text: 'Seats' }, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } } }
  });
  function partyFront(p) { const c = p.toUpperCase().replace(/[^A-Z]/g, '');
    if (['INC','IUML','KEC','KC','RSP'].includes(c)) return 'UDF';
    if (['CPIM','CPI','CPM'].includes(c)) return 'LDF';
    if (['BJP','BDJS'].includes(c)) return 'NDA'; return 'OTH'; }

  const an = document.getElementById('ls-analysis'); d.prose.forEach(p => an.append(el('p', {}, p)));

  buildTable(document.getElementById('ls-table'), d.seats, [
    { key: 'no', label: '#', num: true },
    { key: 'name', label: 'Constituency' },
    { key: 'winner', label: 'Winner' },
    { key: 'party', label: 'Party' },
    { key: 'winner_votes', label: 'Votes', num: true },
    { key: 'margin', label: 'Margin', num: true },
    { key: 'runner', label: 'Runner-up' },
    { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
  ], { initialSort: { key: 'no', dir: 1 } });
})();
