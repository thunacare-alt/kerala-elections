(async function () {
  initPage('year');
  let meta;
  try { meta = await loadJSON('data/meta.json'); }
  catch (e) { document.querySelector('main').prepend(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }
  const years = meta.years;
  let cur = parseInt(new URLSearchParams(location.search).get('year')) || years[years.length - 1];
  if (!years.includes(cur)) cur = years[years.length - 1];

  const sel = document.getElementById('yearsel');
  years.slice().reverse().forEach(y => sel.append(el('option', { value: y }, String(y))));
  sel.value = cur;
  sel.addEventListener('change', () => go(parseInt(sel.value)));
  document.getElementById('prev').addEventListener('click', () => { const i = years.indexOf(cur); if (i > 0) go(years[i - 1]); });
  document.getElementById('next').addEventListener('click', () => { const i = years.indexOf(cur); if (i < years.length - 1) go(years[i + 1]); });

  const prevWinner = y => { const i = years.indexOf(y); return i > 0 ? meta.year_meta[String(years[i - 1])].winner : null; };
  function go(y) { cur = y; sel.value = y; history.replaceState(null, '', `year.html?year=${y}`); render(); }

  async function render() {
    let d;
    try { d = await loadJSON(`data/year_${cur}.json`); }
    catch (e) { document.getElementById('summary').innerHTML = `<div class="err">Could not load ${cur}: ${e.message}</div>`; return; }
    KE.charts.forEach(c => c.destroy()); KE.charts = [];

    const sf = d.seat_front, vf = d.vote_front, wf = d.winner_front;
    const ranked = FRONT_ORDER.filter(f => sf[f] > 0).sort((a, b) => sf[b] - sf[a]);
    const runner = ranked[1] || 'UDF';
    const held = wf === prevWinner(cur);

    // summary header
    const h = document.getElementById('summary'); h.innerHTML = '';
    h.append(
      el('div', { class: 'eyebrow' }, `Kerala Legislative Assembly · ${cur}`),
      el('h1', { class: 'result-head', style: 'font-size:clamp(32px,6vw,58px);margin:8px 0 4px',
        html: `${cur} — ${ftext(wf, FRONT[wf].label)} ${held ? 'held power' : 'won'}` }),
      (function () {
        const g = el('div', { class: 'stats' });
        g.append(statCard(`${sf[wf]}`, `${wf} seats — largest`, wf));
        g.append(statCard(`${sf[runner]}`, `${runner} seats — runner-up`, runner));
        g.append(statCard(vf[wf] != null ? vf[wf] + '%' : '–', `${wf} vote share`));
        g.append(statCard(d.turnout + '%', 'Turnout'));
        g.append(statCard(`+${sf[wf] - sf[runner]}`, 'seat margin'));
        if (d.cm) g.append(statCard(d.cm, 'Chief Minister', null, true));
        return g;
      })());

    // charts
    document.getElementById('seatSrc').textContent = '140-seat house · ' + d.seat_src;
    makeChart('seatChart', {
      type: 'doughnut',
      data: { labels: ranked, datasets: [{ data: ranked.map(f => sf[f]),
        backgroundColor: ranked.map(f => FRONT[f].color), borderColor: 'transparent', borderWidth: 0, hoverOffset: 6 }] },
      options: { cutout: '62%', plugins: { legend: { position: 'bottom' },
        tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed} seats` } } } }
    });
    const vorder = FRONT_ORDER.filter(f => vf[f] != null && vf[f] > 0);
    makeChart('voteChart', {
      type: 'bar',
      data: { labels: vorder, datasets: [{ data: vorder.map(f => vf[f]), backgroundColor: vorder.map(f => FRONT[f].color), borderRadius: 4, maxBarThickness: 70 }] },
      options: { scales: { y: { title: { display: true, text: '% of valid votes' } }, x: { grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.label}: ${c.parsed.y}%` } } } }
    });

    // analysis
    document.getElementById('anHead').innerHTML = `${cur}: how it broke down`;
    const an = document.getElementById('analysis'); an.innerHTML = '';
    d.prose.forEach(p => an.append(el('p', {}, p)));

    // closest / biggest
    const cl = document.getElementById('closest'); cl.innerHTML = '';
    d.closest.forEach(x => cl.append(miniCard(x.name, `${x.winner} over ${x.runner}`, x.margin, frontOfSeat(d, x.no))));
    const bg = document.getElementById('biggest'); bg.innerHTML = '';
    d.biggest.forEach(x => bg.append(miniCard(x.name, `${x.winner} (${x.party})`, x.margin, frontOfSeat(d, x.no))));

    // ministry
    const m = document.getElementById('ministry'); m.innerHTML = '';
    if (d.cabinet && d.cabinet.length) {
      m.append(el('p', { style: 'margin-top:0', html: `<b>${d.cm || 'Chief Minister'}</b> led the Council of Ministers.` }));
      const cab = el('div', { class: 'cabinet' });
      d.cabinet.forEach(([a, b]) => { if (/^minister$|^#$/i.test(a) && !b) return;
        cab.append(el('div', { class: 'm', html: b ? `<b>${a}</b><span>${b}</span>` : `<b>${a}</b>` })); });
      m.append(cab);
    } else m.append(el('p', { class: 'note', style: 'border:0;margin:0;padding:0',
      html: `Ministry details were not recorded for ${cur}. The ${FRONT[wf].label} formed the government.` }));

    // table
    buildTable(document.getElementById('resultsTable'), d.seats, [
      { key: 'no', label: '#', num: true },
      { key: 'name', label: 'Constituency' },
      { key: 'winner', label: 'Winner' },
      { key: 'party', label: 'Party' },
      { key: 'front', label: 'Front', render: r => chip(r.front), sortVal: r => r.front },
      { key: 'winner_votes', label: 'Votes', num: true },
      { key: 'margin', label: 'Margin', num: true },
      { key: 'runner', label: 'Runner-up' },
      { key: 'turnout', label: 'Turnout', num: true, render: r => r.turnout != null ? r.turnout + '%' : '–' },
    ], { initialSort: { key: 'no', dir: 1 }, placeholder: 'Search constituency, winner or party…' });

    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function statCard(n, l, front, small) {
    return el('div', { class: 'stat' + (front ? ' win-' + front : '') },
      el('div', { class: 'n', style: small ? 'font-size:19px;font-family:var(--sans);font-weight:600' : '' }, n),
      el('div', { class: 'l' }, l));
  }
  function miniCard(place, who, val, front) {
    return el('div', { class: 'mini', style: `--c:${FRONT[front].color}` },
      el('div', { class: 'place' }, place),
      el('div', { class: 'who' }, who),
      el('div', { class: 'val', html: `${fmt(val)} <small>votes</small>` }));
  }
  function frontOfSeat(d, no) { const s = d.seats.find(x => x.no === no); return s ? s.front : 'OTH'; }

  render();
})();
