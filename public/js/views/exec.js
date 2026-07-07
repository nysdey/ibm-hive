/**
 * exec.js — Exec Hive View (full org by market)
 */
import { getPeople, getMarkets } from '../api.js';
import { openPerson } from '../panel.js';

export async function renderExec(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Exec Hive View</div>
      <div class="page-sub">Full organization — every bee in the hive, broken by market segment</div>
    </div>
    <div class="content">
      <div id="exec-stats" class="stat-row"></div>
      <div class="toolbar">
        <input class="search-box" id="execSearch" type="text" placeholder="Search any bee in the hive…"/>
        <select class="sort-select" id="execMarketFilter">
          <option value="">All Markets</option>
        </select>
      </div>
      <div id="exec-body"><div class="loading">Loading…</div></div>
    </div>
  `;

  const [markets, allPeople] = await Promise.all([
    getMarkets(),
    getPeople(),
  ]);

  // Populate market filter
  const sel = document.getElementById('execMarketFilter');
  markets.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    sel.appendChild(opt);
  });

  renderStats(markets, allPeople);

  let searchTerm   = '';
  let marketFilter = '';

  function redraw() {
    renderBody(markets, allPeople, searchTerm, marketFilter);
  }

  document.getElementById('execSearch')?.addEventListener('input', e => {
    searchTerm = e.target.value.toLowerCase();
    redraw();
  });
  sel?.addEventListener('change', e => {
    marketFilter = e.target.value;
    redraw();
  });

  redraw();
}

function renderStats(markets, people) {
  const el = document.getElementById('exec-stats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card"><div class="stat-num">${people.length}</div><div class="stat-label">Total People</div></div>
    ${markets.map(m => `
      <div class="stat-card">
        <div class="stat-num" style="color:${m.color}">${m.people_count}</div>
        <div class="stat-label">${m.name}</div>
      </div>
    `).join('')}
  `;
}

function renderBody(markets, allPeople, search, marketFilter) {
  const body = document.getElementById('exec-body');
  if (!body) return;

  const matchPeople = allPeople.filter(p => {
    const name = (p.first_name + ' ' + p.last_name).toLowerCase();
    const matchSearch = !search || name.includes(search) || p.role.toLowerCase().includes(search);
    const matchMarket = !marketFilter || p.market === marketFilter;
    return matchSearch && matchMarket;
  });

  const byMarket = {};
  markets.forEach(m => { byMarket[m.name] = { market: m, people: [] }; });
  matchPeople.forEach(p => {
    if (p.market && byMarket[p.market]) byMarket[p.market].people.push(p);
  });

  body.innerHTML = Object.values(byMarket)
    .filter(g => (marketFilter ? g.market.name === marketFilter : true) && g.people.length > 0)
    .map(g => renderMarketSection(g.market, g.people))
    .join('');

  body.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

function renderMarketSection(market, people) {
  // Chunk into honeycomb rows of 5
  const ROW_SIZE = 5;
  const rows = [];
  for (let i = 0; i < people.length; i += ROW_SIZE) {
    rows.push(people.slice(i, i + ROW_SIZE));
  }

  const hexRows = rows.map((row, ri) => `
    <div class="hex-row" style="${ri % 2 === 1 ? 'margin-left:42px' : ''}">
      ${row.map(p => `
        <div class="hex-wrap" data-person-id="${p.id}">
          <div class="hex" style="background:${p.is_current_user ? 'var(--ibm-blue)' : p.color}">
            <div class="hex-name">${p.first_name} ${p.last_name.charAt(0)}.</div>
            <div class="hex-role">${p.role_type.toUpperCase()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <div class="exec-section">
      <div class="exec-title">
        <svg width="14" height="16" viewBox="0 0 14 16">
          <polygon points="7,0.5 13.5,4 13.5,12 7,15.5 0.5,12 0.5,4" fill="${market.color}"/>
        </svg>
        ${market.name} Market
        <span class="exec-badge" style="background:${market.color};${market.name==='Territory'?'color:#161616':''}">${people.length} people</span>
      </div>
      <div class="hive-container" style="flex-direction:column;align-items:flex-start">
        ${hexRows}
      </div>
    </div>
  `;
}
