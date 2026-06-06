(async function () {
  initPage('explorer');
  let data;
  try { data = (await loadJSON('data/explorer.json')).constituencies; }
  catch (e) { document.getElementById('result').append(el('div', { class: 'err' }, 'Could not load data: ' + e.message)); return; }
  const byName = new Map(data.map(c => [c.name.toLowerCase(), c]));

  const q = document.getElementById('q'), sug = document.getElementById('sug'), result = document.getElementById('result');
  let matches = [], hi = -1;

  function search(term) {
    term = term.trim().toLowerCase();
    if (!term) return [];
    const starts = [], has = [];
    for (const c of data) {
      const n = c.name.toLowerCase();
      if (n.startsWith(term)) starts.push(c);
      else if (n.includes(term)) has.push(c);
    }
    return starts.concat(has).slice(0, 10);
  }
  function showSug() {
    sug.innerHTML = '';
    if (!matches.length) { sug.classList.remove('open'); return; }
    matches.forEach((c, i) => sug.append(el('div', { class: i === hi ? 'hi' : '',
      onmousedown: e => { e.preventDefault(); pick(c.name); } },
      `${c.name} · ${c.rows.length} election${c.rows.length > 1 ? 's' : ''}`)));
    sug.classList.add('open');
  }
  q.addEventListener('input', () => { matches = search(q.value); hi = -1; showSug(); });
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { hi = Math.min(hi + 1, matches.length - 1); showSug(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { hi = Math.max(hi - 1, 0); showSug(); e.preventDefault(); }
    else if (e.key === 'Enter') { if (matches[hi]) pick(matches[hi].name); else if (matches[0]) pick(matches[0].name); }
    else if (e.key === 'Escape') { sug.classList.remove('open'); }
  });
  document.addEventListener('click', e => { if (!sug.contains(e.target) && e.target !== q) sug.classList.remove('open'); });

  function pick(name) {
    q.value = name; sug.classList.remove('open');
    history.replaceState(null, '', `explorer.html?c=${encodeURIComponent(name)}`);
    render(byName.get(name.toLowerCase()));
  }

  function render(c) {
    result.innerHTML = '';
    if (!c) { result.append(el('div', { class: 'empty' }, 'No constituency found by that name.')); return; }
    const wins = {};
    c.rows.forEach(r => wins[r.front] = (wins[r.front] || 0) + 1);
    const summary = FRONT_ORDER.filter(f => wins[f]).map(f => `${ftext(f)} ${wins[f]}`).join(' · ');

    result.append(
      el('div', { class: 'eyebrow' }, 'Constituency'),
      el('h2', { class: 'section-h', style: 'margin:6px 0 2px' }, c.name),
      el('p', { class: 'section-lead', html:
        `Won across <b>${c.rows.length}</b> election${c.rows.length > 1 ? 's' : ''} (${c.rows[0].year}–${c.rows[c.rows.length - 1].year}) — by front: ${summary}.` }));

    const tl = el('div', { class: 'timeline' });
    c.rows.slice().reverse().forEach(r => {
      tl.append(el('div', { class: 'tl-row reveal in', style: `--c:${FRONT[r.front].color}` },
        el('div', { class: 'y' }, String(r.year)),
        el('div', { class: 'w', html: `${r.winner} <small>· ${r.party} ${chip(r.front)}</small>` }),
        el('div', { class: 'm', html: r.margin != null ? `${fmt(r.margin)}<small>vote margin</small>` : '<small>—</small>' })));
    });
    result.append(tl);
    result.append(el('p', { class: 'note' },
      'Constituency names and boundaries were redrawn in the 2008 delimitation (effective 2011); a seat may appear under a slightly different name for the earlier and later periods, and some seats existed only in one era.'));
  }

  // deep-link or sensible default
  const initial = new URLSearchParams(location.search).get('c');
  if (initial && byName.has(initial.toLowerCase())) pick(initial);
  else if (byName.has('puthuppally')) pick('Puthuppally');
})();
