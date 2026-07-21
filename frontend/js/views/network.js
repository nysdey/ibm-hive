/**
 * network.js — My Combs tab
 *
 * DATA MODEL (normalized)
 * ───────────────────────
 * A "bee" (person) exists exactly once in a global registry. Combs reference
 * people by id; connections are a global list of edges. This is deliberately
 * NOT the old shape (full bee objects duplicated inside every comb), which let
 * membership and connection data diverge and leak between combs.
 *
 *   _data = {
 *     people:      [ { id, name, role, company, email, location,
 *                      relationship, metThrough, notes:[] } ],
 *     connections: [ { id, source, target, type:'direct'|'indirect', note } ],
 *     combs:       [ { id, name, description, memberIds:[], layout:{ [id]:{x,y} } } ],
 *     allBeesLayout: { [id]:{x,y} }        // positions for the "All Bees" view
 *   }
 *
 * Consequences that fix the reported bug:
 *   • Adding a person to a comb, or connecting two people, never pulls that
 *     person's other connections into the comb — a connection line only renders
 *     when BOTH endpoints are members of the comb being viewed.
 *   • Editing a person updates the single record everywhere.
 *
 * PERSISTENCE
 * ───────────
 * The whole graph is saved per-user on the server (PUT /api/hive), with a
 * localStorage cache for instant loads. Legacy anonymous localStorage from the
 * old shape is migrated up on first use.
 */

import { getHive, saveHive, getToken } from '../api.js';
import { currentUser }                 from '../app.js';

// ── Persistence keys ──────────────────────────────────────────────
const LEGACY_KEY  = 'ibm_hive_combs_v1';       // old anonymous shape
const ALL_BEES_ID = '__all_bees__';
const SELF_ID     = '__me__';

function cacheKey() {
  const u = currentUser();
  return `ibm_hive_state_v2_${u ? u.id : 'anon'}`;
}

function emptyData() {
  return { people: [], connections: [], combs: [], allBeesLayout: {} };
}

/** Guarantee every expected field exists so the rest of the code is total. */
function normalizeData(d) {
  const data = d && typeof d === 'object' ? d : {};
  data.people        = Array.isArray(data.people) ? data.people : [];
  data.connections   = Array.isArray(data.connections) ? data.connections : [];
  data.connections.forEach(c => {
    if (c.type === 'mutual') c.type = 'direct';
    else if (c.type === 'transient') c.type = 'indirect';
    else if (c.type !== 'indirect') c.type = 'direct';
  });
  data.combs         = Array.isArray(data.combs) ? data.combs : [];
  data.allBeesLayout = data.allBeesLayout && typeof data.allBeesLayout === 'object' ? data.allBeesLayout : {};
  data.combs.forEach(c => {
    if (!Array.isArray(c.memberIds)) c.memberIds = [];
    if (!c.layout || typeof c.layout !== 'object') c.layout = {};
  });
  return data;
}

/**
 * Convert the legacy `{ combs:[{ bees:[{...,connections}] }] }` shape into the
 * normalized model. Because a person could be duplicated across combs with
 * divergent fields, we MERGE duplicates (prefer non-empty fields, union notes
 * and connections) — this also repairs old data corruption.
 */
function migrateLegacy(legacy) {
  const data = emptyData();
  if (!legacy || !Array.isArray(legacy.combs)) return data;

  const byId = {};
  const connSeen = new Set();

  (legacy.combs || []).forEach(comb => {
    if (comb.id === ALL_BEES_ID) return;
    const newComb = { id: comb.id || uid(), name: comb.name || 'Comb', description: comb.description || '', memberIds: [], layout: {} };

    (comb.bees || []).forEach(bee => {
      if (!bee || !bee.id) return;

      // Merge person record
      const existing = byId[bee.id];
      if (!existing) {
        byId[bee.id] = {
          id: bee.id,
          name: bee.name || '',
          role: bee.role || '',
          company: bee.company || '',
          email: bee.email || '',
          location: bee.location || '',
          relationship: bee.relationship || '',
          metThrough: bee.metThrough || '',
          notes: normaliseNotes(bee.notes),
        };
      } else {
        const p = byId[bee.id];
        for (const k of ['name', 'role', 'company', 'email', 'location', 'relationship', 'metThrough']) {
          if (!p[k] && bee[k]) p[k] = bee[k];
        }
        const extra = normaliseNotes(bee.notes);
        if (extra.length) p.notes = [...p.notes, ...extra];
      }

      // Membership + layout
      if (!newComb.memberIds.includes(bee.id)) newComb.memberIds.push(bee.id);
      if (typeof bee.x === 'number' && typeof bee.y === 'number') newComb.layout[bee.id] = { x: bee.x, y: bee.y };

      // Connections
      (bee.connections || []).forEach(c => {
        if (!c || !c.targetId) return;
        const type = c.type === 'transient' || c.type === 'indirect' ? 'indirect' : 'direct';
        const key = type === 'direct'
          ? [bee.id, c.targetId].sort().join('|') + '|m'
          : `${bee.id}|${c.targetId}|t`;
        if (connSeen.has(key)) return;
        connSeen.add(key);
        data.connections.push({ id: uid(), source: bee.id, target: c.targetId, type, note: c.note || '' });
      });
    });

    data.combs.push(newComb);
  });

  data.people = Object.values(byId);
  // Drop connections whose endpoints no longer exist.
  data.connections = data.connections.filter(c => byId[c.source] && byId[c.target]);
  return data;
}

function readCache() {
  try {
    const raw = localStorage.getItem(cacheKey());
    if (raw) return normalizeData(JSON.parse(raw));
  } catch {}
  return null;
}

function writeCache(data) {
  try { localStorage.setItem(cacheKey(), JSON.stringify(data)); } catch {}
}

/** Load: server when signed in, otherwise localStorage; with legacy migration. */
async function loadData() {
  let data = null;

  // Login is optional right now — only hit the server if we actually have a token.
  if (getToken()) {
    try {
      const res = await getHive();
      if (res && res.data) data = normalizeData(res.data);
    } catch (e) {
      console.warn('Could not load hive from server:', e.message);
      const cached = readCache();
      if (cached) return cached;
    }
  } else {
    const cached = readCache();
    if (cached) return cached;
  }

  if (!data) {
    // Nothing on the server yet. Migrate legacy anonymous data if present.
    let legacyRaw = null;
    try { legacyRaw = localStorage.getItem(LEGACY_KEY); } catch {}
    if (legacyRaw) {
      try {
        data = migrateLegacy(JSON.parse(legacyRaw));
        // Push the migrated data up and retire the legacy key so it can't be
        // re-migrated into a different account later.
        writeCache(data);
        try { await saveHive(serializable(data)); localStorage.removeItem(LEGACY_KEY); } catch {}
        return data;
      } catch { data = null; }
    }
  }

  if (!data) data = readCache() || emptyData();
  writeCache(data);
  return data;
}

// Server sync is debounced so rapid edits (typing a note, dragging) coalesce.
let _saveTimer = null;
function saveData(data) {
  writeCache(data);
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(pushToServer, 500);
}

function serializable(data) {
  return {
    people: data.people,
    connections: data.connections,
    combs: data.combs.map(c => ({ id: c.id, name: c.name, description: c.description, memberIds: c.memberIds, layout: c.layout })),
    allBeesLayout: data.allBeesLayout,
  };
}

