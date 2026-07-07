/**
 * people.js — People directory view
 *
 * A searchable, filterable grid of all IBM Hive people.
 * Click a person card to open the detail slide-over panel.
 */
import { getPeople } from '../api.js';
import { openPerson } from '../panel.js';

const ROLE_COLOR = {
  exec:     '#7c3aed',
  director: '#9333ea',
  manager:  '#6c63ff',
  bss:      '#2563eb',
  bts:      '#0e7490',
  intern:   '#4d7bff',
  csm:      '#0f766e',
  sdr:      '#1d4ed8',
  partner:  '#7e22ce',
  other:    '#2a2a2a',
};

const ROLE_LABEL = {
  exec:'VP / Executive', director:'Director', manager:'Manager',
  bss:'Brand Sales Spec.', bts:'Brand Tech. Sales', intern:'Intern',
  csm:'Customer Success', sdr:'SDR', partner:'Partner', other:'—',
};

const COLONY_COLOR = {
  'Data & AI Colony':      '#0f62fe',
  'Automation Colony':     '#6c63ff',
  'Sustainability Colony': '#24a148',
  'Security Colony':       '#da1e28',
  'Infrastructure Colony': '#a855f7',
  'Hybrid Cloud Colony':   '#ee5396',
};

function svgHex(cx, cy, r, fill, stroke, sw) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 3 * i - Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function personCard(p) {
  const name     = `${p.first_name} ${p.last_name}`;
  const roleCol  = ROLE_COLOR[p.role_type] || '#2a2a2a';
  const colCol   = COLONY_COLOR[p.comb]    || '#333';
  const isMe     = p.is_current_user;

  // Pointy-top hex avatar — 44×50px
  const cx = 22, cy = 25, r = 20;
  const hexFill   = isMe ? '#1a2e5e' : roleCol;
  const hexStroke = isMe ? 'rgba(77,123,255,0.8)' : `${roleCol}66`;
  const hexSvg    = svgHex(cx, cy, r, hexFill, hexStroke, isMe ? 1.5 : 0.8);

  return `
    <div class="people-card${isMe ? ' people-card-me' : ''}" data-person-id="${p.id}">
      <div class="pc-top">
        <svg class="pc-avatar-hex" width="44" height="50" viewBox="0 0 44 50">
          ${hexSvg}
          ${isMe ? svgHex(cx, cy, r - 4, 'none', 'rgba(77,123,255,0.3)', 0.8) : ''}
        </svg>
        <div class="pc-info">
          <div class="pc-name">${name}${isMe ? ' <span class="pc-you">You</span>' : ''}</div>
          <div class="pc-role">${p.role || ROLE_LABEL[p.role_type] || '—'}</div>
          ${p.comb ? `<div class="pc-colony" style="color:${colCol}">${p.comb.replace(' Colony','')}</div>` : ''}
        </div>
      </div>
      <div class="pc-meta">
        ${p.market ? `<span class="pc-badge pc-badge-market">${p.market}</span>` : ''}
        ${p.location ? `<span class="pc-badge">${p.location}</span>` : ''}
      </div>
    </div>
  `;
}

let _people = [];
let _filter = { q: '', colony: '', market: '', role: '' };

export async function renderPeople(container) {
  container.innerHTML = `
    <div class="res-page">
      <div class="res-header" style="padding:18px 24px 14px">
        <div style="font-size:18px;font-weight:300;letter-spacing:-0.2px;margin-bottom:4px">People</div>
        <div style="font-size:12px;color:#525252">Find anyone across IBM Hive</div>
      </div>
      <div class="people-toolbar">
        <input type="text" id="peopleSearch" class="search-box" placeholder="Search by name, role, location…" style="max-width:280px"/>
        <select id="peopleColony" class="sort-select">
          <option value="">All portfolios</option>
          <option>Data & AI Colony</option>
          <option>Automation Colony</option>
          <option>Sustainability Colony</option>
          <option>Security Colony</option>
          <option>Infrastructure Colony</option>
          <option>Hybrid Cloud Colony</option>
        </select>
        <select id="peopleMarket" class="sort-select">
          <option value="">All markets</option>
          <option>Enterprise</option>
          <option>Strategic</option>
          <option>Horizon</option>
          <option>Territory</option>
        </select>
        <select id="peopleRole" class="sort-select">
          <option value="">All roles</option>
          <option value="exec">VP / Executive</option>
          <option value="director">Director</option>
          <option value="manager">Manager</option>
          <option value="bss">Brand Sales Spec.</option>
          <option value="bts">Brand Tech. Sales</option>
          <option value="csm">Customer Success</option>
          <option value="intern">Intern</option>
          <option value="sdr">SDR</option>
          <option value="partner">Partner</option>
        </select>
        <span id="peopleCount" style="margin-left:auto;font-size:12px;color:#525252"></span>
      </div>
      <div class="people-grid" id="peopleGrid">
        <div class="loading">Loading…</div>
      </div>
    </div>
  `;

  _people = await getPeople();

  // Wire filters
  container.querySelector('#peopleSearch').addEventListener('input', e => {
    _filter.q = e.target.value.toLowerCase().trim();
    renderGrid();
  });
  container.querySelector('#peopleColony').addEventListener('change', e => {
    _filter.colony = e.target.value;
    renderGrid();
  });
  container.querySelector('#peopleMarket').addEventListener('change', e => {
    _filter.market = e.target.value;
    renderGrid();
  });
  container.querySelector('#peopleRole').addEventListener('change', e => {
    _filter.role = e.target.value;
    renderGrid();
  });

  // Sidebar filter integration
  document.addEventListener('sidebar:filter', e => {
    const { group, value } = e.detail;
    if (group === 'people-all') {
      _filter = { q:'', colony:'', market:'', role:'' };
      renderGrid();
    } else if (group === 'people-my-org') {
      // Filter to Sydney's colony
      const me = _people.find(p => p.is_current_user);
      _filter.colony = me?.comb || '';
      renderGrid();
    }
  });

  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('peopleGrid');
  const countEl = document.getElementById('peopleCount');
  if (!grid) return;

  let visible = _people;

  if (_filter.q) {
    visible = visible.filter(p => {
      const name = `${p.first_name} ${p.last_name} ${p.role || ''} ${p.location || ''}`.toLowerCase();
      return name.includes(_filter.q);
    });
  }
  if (_filter.colony) visible = visible.filter(p => p.comb === _filter.colony);
  if (_filter.market) visible = visible.filter(p => p.market === _filter.market);
  if (_filter.role)   visible = visible.filter(p => p.role_type === _filter.role);

  if (countEl) countEl.textContent = `${visible.length} people`;

  if (visible.length === 0) {
    grid.innerHTML = `<div class="loading" style="color:#525252">No people match your filters.</div>`;
    return;
  }

  grid.innerHTML = visible.map(personCard).join('');

  grid.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}
