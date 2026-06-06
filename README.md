# Kerala Elections

A static, data-driven reference site for Kerala Legislative Assembly elections (1982–2026),
the 2024 Lok Sabha result in Kerala, and recent Assembly by-elections.

**Live:** https://thunacare-alt.github.io/kerala-elections/

## What's here
- **Home** — seats-by-front 1982–2026, front vote-share and turnout over time, plus the long-view analysis.
- **Assembly Elections** — per-election pages: full sortable/searchable constituency table, front seats + vote-share charts, the government formed, and a data-derived analysis (result, swing vs the previous election, closest and largest-margin contests, turnout).
- **Lok Sabha 2024** — Kerala's 20 seats, party tally and analysis.
- **By-elections** — 16 Assembly by-elections (2012–2025).
- **About & Sources** — data source, methodology and caveats.

## Data
All figures are derived from [keralaassembly.org](http://www.keralaassembly.org/), an **unofficial
database based on official figures**. The site is fully static — pages were collected, parsed into
spreadsheets, then converted to the compact JSON in [`data/`](data/). Nothing is scraped at view time.

The written analyses are **AI-assisted**: prose is generated from the data, but every number
(seats, vote shares, margins, swings, turnout) is computed directly from the workbooks. Not an
official source — verify against Election Commission records before citing.

## Tech
Plain HTML/CSS/JS, no build step. [Chart.js](https://www.chartjs.org/) via CDN. Served from the
repository root via GitHub Pages.