async function pushToServer() {
  if (!getToken()) return; // login-less: localStorage cache only
  try {
    await saveHive(serializable(_data));
  } catch (e) {
    console.warn('Could not save hive to server:', e.message);
  }
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Normalized-model accessors ────────────────────────────────────
function personIndex() {
  const m = {};
  _data.people.forEach(p => { m[p.id] = p; });
  return m;
}
function getPerson(id) { return _data.people.find(p => p.id === id) || null; }

function realCombs() { return _data.combs; }

/** People in a comb. All Bees is the complete people directory, including bees
 * that have not been assigned to a comb yet. */
function membersOf(comb) {
  if (!comb) return [];
  if (comb.id === ALL_BEES_ID) {
    return _data.people.slice();
  }
  const idx = personIndex();
  return comb.memberIds.map(id => idx[id]).filter(Boolean);
}

/** The layout map (persisted positions) for a comb / the All Bees view. */
function layoutFor(comb) {
  if (!comb || comb.id === ALL_BEES_ID) return _data.allBeesLayout;
  return comb.layout;
}

/** Real combs a person belongs to. */
function combsForBee(beeId) {
  return _data.combs.filter(c => c.memberIds.includes(beeId));
}

/** The list of combs shown in the sidebar, with the virtual "All Bees" first. */
function combList() {
  return [
    { id: ALL_BEES_ID, name: 'All Bees', _virtual: true },
    ..._data.combs,
  ];
}

function combById(id) {
  if (id === ALL_BEES_ID) return { id: ALL_BEES_ID, name: 'All Bees', _virtual: true };
  return _data.combs.find(c => c.id === id) || null;
}

// ── Connection helpers ────────────────────────────────────────────
function addConnectionEdge(source, target, type, note) {
  if (!source || !target || source === target) return;
  const t = type === 'indirect' || type === 'transient' ? 'indirect' : 'direct';
  const dup = _data.connections.some(c =>
    c.type === t && (
      (c.source === source && c.target === target) ||
      (c.source === target && c.target === source)
    ));
  if (dup) return;
  _data.connections.push({ id: uid(), source, target, type: t, note: note || '' });
}

/** Every direct or indirect tie involving this bee. */
function connectionsForPerson(id) {
  return _data.connections.filter(c => c.source === id || c.target === id);
}

function removePerson(id) {
  _data.people = _data.people.filter(p => p.id !== id);
  _data.connections = _data.connections.filter(c => c.source !== id && c.target !== id);
  _data.combs.forEach(c => {
    c.memberIds = c.memberIds.filter(m => m !== id);
    delete c.layout[id];
  });
  delete _data.allBeesLayout[id];
}

/** Remove a person from one comb; if they end up in no comb, purge them entirely. */
function removeFromComb(id, combId) {
  const comb = _data.combs.find(c => c.id === combId);
  if (comb) {
    comb.memberIds = comb.memberIds.filter(m => m !== id);
    delete comb.layout[id];
  }
  if (combsForBee(id).length === 0) removePerson(id);
}

// ── Hex geometry (point-up) ───────────────────────────────────────
const R   = 60;
const W   = R * Math.sqrt(3);
const H   = R * 2;
const GAP = 14;

function hexPts(cx, cy, r) {
  r = r || R;
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/**
 * Render a stack of text lines centered as a single block on (cx, cy).
 */
function hexTextBlock(cx, cy, lines) {
  const withH  = lines.map(l => ({ ...l, h: l.size + 4 }));
  const totalH = withH.reduce((sum, l) => sum + l.h, 0);
  let cursor = cy - totalH / 2;
  return withH.map(l => {
    const lineCY = cursor + l.h / 2;
    cursor += l.h;
    return `<text x="${cx.toFixed(1)}" y="${lineCY.toFixed(1)}" text-anchor="middle"
      dominant-baseline="central" fill="${l.color}" font-size="${l.size}"
      font-weight="${l.weight || 400}"
      font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${l.text}</text>`;
  }).join('');
}

function spiralPositions(count) {
  const step = W + GAP;
  const vert = H * 0.75 + GAP;
  const positions = [];
  let ring = 1;
  while (positions.length < count) {
    let q = ring, r2 = 0, s = -ring;
    const cubeToXY = (q, r2) => ({ cx: step * (q + r2 * 0.5), cy: vert * r2 });
    const dirs = [[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1],[1,-1,0],[1,0,-1]];
    for (let d = 0; d < 6; d++) {
      for (let i = 0; i < ring; i++) {
        positions.push(cubeToXY(q, r2));
        q += dirs[d][0]; r2 += dirs[d][1]; s += dirs[d][2];
      }
    }
    ring++;
  }
  return positions.slice(0, count);
}

// ── Module state ──────────────────────────────────────────────────
let _data             = emptyData();
let _activeComb       = ALL_BEES_ID;
let _container        = null;
let _selected         = null;
let _drag             = null;
let _ox               = 0;
let _oy               = 0;
let _sidebarCollapsed = false;
let _detailBee        = null;
let _detailOwner      = null;
let _searchQuery      = '';
let _scale            = 1;          // zoom level
let _pan              = { x: 0, y: 0 }; // canvas pan
let _isPanning        = false;
let _panMoved         = false;
let _panStart         = { x: 0, y: 0 };
let _panStartClient   = { x: 0, y: 0 };
let _allBeesView      = 'hive';     // 'hive' | 'list'

// ── Entry ─────────────────────────────────────────────────────────
export async function renderNetwork(container) {
  _container   = container;
  _selected    = null;
  _drag        = null;
  _detailBee   = null;
  _detailOwner = null;

  if (!_activeComb) _activeComb = ALL_BEES_ID;

  container.innerHTML = `
    <div class="nw-page">
      <div class="nw-body">

        <!-- Left sidebar -->
        <div class="nw-combs-sidebar${_sidebarCollapsed ? ' collapsed' : ''}" id="nwCombsSidebar">
          <div class="nw-sidebar-search-wrap">
            <svg class="nw-sidebar-search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#525252" stroke-width="1.5"/>
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#525252" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input class="nw-sidebar-search" id="nwSearch" type="text"
              placeholder="Search bees…" value="${esc(_searchQuery)}"/>
          </div>
          <div class="nw-comb-list" id="nwCombList"></div>
          <div class="nw-sidebar-actions">
            <button class="nw-sidebar-action-btn" id="nwAddBee">+ Add a bee</button>
            <button class="nw-sidebar-action-btn" id="nwNewComb">+ Add a comb</button>
          </div>
        </div>

        <!-- Collapse/expand edge tab -->
        <button class="nw-sidebar-edge-tab" id="nwEdgeTab"
          title="${_sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar">
          <span id="nwEdgeTabIcon">${_sidebarCollapsed ? '›' : '‹'}</span>
        </button>

        <!-- Canvas + detail panel wrapper -->
        <div class="nw-canvas-detail-wrap">

          <!-- Canvas area -->
          <div class="nw-canvas-area">

            <!-- Zoom toolbar -->
            <div class="nw-zoom-bar">
              <button class="nw-zoom-btn" id="nwZoomIn"  title="Zoom in">+</button>
              <button class="nw-zoom-btn" id="nwZoomReset" title="Reset zoom">⊙</button>
              <button class="nw-zoom-btn" id="nwZoomOut" title="Zoom out">−</button>
            </div>

            <!-- Hive / List toggle (only shown for All Bees) -->
            <div class="nw-view-toggle" id="nwViewToggle"
              style="display:${_activeComb === ALL_BEES_ID ? 'flex' : 'none'}">
              <button class="nw-view-toggle-btn${_allBeesView === 'hive' ? ' active' : ''}"
                id="nwToggleHive">Hive</button>
              <button class="nw-view-toggle-btn${_allBeesView === 'list' ? ' active' : ''}"
                id="nwToggleList">List</button>
            </div>

            <div class="nw-canvas-wrap" id="nwCanvasWrap"></div>
          </div>

          <!-- Bee detail panel -->
          <div class="nw-detail-panel" id="nwDetailPanel">
            <div class="nw-dp-header" id="nwDpHeader">
              <div class="nw-dp-title">
                <div class="nw-dp-name" id="nwDpName">—</div>
                <div class="nw-dp-role" id="nwDpRole">—</div>
                <div class="nw-dp-rel"  id="nwDpRel" style="display:none"></div>
              </div>
              <div class="nw-dp-menu-wrap">
                <button class="nw-dp-menu-trigger" id="nwDpMenuTrigger" aria-label="Bee options">⋮</button>
                <div class="nw-dp-menu" id="nwDpMenu">
                  <button id="nwDpEdit">Edit bee</button>
                  <button id="nwDpAddFrom">Add connected bee</button>
                  <button id="nwDpAddConn">Add connection</button>
                  <button id="nwDpDelete">Delete bee</button>
                </div>
              </div>
              <button class="nw-dp-close" id="nwDpClose">✕</button>
            </div>
            <div class="nw-dp-body" id="nwDpBody"></div>
          </div>

        </div>
      </div>
    </div>
  `;

  // Edge tab
  document.getElementById('nwEdgeTab').addEventListener('click', () => {
    _sidebarCollapsed = !_sidebarCollapsed;
    document.getElementById('nwCombsSidebar').classList.toggle('collapsed', _sidebarCollapsed);
    document.getElementById('nwEdgeTab').title = _sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';
    document.getElementById('nwEdgeTabIcon').textContent = _sidebarCollapsed ? '›' : '‹';
  });

  // Search
  document.getElementById('nwSearch').addEventListener('input', e => {
    _searchQuery = e.target.value;
    renderSidebar();
    renderCanvas();
  });

  // Add a comb
  document.getElementById('nwNewComb').addEventListener('click', () => openNewCombModal());

  // Adding a bee never creates a comb. From All Bees the new person remains
  // unassigned; from a real comb the person is also added to that comb.
  document.getElementById('nwAddBee').addEventListener('click', openAddBeeModal);

  // Zoom buttons
  document.getElementById('nwZoomIn').addEventListener('click', () => adjustZoom(0.2));
  document.getElementById('nwZoomOut').addEventListener('click', () => adjustZoom(-0.2));
  document.getElementById('nwZoomReset').addEventListener('click', () => { _scale = 1; _pan = { x: 0, y: 0 }; renderCanvas(); });

  // Hive/List toggle
  document.getElementById('nwToggleHive').addEventListener('click', () => {
    _allBeesView = 'hive';
    document.getElementById('nwToggleHive').classList.add('active');
    document.getElementById('nwToggleList').classList.remove('active');
    renderCanvas();
  });
  document.getElementById('nwToggleList').addEventListener('click', () => {
    _allBeesView = 'list';
    document.getElementById('nwToggleList').classList.add('active');
    document.getElementById('nwToggleHive').classList.remove('active');
    renderCanvas();
  });

  // Close detail panel clicking canvas background
  document.getElementById('nwCanvasWrap').addEventListener('click', e => {
    if (_panMoved) return; // was a drag-to-pan, not a real click
    if (e.target === document.getElementById('nwCanvasWrap')) closeDetailPanel();
  });

  document.getElementById('nwDpClose').addEventListener('click', closeDetailPanel);

  // Wheel zoom
  const canvasWrap = document.getElementById('nwCanvasWrap');
  canvasWrap.addEventListener('wheel', e => {
    e.preventDefault();
    adjustZoom(e.deltaY < 0 ? 0.12 : -0.12);
  }, { passive: false });

  // Canvas pan
  canvasWrap.addEventListener('mousedown', e => {
    if (canvasWrap.classList.contains('list-mode')) return;
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    _isPanning     = true;
    _panMoved      = false;
    _panStartClient = { x: e.clientX, y: e.clientY };
    _panStart       = { x: e.clientX - _pan.x, y: e.clientY - _pan.y };
    canvasWrap.style.cursor = 'grabbing';
  });

  // Remove-then-add so re-rendering the view (e.g. after re-login) never stacks
  // duplicate global listeners.
  window.removeEventListener('mousemove', _onWindowMouseMove);
  window.removeEventListener('mouseup', _onWindowMouseUp);
  window.addEventListener('mousemove', _onWindowMouseMove);
  window.addEventListener('mouseup', _onWindowMouseUp);

  // Show a loading hint while we fetch from the server.
  canvasWrap.innerHTML = `<div class="nw-list-empty">Loading your hive…</div>`;

  _data = await loadData();

  renderSidebar();
  renderCanvas();
}

// Window listeners are module-level (added once per render). Guard against the
// view being re-rendered by checking the DOM still exists.
function _onWindowMouseMove(e) {
  onDragMove(e);
  if (_isPanning) {
    const canvasWrap = document.getElementById('nwCanvasWrap');
    if (!canvasWrap) { _isPanning = false; return; }
    if (!_panMoved && (Math.abs(e.clientX - _panStartClient.x) > 3 || Math.abs(e.clientY - _panStartClient.y) > 3)) {
      _panMoved = true;
      document.body.style.userSelect = 'none';
    }
    _pan = { x: e.clientX - _panStart.x, y: e.clientY - _panStart.y };
    applyTransform();
  }
}
function _onWindowMouseUp(e) {
  onDragEnd(e);
  if (_isPanning) {
    _isPanning = false;
    const canvasWrap = document.getElementById('nwCanvasWrap');
    if (canvasWrap) canvasWrap.style.cursor = '';
    document.body.style.userSelect = '';
  }
}

// ── Zoom helpers ──────────────────────────────────────────────────
function adjustZoom(delta) {
  _scale = Math.min(3, Math.max(0.2, _scale + delta));
  applyTransform();
}

function applyTransform() {
  const g = document.getElementById('nwHiveG');
  if (g) {
    g.setAttribute('transform', `translate(${_pan.x},${_pan.y}) scale(${_scale})`);
  }
}

// ── Sidebar ───────────────────────────────────────────────────────
function renderSidebar() {
  const list = document.getElementById('nwCombList');
  if (!list) return;

  const combs = combList();
  const q = _searchQuery.trim().toLowerCase();

  list.innerHTML = combs.map(comb => {
    const isActive  = comb.id === _activeComb;
    const isVirtual = comb._virtual;
    const members   = membersOf(comb);
    const matchCount = q
      ? members.filter(b => (b.name || '').toLowerCase().includes(q)).length
      : members.length;

    return `
      <div class="nw-comb-item${isActive ? ' active' : ''}${isVirtual ? ' nw-comb-all' : ''}"
           data-comb-id="${comb.id}">
        <div class="nw-comb-item-name">${esc(comb.name)}</div>
        <div class="nw-comb-item-count">${matchCount} ${matchCount === 1 ? 'bee' : 'bees'}${q && !isVirtual ? ' match' : ''}</div>
      </div>`;
  }).join('');

  list.querySelectorAll('.nw-comb-item').forEach(el => {
    el.addEventListener('click', () => {
      _activeComb = el.dataset.combId;
      _selected   = null;
      closeDetailPanel();
      renderSidebar();
      const toggle = document.getElementById('nwViewToggle');
      if (toggle) toggle.style.display = _activeComb === ALL_BEES_ID ? 'flex' : 'none';
      renderCanvas();
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (el.dataset.combId === ALL_BEES_ID) return;
      const comb = _data.combs.find(c => c.id === el.dataset.combId);
      if (comb) openEditCombModal(comb);
    });
  });
}

// ── Canvas router ─────────────────────────────────────────────────
function renderCanvas() {
  if (_activeComb === ALL_BEES_ID && _allBeesView === 'list') {
    drawListView();
  } else {
    drawHive();
  }
}

// ── Drag handlers (hex node dragging) ────────────────────────────
function onDragMove(e) {
  if (!_drag) return;
  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;
  if (!_drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    _drag.moved = true;
    document.body.style.userSelect = 'none';
  }
  if (!_drag.moved) return;

  const adx = dx / _scale;
  const ady = dy / _scale;
  const cx = _drag.origCx + adx;
  const cy = _drag.origCy + ady;

  const g = document.querySelector(`.nw-hex-node[data-cid="${_drag.id}"]`);
  if (g) {
    const baseCx = parseFloat(g.dataset.cx);
    const baseCy = parseFloat(g.dataset.cy);
    g.setAttribute('transform', `translate(${(cx - baseCx).toFixed(1)},${(cy - baseCy).toFixed(1)})`);
    g.style.cursor = 'grabbing';
  }
  document.querySelectorAll(`[data-source="${_drag.id}"], [data-target="${_drag.id}"]`).forEach(line => {
    if (line.dataset.source === _drag.id) {
      line.setAttribute('x1', cx.toFixed(1)); line.setAttribute('y1', cy.toFixed(1));
    }
    if (line.dataset.target === _drag.id) {
      line.setAttribute('x2', cx.toFixed(1)); line.setAttribute('y2', cy.toFixed(1));
    }
  });
}

function onDragEnd(e) {
  if (!_drag) return;
  const { id, moved, startX, startY, origCx, origCy } = _drag;
  _drag = null;
  document.body.style.userSelect = '';

  const g = document.querySelector(`.nw-hex-node[data-cid="${id}"]`);
  if (g) g.style.cursor = 'grab';

  const ownerComb = combById(_activeComb);
  if (!ownerComb) return;

  if (!moved) {
    const bee = getPerson(id);
    if (bee) openDetailPanel(bee, ownerComb);
    return;
  }

  const dx = (e.clientX - startX) / _scale;
  const dy = (e.clientY - startY) / _scale;
  const layout = layoutFor(ownerComb);
  layout[id] = { x: (origCx + dx) - _ox, y: (origCy + dy) - _oy };
  saveData(_data);
  drawHive();
}

// ── Helpers ───────────────────────────────────────────────────────
function activeComb() { return combById(_activeComb); }

function relColor(rel) {
  const map = {
    'Mentor':           '#a855f7',
    'Technical Expert': '#6c63ff',
    'Manager':          '#d946ef',
    'Counterpart':      '#60a5fa',
    'Partner':          '#e879f9',
    'Peer':             '#4589ff',
    'Client':           '#34d399',
    'Other':            '#525252',
  };
  return map[rel] || '#525252';
}

/** First name / subtitle for the center "you" hex, from the signed-in user. */
function centerHexLabel() {
  const u = currentUser();
  const name = (u && (u.display_name || u.username)) || 'You';
  return name.trim().split(/\s+/)[0] || 'You';
}

// ── Draw: SVG hive ────────────────────────────────────────────────
function drawHive() {
  const wrap = document.getElementById('nwCanvasWrap');
  if (!wrap) return;
  wrap.classList.remove('list-mode');

  const comb = activeComb();
  const q    = _searchQuery.trim().toLowerCase();
  let bees   = membersOf(comb);
  if (q) bees = bees.filter(b => (b.name || '').toLowerCase().includes(q));

  const layout    = layoutFor(comb);
  const fallback  = spiralPositions(Math.max(bees.length, 1));
  const positions = bees.map((b, i) => {
    const pos = layout[b.id];
    return (pos && typeof pos.x === 'number' && typeof pos.y === 'number') ? { cx: pos.x, cy: pos.y } : fallback[i];
  });

  const allCX = [0, ...positions.map(p => p.cx)];
  const allCY = [0, ...positions.map(p => p.cy)];
  const minX = Math.min(...allCX), minY = Math.min(...allCY);
  const maxX = Math.max(...allCX), maxY = Math.max(...allCY);

  const PAD  = R + 48;
  const svgW = (maxX - minX) + W + PAD * 2;
  const svgH = (maxY - minY) + H + PAD * 2;
  const ox   = PAD + (-minX) + (W / 2);
  const oy   = PAD + (-minY) + (H / 2);

  // Build id→position lookup for connections
  const posMap = {};
  bees.forEach((b, i) => { posMap[b.id] = { cx: ox + positions[i].cx, cy: oy + positions[i].cy }; });
  posMap[SELF_ID] = { cx: ox, cy: oy };

  // Render only real ties. Both use the shared Colonies connector color;
  // direct ties are solid and indirect ties are dashed.
  let lines = '';
  const member = new Set(bees.map(b => b.id));
  member.add(SELF_ID);
  const drawnEdges = new Set();
  _data.connections.forEach(c => {
    if (!member.has(c.source) || !member.has(c.target)) return;
    const key = [c.source, c.target].sort().join('|') + '|' + c.type;
    if (drawnEdges.has(key)) return;
    drawnEdges.add(key);
    const from = posMap[c.source];
    const to   = posMap[c.target];
    if (!from || !to) return;
    if (c.type === 'indirect') {
      lines += `<line data-edge-id="${c.id}" data-source="${c.source}" data-target="${c.target}"
        x1="${from.cx.toFixed(1)}" y1="${from.cy.toFixed(1)}"
        x2="${to.cx.toFixed(1)}"   y2="${to.cy.toFixed(1)}"
        stroke="rgba(255,255,255,0.48)" stroke-width="1.5" stroke-dasharray="7,6" stroke-linecap="round"/>`;
    } else {
      lines += `<line data-edge-id="${c.id}" data-source="${c.source}" data-target="${c.target}"
        x1="${from.cx.toFixed(1)}" y1="${from.cy.toFixed(1)}"
        x2="${to.cx.toFixed(1)}"   y2="${to.cy.toFixed(1)}"
        stroke="rgba(255,255,255,0.48)" stroke-width="1.5" stroke-linecap="round"/>`;
    }
  });

  // "You" hex
  let hexes = `
    <g class="nw-you-node" style="cursor:default">
      <polygon points="${hexPts(ox, oy)}" fill="#2a2a2a" stroke="#a855f7" stroke-width="2.5"/>
      ${hexTextBlock(ox, oy, [
        { text: esc(centerHexLabel()), size: 13, weight: 600, color: '#ffffff' },
        { text: 'You',   size: 10, weight: 400, color: 'rgba(255,255,255,0.45)' },
      ])}
    </g>`;

  bees.forEach((b, i) => {
    const p     = positions[i];
    const cx    = ox + p.cx;
    const cy    = oy + p.cy;
    const isSel = _selected === b.id;

    const stroke = isSel ? '#4589ff' : 'rgba(255,255,255,0.70)';
    const sw     = isSel ? 2.5 : 1.5;
    const fill   = '#2a2a2a';

    const nameParts = (b.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const restName  = nameParts.slice(1).join(' ');
    const hasTwo    = restName.length > 0;
    const roleTxt   = b.role ? (b.role.length > 14 ? b.role.slice(0, 13) + '…' : b.role) : '';

    const nameLines = [{ text: esc(firstName), size: 11, weight: 500, color: '#ffffff' }];
    if (hasTwo)  nameLines.push({ text: esc(restName), size: 11, weight: 500, color: '#ffffff' });
    if (roleTxt) nameLines.push({ text: esc(roleTxt),  size: 9,  weight: 400, color: 'rgba(255,255,255,0.38)' });
    const nameEl = hexTextBlock(cx, cy, nameLines);

    hexes += `
      <g class="nw-hex-node" data-cid="${b.id}" data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}" style="cursor:grab">
        <polygon points="${hexPts(cx, cy)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        ${nameEl}
      </g>`;
  });

  const emptyHint = bees.length === 0
    ? `<text x="${ox}" y="${(oy + R + 36).toFixed(1)}" text-anchor="middle"
        fill="#3a3a3a" font-size="12" font-family="IBM Plex Sans,system-ui,sans-serif"
        pointer-events="none">${q ? 'No bees match your search' : 'Click "Add a bee" to add bees to this comb'}</text>`
    : '';

  wrap.innerHTML = `
    <svg id="nwHiveSvg"
      width="${svgW.toFixed(0)}" height="${svgH.toFixed(0)}"
      viewBox="0 0 ${svgW.toFixed(0)} ${svgH.toFixed(0)}"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible">
      <g id="nwHiveG" transform="translate(${_pan.x},${_pan.y}) scale(${_scale})">
        <g>${lines}</g>
        <g>${hexes}</g>
        ${emptyHint}
      </g>
    </svg>`;

  _ox = ox;
  _oy = oy;

  wrap.querySelectorAll('.nw-hex-node').forEach(el => {
    const cid = el.dataset.cid;
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      _drag = {
        id:      cid,
        startX:  e.clientX,
        startY:  e.clientY,
        origCx:  parseFloat(el.dataset.cx),
        origCy:  parseFloat(el.dataset.cy),
        moved:   false,
      };
      el.style.cursor = 'grabbing';
    });
  });
}

// ── Draw: List view (All Bees) ────────────────────────────────────
function drawListView() {
  const wrap = document.getElementById('nwCanvasWrap');
  if (!wrap) return;
  wrap.classList.add('list-mode');

  const q    = _searchQuery.trim().toLowerCase();
  let bees   = membersOf(combById(ALL_BEES_ID));
  if (q) bees = bees.filter(b => (b.name || '').toLowerCase().includes(q));

  if (bees.length === 0) {
    wrap.innerHTML = `<div class="nw-list-empty">${q ? 'No bees match your search.' : 'No bees added yet. Click "Add a bee" to get started.'}</div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="nw-list-view">
      ${bees.map(b => {
        const color = relColor(b.relationship);
        const combNames = combsForBee(b.id).map(c => esc(c.name)).join(', ');
        return `
          <div class="nw-list-row" data-bid="${b.id}">
            <img class="nw-list-bee-img" src="/img/bee.png" alt="bee"/>
            <div class="nw-list-info">
              <div class="nw-list-name">${esc(b.name)}</div>
              <div class="nw-list-meta">${[b.role, b.company].filter(Boolean).map(esc).join(' · ') || '—'}</div>
              ${combNames ? `<div class="nw-list-combs">${combNames}</div>` : ''}
            </div>
            ${b.relationship ? `<div class="nw-list-rel" style="border-color:${color};color:${color}">${esc(b.relationship)}</div>` : ''}
          </div>`;
      }).join('')}
    </div>`;

  wrap.querySelectorAll('.nw-list-row').forEach(el => {
    el.addEventListener('click', () => {
      const bee = getPerson(el.dataset.bid);
      if (bee) openDetailPanel(bee, combById(ALL_BEES_ID));
    });
  });
}

// ── Bee detail panel ──────────────────────────────────────────────
function openDetailPanel(bee, ownerComb) {
  _detailBee   = bee;
  _detailOwner = ownerComb;
  _selected    = bee.id;

  drawHive();

  const panel = document.getElementById('nwDetailPanel');
  if (!panel) return;

  document.getElementById('nwDpName').textContent = bee.name || '—';
  document.getElementById('nwDpRole').textContent =
    [bee.role, bee.company].filter(Boolean).join(' · ') || '—';

  const relEl = document.getElementById('nwDpRel');
  if (bee.relationship) {
    const color = relColor(bee.relationship);
    relEl.textContent = bee.relationship;
    relEl.style.display = 'inline-block';
    relEl.style.borderColor = color;
    relEl.style.color = color;
  } else {
    relEl.style.display = 'none';
  }

  renderDetailPanelBody(bee, ownerComb);
  panel.classList.add('open');
}

function renderDetailPanelBody(bee, ownerComb) {
  const body = document.getElementById('nwDpBody');
  if (!body) return;

  const notes = normaliseNotes(bee.notes);

  // Combs this bee belongs to
  const memberCombs = combsForBee(bee.id);
  const combsHtml = memberCombs.length
    ? memberCombs.map(c => `<span class="nw-dp-comb-badge">${esc(c.name)}</span>`).join('')
    : '<span style="color:#fff;font-size:12px">Not in any comb</span>';

  // Connections (global) — the other end of each edge involving this bee.
  const idx = personIndex();
  const conns = connectionsForPerson(bee.id).map(c => {
    const otherId = c.source === bee.id ? c.target : c.source;
    const target  = otherId === SELF_ID
      ? { id: SELF_ID, name: `${centerHexLabel()} (You)` }
      : idx[otherId];
    if (!target) return '';
    const typeLabel = c.type === 'indirect' ? 'Indirect tie' : 'Direct tie';
    const typeColor = 'rgba(255,255,255,0.72)';
    return `<div class="nw-dp-conn-row" data-target-id="${target.id}" data-edge-id="${c.id}">
      <img class="nw-dp-conn-bee-img" src="/img/bee.png" alt="bee"/>
      <div class="nw-dp-conn-info">
        <div class="nw-dp-conn-name">${esc(target.name)}</div>
        <div class="nw-dp-conn-type" style="color:${typeColor}">${typeLabel}${c.note ? ` · ${esc(c.note)}` : ''}</div>
      </div>
      <div class="nw-dp-tie-menu-wrap">
        <button class="nw-dp-tie-edit" data-tie-menu="${c.id}" aria-label="Connection options">⋮</button>
        <div class="nw-dp-tie-menu">
          <button data-edit-edge="${c.id}">Edit connection</button>
        </div>
      </div>
    </div>`;
  }).filter(Boolean).join('');

  body.innerHTML = `
    <div class="nw-dp-section">
      <div class="nw-dp-section-title">Details</div>
      ${bee.company      ? `<div class="nw-dp-row"><span class="nw-dp-label">Company</span><span class="nw-dp-value">${esc(bee.company)}</span></div>` : ''}
      ${bee.role         ? `<div class="nw-dp-row"><span class="nw-dp-label">Role</span><span class="nw-dp-value">${esc(bee.role)}</span></div>` : ''}
      ${bee.email        ? `<div class="nw-dp-row"><span class="nw-dp-label">Email</span><a class="nw-dp-link" href="mailto:${esc(bee.email)}">${esc(bee.email)}</a></div>` : ''}
      ${bee.location     ? `<div class="nw-dp-row"><span class="nw-dp-label">Location</span><span class="nw-dp-value">${esc(bee.location)}</span></div>` : ''}
      ${bee.relationship ? `<div class="nw-dp-row"><span class="nw-dp-label">Relationship</span><span class="nw-dp-value">${esc(bee.relationship)}</span></div>` : ''}
      ${bee.metThrough   ? `<div class="nw-dp-row"><span class="nw-dp-label">Met via</span><span class="nw-dp-value">${esc(bee.metThrough)}</span></div>` : ''}
    </div>

    <div class="nw-dp-section">
      <div class="nw-dp-section-title">In Combs</div>
      <div class="nw-dp-comb-badges">${combsHtml}</div>
    </div>

    ${conns ? `
    <div class="nw-dp-section">
      <div class="nw-dp-section-title">Connections</div>
      <div class="nw-dp-conns-list">${conns}</div>
    </div>` : ''}

    <div class="nw-dp-section">
      <div class="nw-dp-section-title">Notes</div>
      <div id="nwDpNotesList" class="nw-dp-notes-list">
        ${notes.length === 0
          ? `<div class="nw-dp-notes-empty">No notes yet.</div>`
          : notes.slice().reverse().map(n => `
              <div class="nw-dp-note">
                <div class="nw-dp-note-text">${esc(n.text)}</div>
                <div class="nw-dp-note-date">${formatDate(n.date)}</div>
              </div>`).join('')}
      </div>
      <div class="nw-dp-note-input-row">
        <input class="nw-dp-note-input" id="nwDpNoteInput" type="text" placeholder="Add a note…"/>
        <button class="nw-dp-note-submit" id="nwDpNoteSubmit">Add</button>
      </div>
    </div>

  `;

  const menuTrigger = document.getElementById('nwDpMenuTrigger');
  const menu = document.getElementById('nwDpMenu');
  menuTrigger.onclick = e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  };

  // Add note
  const addNote = () => {
    const input = document.getElementById('nwDpNoteInput');
    const text  = input.value.trim();
    if (!text) return;
    const person = getPerson(bee.id);
    if (!person) return;
    person.notes = normaliseNotes(person.notes);
    person.notes.push({ text, date: new Date().toISOString() });
    saveData(_data);
    renderDetailPanelBody(person, ownerComb);
  };
  document.getElementById('nwDpNoteSubmit').addEventListener('click', addNote);
  document.getElementById('nwDpNoteInput').addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });

  document.getElementById('nwDpEdit').onclick = () => {
    closeDetailPanel();
    openEditBeeModal(bee, ownerComb);
  };

  // "Add a bee" connected to this bee
  document.getElementById('nwDpAddFrom').onclick = () => {
    openAddBeeFromModal(bee, ownerComb);
  };

  document.getElementById('nwDpAddConn').onclick = () => openAddConnectionModal(bee, ownerComb);

  // Click a connection row to open that bee's panel
  body.querySelectorAll('.nw-dp-conn-row[data-target-id]').forEach(row => {
    row.addEventListener('click', () => {
      if (row.dataset.targetId === SELF_ID) return;
      const tBee = getPerson(row.dataset.targetId);
      if (tBee) openDetailPanel(tBee, combById(_activeComb));
    });
  });
  body.querySelectorAll('[data-tie-menu]').forEach(button => {
    button.addEventListener('click', e => {
      e.stopPropagation();
      const current = button.parentElement.querySelector('.nw-dp-tie-menu');
      body.querySelectorAll('.nw-dp-tie-menu.open').forEach(item => {
        if (item !== current) item.classList.remove('open');
      });
      current?.classList.toggle('open');
    });
  });
  body.querySelectorAll('[data-edit-edge]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const edge = _data.connections.find(c => c.id === btn.dataset.editEdge);
      if (edge) openEditTieModal(edge, bee, ownerComb);
    });
  });

  document.getElementById('nwDpDelete').onclick = () => {
    if (ownerComb && ownerComb.id !== ALL_BEES_ID) {
      // Remove from just this comb (purged globally if left with no comb).
      removeFromComb(bee.id, ownerComb.id);
    } else {
      // Deleting from All Bees removes the person entirely.
      removePerson(bee.id);
    }
    saveData(_data);
    closeDetailPanel();
    renderSidebar();
    renderCanvas();
  };
}

