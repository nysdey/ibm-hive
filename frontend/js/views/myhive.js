/**
 * myhive.js — My Hive: personal collections of people
 *
 * Users can create named groups (e.g. "PowerVS Experts", "Deal Team")
 * and add anyone from the org into them. Each collection is visualized
 * as a small connected map.
 */
import { getPeople } from '../api.js';

const STORAGE_KEY = 'ibm-hive-collections';

function loadCollections() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCollections(cols) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cols));
}

let _all = [];
let _cols = [];
let _activeCol = null;

export async function renderMyHive(container) {
  _all  = await getPeople();
  _cols = loadCollections();

  // Seed a demo collection if empty
  if (!_cols.length) {
    const me = _all.find(p => p.is_current_user);
    const markH   = _all.find(p => p.first_name === 'Mark'   && p.last_name === 'Hoffman');
    const armada  = _all.find(p => p.first_name === 'Armada' && p.last_name === 'Veraepalli');
    const rossH   = _all.find(p => p.first_name === 'Ross'   && p.last_name === 'Holley');
    const patrickM= _all.find(p => p.first_name === 'Patrick'&& p.last_name === 'McBride');
    _cols = [
      {
        id: 'powervs-team',
        name: 'PowerVS Team',
        desc: 'Core team covering PowerVS accounts',
        personIds: [me, markH, armada, rossH, patrickM].filter(Boolean).map(p => p.id),
        color: '#a855f7',
      },
    ];
    saveCollections(_cols);
  }

  _activeCol = _cols[0]?.id ?? null;
  renderShell(container);
}

function renderShell(container) {
  container.innerHTML = `
    <div class="mh-page">
      <div class="mh-sidebar">
        <div class="mh-sidebar-header">
          <span class="mh-sidebar-title">My Hive</span>
          <button class="mh-new-btn" id="mhNewBtn">+ New</button>
        </div>
        <div class="mh-col-list" id="mhColList"></div>
      </div>
      <div class="mh-main" id="mhMain">
        <!-- Collection detail rendered here -->
      </div>
    </div>
  `;

  container.querySelector('#mhNewBtn').addEventListener('click', () => {
    const name = prompt('Collection name:');
    if (!name?.trim()) return;
    const col = { id: Date.now().toString(), name: name.trim(), desc: '', personIds: [], color: '#6c63ff' };
    _cols.push(col);
    saveCollections(_cols);
    _activeCol = col.id;
    renderShell(container);
  });

  renderColList(container);
  renderActiveCol(container);
}

function renderColList(container) {
  const list = container.querySelector('#mhColList');
  list.innerHTML = _cols.map(col => `
    <div class="mh-col-item${col.id === _activeCol ? ' active' : ''}" data-col-id="${col.id}">
      <span class="mh-col-dot" style="background:${col.color}"></span>
      <span class="mh-col-name">${col.name}</span>
      <span class="mh-col-count">${col.personIds.length}</span>
    </div>
  `).join('');

  list.querySelectorAll('.mh-col-item').forEach(el => {
    el.addEventListener('click', () => {
      _activeCol = el.dataset.colId;
      list.querySelectorAll('.mh-col-item').forEach(x => x.classList.remove('active'));
      el.classList.add('active');
      renderActiveCol(container);
    });
  });
}

function renderActiveCol(container) {
  const main = container.querySelector('#mhMain');
  if (!main) return;
  const col = _cols.find(c => c.id === _activeCol);
  if (!col) {
    main.innerHTML = `<div class="mh-empty">Select or create a collection.</div>`;
    return;
  }

  const members = _all.filter(p => col.personIds.includes(p.id));
  const allIds  = new Set(col.personIds);

  main.innerHTML = `
    <div class="mh-col-detail">
      <div class="mh-col-header">
        <div>
          <div class="mh-col-header-name" style="color:${col.color}">${col.name}</div>
          <div class="mh-col-header-desc">${col.desc || 'No description'}</div>
        </div>
        <button class="mh-add-btn" id="mhAddBtn">+ Add person</button>
      </div>

      ${members.length === 0 ? `
        <div class="mh-empty">No people yet. Click "+ Add person" to start.</div>
      ` : `
        <div class="mh-member-grid">
          ${members.map(p => memberCard(p, col.color)).join('')}
        </div>
      `}

      <div class="mh-add-panel" id="mhAddPanel" style="display:none">
        <input type="text" id="mhAddSearch" class="mh-add-search" placeholder="Search people…"/>
        <div class="mh-add-results" id="mhAddResults"></div>
      </div>
    </div>
  `;

  main.querySelector('#mhAddBtn').addEventListener('click', () => {
    const panel = main.querySelector('#mhAddPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
      renderAddResults(main, col, '');
      main.querySelector('#mhAddSearch').focus();
    }
  });

  main.querySelector('#mhAddSearch')?.addEventListener('input', e => {
    renderAddResults(main, col, e.target.value.toLowerCase());
  });

  main.querySelectorAll('[data-remove-pid]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pid = parseInt(btn.dataset.removePid);
      col.personIds = col.personIds.filter(id => id !== pid);
      saveCollections(_cols);
      renderActiveCol(container);
    });
  });
}

function renderAddResults(main, col, q) {
  const results = main.querySelector('#mhAddResults');
  const filtered = _all.filter(p => {
    if (col.personIds.includes(p.id)) return false;
    const name = `${p.first_name} ${p.last_name} ${p.role || ''}`.toLowerCase();
    return !q || name.includes(q);
  }).slice(0, 12);

  results.innerHTML = filtered.map(p => `
    <div class="mh-add-result" data-add-pid="${p.id}">
      <span class="mh-ar-name">${p.first_name} ${p.last_name}</span>
      <span class="mh-ar-role">${p.role || '—'}</span>
      <span class="mh-ar-add">+ Add</span>
    </div>
  `).join('');

  results.querySelectorAll('[data-add-pid]').forEach(el => {
    el.addEventListener('click', () => {
      const pid = parseInt(el.dataset.addPid);
      if (!col.personIds.includes(pid)) col.personIds.push(pid);
      saveCollections(_cols);
      // Re-render without closing panel
      const container = main.closest('.mh-page')?.parentElement;
      if (container) renderActiveCol(container.closest('[id^="view-"]') || container);
      else renderActiveCol({ querySelector: (s) => main.closest('.mh-page').querySelector(s) });
    });
  });
}

function memberCard(p, accentColor) {
  return `
    <div class="mh-member-card">
      <div class="mh-mc-hex" style="background:#1c1c1c;border-color:${accentColor}"></div>
      <div class="mh-mc-body">
        <div class="mh-mc-name">${p.first_name} ${p.last_name}</div>
        <div class="mh-mc-role">${p.role || '—'}</div>
        <div class="mh-mc-meta">${p.market || ''} · ${p.comb?.replace(' Colony','') || ''}</div>
      </div>
      <button class="mh-mc-remove" data-remove-pid="${p.id}" title="Remove">✕</button>
    </div>
  `;
}
