(async function () {
  setActiveNav('year');
  document.getElementById('disc-year').append(disclaimerBox());
  let meta;
  try { meta = await loadJSON('data/meta.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }

  const years = meta.years;
  const params = new URLSearchParams(location.search);
  let cur = parseInt(params.get('year')) || years[years.length - 1];
  if (!years.includes(cur)) cur = years[years.length - 1];

  const sel = document.getElementById('yearsel');
  years.slice().reverse().forEach(y => sel.append(el('option', { value: y }, String(y))));
  sel.value = cur;
  sel.addEventListener('change', () => go(parseInt(sel.value)));
  document.getElementById('prev').addEventListener('click', () => { const i = years.indexOf(cur); if (i > 0) go(years[i - 1]); });
  document.getElementById('next').addEventListener('click', () => { const i = years.indexOf(cur); if (i < years.length - 1) go(years[i + 1]); });

  let seatChart, voteChart;
  function go(y) { cur = y; sel.value = y; history.replaceState(null, '', `year.html?year=${y}`); render(); }

  async function render() {
    let d;
    try { d = await loadJSON(`data/year_${cur}.json`); }
    catch (e) { document.getElementById('summary').innerHTML = `<div class="err">Could not load ${cur}: ${e.message}</div>`; return; }

    // summary hero
    const sf = d.seat_front;
    document.getElementById('summary').innerHTML = '';
    document.getElementById('summary').append(
      el('div', { class: 'kicker' }, `Kerala Legislative Assembly · ${d.year}`),
      el('h1', { html: `${d.year}: ${frontTag(d.winner_front)} <span style="font-weight:600">${d.winner_front === meta.year_meta[String(prevYear(d.year))]?.winner ? 'retained power' : 'won'}</span>` }),
      (function () {
        const sl = el('div', { class: 'statline' });
        const order = FRONT_ORDER.filter(f => sf[f] > 0);
        order.forEach(f => sl.append(el('div', { class: 'stat' },
          el('div', { class: 'n', html: `<span class="fronttag ${f}">${sf[f]}</span>` }),
          el('div', { class: 'l' }, FRONT[f].label))));
        sl.append(el('div', { class: 'stat' }, el('div', { class: 'n' }, d.turnout + '%'), el('div', { class: 'l' }, 'Turnout')));
        sl.append(el('div', { class: 'stat' }, el('div', { class: 'n' }, fmt(d.total_candidates)), el('div', { class: 'l' }, 'Candidates')));
        if (d.cm) sl.append(el('div', { class: 'stat' }, el('div', { class: 'n', style: 'font-size:18px' }, d.cm), el('div', { class: 'l' }, 'Chief Minister')));
        return sl;
      })());

    // seat chart (doughnut)
    document.getElementById('seat-src').textContent = '140-seat house · ' + d.seat_src;
    const order = FRONT_ORDER.filter(f => sf[f] > 0);
    if (seatChart) seatChart.destroy();
    seatChart = new Chart(document.getElementById('seatChart'), {
      type: 'doughnut',
      data: { labels: order.map(f => f), datasets: [{ data: order.map(f => sf[f]), backgroundColor: order.map(f => FRONT[f].color), borderWidth: 2, borderColor: '#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '55%',
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed} seats` } } } }
    });

    // vote chart (bar)
    const vf = d.vote_front; const vorder = FRONT_ORDER.filter(f => vf[f] != null && vf[f] > 0);
    if (voteChart) voteChart.destroy();
    voteChart = new Chart(document.getElementById('voteChart'), {
      type: 'bar',
      data: { labels: vorder, datasets: [{ data: vorder.map(f => vf[f]), backgroundColor: vorder.map(f => FRONT[f].color) }] },
      options: { responsive: true, maintainAspectRatio: false,
        scales: { y: { title: { display: true, text: '% of valid votes' } }, x: { grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed.y}%` } } } }
    });

    // analysis
    const an = document.getElementById('analysis'); an.innerHTML = '';
    d.prose.forEach(p => an.append(el('p', {}, p)));

    // closest / biggest
    const cl = document.getElementById('closest'); cl.innerHTML = '';
    d.closest.forEach(s => cl.append(el('li', {},
      el('span', { html: `<b>${s.name}</b> — ${s.winner} ${frontTag(seatFront(d, s.no))}` }),
      el('span', { html: `<b>${fmt(s.margin)}</b>` }))));
    const bg = document.getElementById('biggest'); bg.innerHTML = '';
    d.biggest.forEach(s => bg.append(el('li', {},
      el('span', { html: `<b>${s.name}</b> — ${s.winner} (${s.party})` }),
      el('span', { html: `<b>${fmt(s.margin)}</b>` }))));

    // ministry
    const min = document.getElementById('ministry'); min.innerHTML = '';
    if (d.cabinet && d.cabinet.length) {
      min.append(el('p', { html: `<b>Chief Minister:</b> ${d.cm || '—'}. Council of Ministers as published by the source:` }));
      const cab = el('div', { class: 'cab' });
      d.cabinet.forEach(([a, b]) => {
        if (/^minister|^#$/i.test(a) && !b) return;
        cab.append(el('div', { class: 'm', html: b ? `<b>${a}</b>${b}` : `${a}` }));
      });
      min.append(cab);
    } else {
      min.append(el('p', { class: 'meta', html: `Ministry details were not published on the source for ${d.year}. The ${FRONT[d.winner_front].label} formed the government.` }));
    }

    // results table
    const rows = d.seats.map(s => ({ ...s, front: s.front }));
    buildTable(document.getElementById('results-table'), rows, [
      { key: 'no', label: '#', num: true },
      { key: 'name', label: 'Constituency' },
      { key: 'winner', label: 'Winner' },
      { key: 'party', label: 'Party' },
      { key: 'front', label: 'Front', render: r => frontTag(r.front) },
      { key: 'winner_votes', label: 'Votes', num: true },
      { key: 'margin', label: 'Margin', num: true },
      { key: 'runner', label: 'Runner-up' },
      { key: 'runner_party', label: 'R-up party' },
      { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
    ], { initialSort: { key: 'no', dir: 1 } });
  }

  function prevYear(y) { const i = years.indexOf(y); return i > 0 ? years[i - 1] : null; }
  function seatFront(d, no) { const s = d.seats.find(x => x.no === no); return s ? s.front : 'OTH'; }

  render();
})();