function closeDetailPanel() {
  _detailBee   = null;
  _detailOwner = null;
  _selected    = null;
  const panel  = document.getElementById('nwDetailPanel');
  if (panel) panel.classList.remove('open');
  renderCanvas();
}

// ── Add a bee connected to another bee ────────────────────────────
/**
 * Creates a direct tie to the source bee and an indirect tie back to You.
 */
function openAddBeeFromModal(sourceBee, sourceComb) {
  const newBee = { id: uid(), name: '', role: '', company: '', email: '', location: '', relationship: '', metThrough: '', notes: [] };

  showBeeModal({
    title:     `Add a bee connected to ${sourceBee.name || 'this bee'}`,
    bee:       newBee,
    isNew:     true,
    ownerComb: sourceComb,
    _afterSave: (savedId, targetComb) => {
      addConnectionEdge(savedId, sourceBee.id, 'direct', 'Added through this bee');
      addConnectionEdge(savedId, SELF_ID, 'indirect', `Connected through ${sourceBee.name}`);
      saveData(_data);
      renderSidebar();
      renderCanvas();
      const saved = getPerson(savedId);
      if (saved) openDetailPanel(saved, targetComb);
    },
  });
}

function openAddConnectionModal(bee, ownerComb) {
  document.getElementById('nwConnModal')?.remove();

  // Available targets: everyone except this person.
  const targets = [{ id: SELF_ID, name: `${centerHexLabel()} (You)`, company: '' }, ..._data.people.filter(b => b.id !== bee.id)];

  const overlay = document.createElement('div');
  overlay.id        = 'nwConnModal';
  overlay.className = 'nw-modal-overlay';
  overlay.innerHTML = `
    <div class="nw-modal">
      <div class="nw-modal-header">
        <div class="nw-modal-title">Add connection for ${esc(bee.name)}</div>
        <button class="nw-modal-close" id="nwConnClose">✕</button>
      </div>
      <div class="nw-modal-body">
        <label class="nw-modal-label">
          Connect to
          <select class="nw-modal-select" id="nwConnTarget">
            <option value="">— select a bee —</option>
            ${targets.map(t => `<option value="${t.id}">${esc(t.name)}${t.company ? ' · ' + esc(t.company) : ''}</option>`).join('')}
          </select>
        </label>
        <label class="nw-modal-label">
          Connection type
          <select class="nw-modal-select" id="nwConnType">
            <option value="direct">Direct tie — solid</option>
            <option value="indirect">Indirect tie — dashed</option>
          </select>
        </label>
        <label class="nw-modal-label">
          Note <span style="font-weight:300;color:#3d3d3d">(optional)</span>
          <input class="nw-modal-input" id="nwConnNote" type="text" placeholder="e.g. both worked at IBM Austin"/>
        </label>
      </div>
      <div class="nw-modal-footer">
        <div style="flex:1"></div>
        <button class="nw-modal-cancel" id="nwConnCancel">Cancel</button>
        <button class="nw-modal-save"   id="nwConnSave">Add connection</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('nwConnClose').addEventListener('click', close);
  document.getElementById('nwConnCancel').addEventListener('click', close);

  document.getElementById('nwConnSave').addEventListener('click', () => {
    const targetId = document.getElementById('nwConnTarget').value;
    if (!targetId) { document.getElementById('nwConnTarget').focus(); return; }
    const type = document.getElementById('nwConnType').value;
    const note = document.getElementById('nwConnNote').value.trim();

    addConnectionEdge(bee.id, targetId, type, note);
    saveData(_data);
    close();
    openDetailPanel(getPerson(bee.id), ownerComb);
    renderCanvas();
  });
}

function openEditTieModal(edge, bee, ownerComb) {
  document.getElementById('nwConnModal')?.remove();
  const otherId = edge.source === bee.id ? edge.target : edge.source;
  const other = otherId === SELF_ID ? { name: `${centerHexLabel()} (You)` } : getPerson(otherId);
  const overlay = document.createElement('div');
  overlay.id = 'nwConnModal';
  overlay.className = 'nw-modal-overlay';
  overlay.innerHTML = `<div class="nw-modal">
    <div class="nw-modal-header">
      <div class="nw-modal-title">Edit tie with ${esc(other?.name || 'bee')}</div>
      <button class="nw-modal-close" id="nwConnClose">✕</button>
    </div>
    <div class="nw-modal-body">
      <label class="nw-modal-label">Tie type
        <select class="nw-modal-select" id="nwConnType">
          <option value="direct"${edge.type === 'direct' ? ' selected' : ''}>Direct tie — solid</option>
          <option value="indirect"${edge.type === 'indirect' ? ' selected' : ''}>Indirect tie — dashed</option>
        </select>
      </label>
      <label class="nw-modal-label">Note
        <input class="nw-modal-input" id="nwConnNote" value="${esc(edge.note || '')}" placeholder="Relationship context"/>
      </label>
    </div>
    <div class="nw-modal-footer">
      <button class="nw-modal-delete" id="nwConnDelete">Delete tie</button>
      <div style="flex:1"></div>
      <button class="nw-modal-cancel" id="nwConnCancel">Cancel</button>
      <button class="nw-modal-save" id="nwConnSave">Save tie</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('nwConnClose').addEventListener('click', close);
  document.getElementById('nwConnCancel').addEventListener('click', close);
  document.getElementById('nwConnDelete').addEventListener('click', () => {
    _data.connections = _data.connections.filter(c => c.id !== edge.id);
    saveData(_data); close(); renderCanvas(); openDetailPanel(getPerson(bee.id), ownerComb);
  });
  document.getElementById('nwConnSave').addEventListener('click', () => {
    edge.type = document.getElementById('nwConnType').value;
    edge.note = document.getElementById('nwConnNote').value.trim();
    saveData(_data); close(); renderCanvas(); openDetailPanel(getPerson(bee.id), ownerComb);
  });
}

