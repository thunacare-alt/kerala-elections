# Kerala Elections

A visual history of Kerala's elections — every Legislative Assembly election from **1982 to 2026**, the **2024 Lok Sabha** result in the state, and recent Assembly **by-elections**. Mapped seat by seat, with charts and analysis.

**Live:** https://thunacare-alt.github.io/kerala-elections/

## Sections
- **Home** — seats by front across every election, vote-share and turnout trends, and the long-view analysis.
- **Elections** — per-election pages: a full sortable/searchable 140-seat table, front-seats and vote-share charts, the government formed, closest and widest margins, and the story of the result.
- **Constituency Explorer** — search any seat and trace its winner, party and margin across every election since 1982.
- **Lok Sabha 2024** — Kerala's 20 parliamentary seats.
- **By-elections** — sixteen mid-term Assembly contests, 2012–2025.

## How figures are computed
Everything is derived from constituency-level results. Turnout is valid votes ÷ electorate (uniform across years); vote share by front sums party votes into fronts; seats by front use each winner's front (recorded per seat from 2011, and grouped by winning party for 1982–2006, validated against the known front tallies for 1982, 1987, 1996 and 2001). See the in-site **About** page for caveats (delimitation, pre-2011 turnout/NOTA availability, shifting front alignments).

## Tech
Plain static HTML / CSS / JS — no build step. Typography: Fraunces + Inter. Charts: Chart.js via CDN. Served from the repository root on GitHub Pages. Front colours: LDF `#E03131`, UDF `#1971C2`, NDA `#F08C00`, Others `#868E96`.