// ── Notes helpers ─────────────────────────────────────────────────
function normaliseNotes(notes) {
  if (!notes) return [];
  if (Array.isArray(notes)) return notes;
  if (typeof notes === 'string' && notes.trim()) {
    return [{ text: notes.trim(), date: new Date().toISOString() }];
  }
  return [];
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

// ── New/Edit Comb Modal ───────────────────────────────────────────
function openNewCombModal(thenAddBee = false) {
  showCombModal({ title: 'New comb', name: '', description: '', isNew: true, thenAddBee });
}

function openEditCombModal(comb) {
  showCombModal({ title: 'Edit comb', name: comb.name, description: comb.description || '', isNew: false, combId: comb.id });
}

function showCombModal({ title, name, description, isNew, combId, thenAddBee = false }) {
  document.getElementById('nwCombModal')?.remove();

  const overlay = document.createElement('div');
  overlay.id        = 'nwCombModal';
  overlay.className = 'nw-modal-overlay';
  overlay.innerHTML = `
    <div class="nw-modal">
      <div class="nw-modal-header">
        <div class="nw-modal-title">${esc(title)}</div>
        <button class="nw-modal-close" id="nwCombModalClose">✕</button>
      </div>
      <div class="nw-modal-body">
        <label class="nw-modal-label">
          Comb name
          <input class="nw-modal-input" id="nwCombName" type="text"
            placeholder="e.g. Partners, Clients, Mentors" value="${esc(name)}"/>
        </label>
        <label class="nw-modal-label">
          Description <span style="font-weight:300;color:#3d3d3d">(optional)</span>
          <textarea class="nw-modal-textarea" id="nwCombDesc" rows="2"
            placeholder="What's this comb for?">${esc(description)}</textarea>
        </label>
      </div>
      <div class="nw-modal-footer">
        ${!isNew ? `<button class="nw-modal-delete" id="nwCombDelete">Delete comb</button>` : ''}
        <div style="flex:1"></div>
        <button class="nw-modal-cancel" id="nwCombCancel">Cancel</button>
        <button class="nw-modal-save"   id="nwCombSave">Save</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('nwCombModalClose').addEventListener('click', close);
  document.getElementById('nwCombCancel').addEventListener('click', close);

  document.getElementById('nwCombDelete')?.addEventListener('click', () => {
    const comb = _data.combs.find(c => c.id === combId);
    _data.combs = _data.combs.filter(c => c.id !== combId);
    // Purge any people who were only in this comb.
    if (comb) comb.memberIds.forEach(id => { if (combsForBee(id).length === 0) removePerson(id); });
    if (_activeComb === combId) _activeComb = ALL_BEES_ID;
    saveData(_data);
    close();
    renderSidebar();
    renderCanvas();
  });

  document.getElementById('nwCombSave').addEventListener('click', () => {
    const combName = document.getElementById('nwCombName').value.trim();
    if (!combName) { document.getElementById('nwCombName').focus(); return; }
    const combDesc = document.getElementById('nwCombDesc').value.trim();

    if (isNew) {
      const newComb = { id: uid(), name: combName, description: combDesc, memberIds: [], layout: {} };
      _data.combs.push(newComb);
      _activeComb = newComb.id;
    } else {
      const comb = _data.combs.find(c => c.id === combId);
      if (comb) { comb.name = combName; comb.description = combDesc; }
    }
    saveData(_data);
    close();
    renderSidebar();
    renderCanvas();
    if (isNew && thenAddBee) openAddBeeModal();
  });

  setTimeout(() => document.getElementById('nwCombName')?.focus(), 60);
}

// ── Add / Edit Bee Modal ──────────────────────────────────────────
function openAddBeeModal() {
  showBeeModal({
    title: 'Add a bee',
    bee:   { id: uid(), name: '', role: '', company: '', email: '', location: '', relationship: '', metThrough: '', notes: [] },
    isNew: true,
    _afterSave: (savedId, targetComb) => {
      addConnectionEdge(savedId, SELF_ID, 'direct', 'Added by you');
      saveData(_data);
      renderSidebar();
      renderCanvas();
      const saved = getPerson(savedId);
      if (saved) openDetailPanel(saved, targetComb || combById(ALL_BEES_ID));
    },
  });
}

function openEditBeeModal(bee, ownerComb) {
  showBeeModal({ title: 'Edit bee', bee: { ...bee }, isNew: false, ownerComb });
}

function showBeeModal({ title, bee, isNew, ownerComb, _afterSave }) {
  document.getElementById('nwBeeModal')?.remove();

  const REL_TYPES = ['Mentor', 'Technical Expert', 'Manager', 'Counterpart', 'Partner', 'Peer', 'Client', 'Other'];

  // Which comb will receive a newly-added bee? A bee created from All Bees is
  // valid without comb membership and remains visible in the directory.
  const targetCombId = ownerComb && ownerComb.id !== ALL_BEES_ID ? ownerComb.id
    : (_activeComb !== ALL_BEES_ID ? _activeComb : null);
  const targetComb = _data.combs.find(c => c.id === targetCombId);
  const existingIds = new Set(targetComb ? targetComb.memberIds : []);

  // People who exist but aren't already in the target comb — offered for import.
  const importCandidates = _data.people.filter(p => !existingIds.has(p.id));

  const importSection = isNew && targetComb && importCandidates.length > 0 ? `
    <div class="nw-modal-divider">— or add an existing bee —</div>
    <label class="nw-modal-label">
      Add someone already in your hive
      <select class="nw-modal-select" id="nwmImport">
        <option value="">— choose a bee —</option>
        ${importCandidates.map(b => `<option value="${b.id}">${esc(b.name)}${b.company ? ' · '+esc(b.company) : ''}</option>`).join('')}
      </select>
    </label>` : '';

  const overlay = document.createElement('div');
  overlay.id        = 'nwBeeModal';
  overlay.className = 'nw-modal-overlay';
  overlay.innerHTML = `
    <div class="nw-modal" style="max-width:460px">
      <div class="nw-modal-header">
        <div class="nw-modal-title">${esc(title)}</div>
        <button class="nw-modal-close" id="nwBeeModalClose">✕</button>
      </div>
      <div class="nw-modal-body">
        <label class="nw-modal-label">
          Name
          <input class="nw-modal-input" id="nwmName" type="text" placeholder="Full name" value="${esc(bee.name)}"/>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <label class="nw-modal-label">
            Role / Title
            <input class="nw-modal-input" id="nwmRole" type="text" placeholder="Solutions Architect" value="${esc(bee.role || '')}"/>
          </label>
          <label class="nw-modal-label">
            Company
            <input class="nw-modal-input" id="nwmCompany" type="text" placeholder="IBM, Partner Co." value="${esc(bee.company || '')}"/>
          </label>
          <label class="nw-modal-label">
            Email
            <input class="nw-modal-input" id="nwmEmail" type="text" placeholder="name@company.com" value="${esc(bee.email || '')}"/>
          </label>
          <label class="nw-modal-label">
            Location
            <input class="nw-modal-input" id="nwmLocation" type="text" placeholder="Austin, TX" value="${esc(bee.location || '')}"/>
          </label>
        </div>
        <label class="nw-modal-label">
          Relationship
          <select class="nw-modal-select" id="nwmRelationship">
            <option value="">— select —</option>
            ${REL_TYPES.map(r => `<option value="${r}"${bee.relationship === r ? ' selected' : ''}>${r}</option>`).join('')}
          </select>
        </label>
        <label class="nw-modal-label">
          How we met / Met through
          <input class="nw-modal-input" id="nwmMetThrough" type="text"
            placeholder="e.g. IBM partner summit, intro from Jane" value="${esc(bee.metThrough || '')}"/>
        </label>
        ${importSection}
      </div>
      <div class="nw-modal-footer">
        ${!isNew ? `<button class="nw-modal-delete" id="nwmDelete">Delete</button>` : ''}
        <div style="flex:1"></div>
        <button class="nw-modal-cancel" id="nwBeeModalCancel">Cancel</button>
        <button class="nw-modal-save"   id="nwmSave">${isNew ? 'Add bee' : 'Save'}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('nwBeeModalClose').addEventListener('click', close);
  document.getElementById('nwBeeModalCancel').addEventListener('click', close);

  // Importing an existing bee = just add their id to this comb. The form fields
  // are disabled so it's clear you're referencing an existing record, not editing it.
  const importSel = document.getElementById('nwmImport');
  const fieldIds = ['nwmName', 'nwmRole', 'nwmCompany', 'nwmEmail', 'nwmLocation', 'nwmMetThrough', 'nwmRelationship'];
  if (importSel) {
    importSel.addEventListener('change', () => {
      const src = getPerson(importSel.value);
      if (src) {
        document.getElementById('nwmName').value       = src.name       || '';
        document.getElementById('nwmRole').value       = src.role       || '';
        document.getElementById('nwmCompany').value    = src.company    || '';
        document.getElementById('nwmEmail').value      = src.email      || '';
        document.getElementById('nwmLocation').value   = src.location   || '';
        document.getElementById('nwmMetThrough').value = src.metThrough || '';
        document.getElementById('nwmRelationship').value = src.relationship || '';
        overlay.dataset.importId = src.id;
      } else {
        delete overlay.dataset.importId;
      }
      fieldIds.forEach(id => { document.getElementById(id).disabled = !!importSel.value; });
    });
  }

  document.getElementById('nwmDelete')?.addEventListener('click', () => {
    if (ownerComb && ownerComb.id !== ALL_BEES_ID) removeFromComb(bee.id, ownerComb.id);
    else removePerson(bee.id);
    saveData(_data);
    renderSidebar();
    close();
    renderCanvas();
  });

  document.getElementById('nwmSave').addEventListener('click', () => {
    // Resolve the optional destination comb.
    let dest = (ownerComb && ownerComb.id !== ALL_BEES_ID) ? ownerComb
      : (_activeComb !== ALL_BEES_ID ? _data.combs.find(c => c.id === _activeComb) : null);

    // Import path — reference an existing person into this comb.
    if (isNew && overlay.dataset.importId && dest) {
      const id = overlay.dataset.importId;
      if (!dest.memberIds.includes(id)) dest.memberIds.push(id);
      const saved = getPerson(id);
      finishBeeSave(saved ? saved.id : id, dest);
      return;
    }

    const name = document.getElementById('nwmName').value.trim();
    if (!name) { document.getElementById('nwmName').focus(); return; }

    const fields = {
      name,
      role:         document.getElementById('nwmRole').value.trim(),
      company:      document.getElementById('nwmCompany').value.trim(),
      email:        document.getElementById('nwmEmail').value.trim(),
      location:     document.getElementById('nwmLocation').value.trim(),
      relationship: document.getElementById('nwmRelationship').value,
      metThrough:   document.getElementById('nwmMetThrough').value.trim(),
    };

    if (isNew) {
      const person = { id: bee.id, ...fields, notes: normaliseNotes(bee.notes) };
      _data.people.push(person);
      if (dest && !dest.memberIds.includes(person.id)) dest.memberIds.push(person.id);
    } else {
      const person = getPerson(bee.id);
      if (person) Object.assign(person, fields); // single record → updates everywhere
    }

    finishBeeSave(bee.id, dest);
  });

  function finishBeeSave(savedId, dest) {
    if (_afterSave) {
      close();
      _afterSave(savedId, dest);
    } else {
      saveData(_data);
      renderSidebar();
      close();
      renderCanvas();
      if (_detailBee && _detailBee.id === savedId) {
        const saved = getPerson(savedId);
        if (saved) openDetailPanel(saved, dest || combById(ALL_BEES_ID));
      }
    }
  }

  setTimeout(() => document.getElementById('nwmName')?.focus(), 60);
}

// ── Util ──────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
