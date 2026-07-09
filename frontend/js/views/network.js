/**
 * network.js — My Combs tab
 *
 * Features:
 *   - Collapsible left sidebar: search, comb list, "Add a comb"
 *   - Collapse/expand edge tab
 *   - Zoomable/pannable SVG canvas (wheel + toolbar buttons)
 *   - Bee-to-bee mutual connection lines
 *   - Floating "Add a bee" FAB
 *   - Right detail panel: bee profile with notes log, combs membership, connections
 *   - All Bees view: hive ↔ list toggle
 */

// ── Persistence ───────────────────────────────────────────────────
const STORE_KEY   = 'ibm_hive_combs_v1';
const ALL_BEES_ID = '__all_bees__';

function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.combs)) return parsed;
    }
  } catch {}
  return { combs: [] };
}

function saveData(data) {
  const toSave = { combs: data.combs.filter(c => c.id !== ALL_BEES_ID) };
  localStorage.setItem(STORE_KEY, JSON.stringify(toSave));
}

function combsWithAllBees(data) {
  const realCombs = data.combs.filter(c => c.id !== ALL_BEES_ID);
  // Deduplicate bees for All Bees view (a bee can appear in multiple combs)
  const seen = new Set();
  const allBees = realCombs.flatMap(c => c.bees).filter(b => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
  return [
    { id: ALL_BEES_ID, name: 'All Bees', bees: allBees, _virtual: true },
    ...realCombs,
  ];
}

function uid() { return Math.random().toString(36).slice(2, 10); }

// ── Hex geometry (flat-top) ───────────────────────────────────────
const R   = 60;
const W   = R * 2;
const H   = R * Math.sqrt(3);
const GAP = 14;

function hexPts(cx, cy, r) {
  r = r || R;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

/**
 * Render a stack of text lines centered as a single block on (cx, cy).
 * Uses dominant-baseline="central" per line so the block centers correctly
 * regardless of how many lines or font sizes are mixed in.
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
  const vert = H + GAP;
  const positions = [];
  let ring = 1;
  while (positions.length < count) {
    let q = ring, r2 = 0, s = -ring;
    const cubeToXY = (q, r2) => ({ cx: step * q + step * 0.5 * r2, cy: vert * 0.5 * r2 });
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
let _data             = { combs: [] };
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
export function renderNetwork(container) {
  _container   = container;
  _data        = loadData();
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

          <!-- Canvas area — zoom/toggle controls are scoped to this so they
               shrink alongside the canvas (not overlap) when the detail
               panel opens, same as the Colonies hive area. -->
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
              <img class="nw-dp-hex" id="nwDpHex" src="/img/bee.png" alt="bee"/>
              <div class="nw-dp-title">
                <div class="nw-dp-name" id="nwDpName">—</div>
                <div class="nw-dp-role" id="nwDpRole">—</div>
                <div class="nw-dp-rel"  id="nwDpRel" style="display:none"></div>
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

  // Add a bee FAB
  document.getElementById('nwAddBee').addEventListener('click', () => {
    const realCombs = _data.combs.filter(c => c.id !== ALL_BEES_ID);
    if (_activeComb === ALL_BEES_ID && realCombs.length === 0) {
      openNewCombModal(true);
    } else {
      openAddBeeModal();
    }
  });

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

  // Canvas pan — click-drag (left button) or middle-click, on empty diagram
  // background. Individual hex nodes stop propagation on their own mousedown,
  // so this only fires when the drag starts on the canvas itself.
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

  window.addEventListener('mousemove', e => {
    onDragMove(e);
    if (_isPanning) {
      if (!_panMoved && (Math.abs(e.clientX - _panStartClient.x) > 3 || Math.abs(e.clientY - _panStartClient.y) > 3)) {
        _panMoved = true;
        document.body.style.userSelect = 'none';
      }
      _pan = { x: e.clientX - _panStart.x, y: e.clientY - _panStart.y };
      applyTransform();
    }
  });
  window.addEventListener('mouseup', e => {
    onDragEnd(e);
    if (_isPanning) {
      _isPanning = false;
      canvasWrap.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });

  renderSidebar();
  renderCanvas();
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

  const combs = combsWithAllBees(_data);
  const q = _searchQuery.trim().toLowerCase();

  list.innerHTML = combs.map(comb => {
    const isActive  = comb.id === _activeComb;
    const isVirtual = comb._virtual;
    const matchCount = q
      ? comb.bees.filter(b => b.name.toLowerCase().includes(q)).length
      : comb.bees.length;

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
      // Show/hide toggle for All Bees
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

  // Adjust for zoom
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
  const line = document.getElementById(`nw-line-${_drag.id}`);
  if (line) {
    line.setAttribute('x2', cx.toFixed(1));
    line.setAttribute('y2', cy.toFixed(1));
  }
}

function onDragEnd(e) {
  if (!_drag) return;
  const { id, moved, startX, startY, origCx, origCy } = _drag;
  _drag = null;
  document.body.style.userSelect = '';

  const g = document.querySelector(`.nw-hex-node[data-cid="${id}"]`);
  if (g) g.style.cursor = 'grab';

  const ownerComb = _activeComb === ALL_BEES_ID
    ? _data.combs.find(c => c.bees.some(b => b.id === id))
    : activeComb();
  if (!ownerComb) return;

  if (!moved) {
    const bee = ownerComb.bees.find(b => b.id === id);
    if (bee) openDetailPanel(bee, ownerComb);
    return;
  }

  const dx = (e.clientX - startX) / _scale;
  const dy = (e.clientY - startY) / _scale;
  const bee = ownerComb.bees.find(b => b.id === id);
  if (bee) {
    bee.x = (origCx + dx) - _ox;
    bee.y = (origCy + dy) - _oy;
    saveData(_data);
  }
  drawHive();
}

// ── Helpers ───────────────────────────────────────────────────────
function activeComb() {
  if (_activeComb === ALL_BEES_ID) return combsWithAllBees(_data)[0];
  return _data.combs.find(c => c.id === _activeComb) || null;
}

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

/** Return all real combs a bee (by id) belongs to */
function combsForBee(beeId) {
  return _data.combs.filter(c => c.id !== ALL_BEES_ID && c.bees.some(b => b.id === beeId));
}

// ── Draw: SVG hive ────────────────────────────────────────────────
function drawHive() {
  const wrap = document.getElementById('nwCanvasWrap');
  if (!wrap) return;
  wrap.classList.remove('list-mode');

  const comb = activeComb();
  const q    = _searchQuery.trim().toLowerCase();
  let bees   = comb ? [...comb.bees] : [];
  if (q) bees = bees.filter(b => b.name.toLowerCase().includes(q));

  const fallback  = spiralPositions(Math.max(bees.length, 1));
  const positions = bees.map((b, i) =>
    (typeof b.x === 'number' && typeof b.y === 'number') ? { cx: b.x, cy: b.y } : fallback[i]
  );

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

  // Center-to-bee lines
  let lines = '';
  bees.forEach((b, i) => {
    const p = positions[i];
    lines += `<line id="nw-line-${b.id}"
      x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}"
      x2="${(ox + p.cx).toFixed(1)}" y2="${(oy + p.cy).toFixed(1)}"
      stroke="#4589ff" stroke-width="1.5" stroke-opacity="0.22" stroke-linecap="round"/>`;
  });

  // Bee-to-bee mutual connection lines
  const drawnEdges = new Set();
  bees.forEach(b => {
    const conns = (b.connections || []).filter(c => c.type === 'mutual');
    conns.forEach(c => {
      const edgeKey = [b.id, c.targetId].sort().join('|');
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);
      const from = posMap[b.id];
      const to   = posMap[c.targetId];
      if (from && to) {
        lines += `<line
          x1="${from.cx.toFixed(1)}" y1="${from.cy.toFixed(1)}"
          x2="${to.cx.toFixed(1)}"   y2="${to.cy.toFixed(1)}"
          stroke="#a855f7" stroke-width="1" stroke-opacity="0.45" stroke-dasharray="4,4" stroke-linecap="round"/>`;
      }
    });
  });

  // Transient connection lines (different style)
  bees.forEach(b => {
    const conns = (b.connections || []).filter(c => c.type === 'transient');
    conns.forEach(c => {
      const edgeKey = [b.id, c.targetId].sort().join('|') + ':t';
      if (drawnEdges.has(edgeKey)) return;
      drawnEdges.add(edgeKey);
      const from = posMap[b.id];
      const to   = posMap[c.targetId];
      if (from && to) {
        lines += `<line
          x1="${from.cx.toFixed(1)}" y1="${from.cy.toFixed(1)}"
          x2="${to.cx.toFixed(1)}"   y2="${to.cy.toFixed(1)}"
          stroke="#34d399" stroke-width="1" stroke-opacity="0.40" stroke-dasharray="2,5" stroke-linecap="round"/>`;
      }
    });
  });

  // "You" hex
  let hexes = `
    <g class="nw-you-node" style="cursor:default">
      <polygon points="${hexPts(ox, oy)}" fill="#2a2a2a" stroke="#a855f7" stroke-width="2.5"/>
      ${hexTextBlock(ox, oy, [
        { text: 'Sydney', size: 13, weight: 600, color: '#ffffff' },
        { text: 'BTSS',   size: 10, weight: 400, color: 'rgba(255,255,255,0.45)' },
      ])}
    </g>`;

  bees.forEach((b, i) => {
    const p     = positions[i];
    const cx    = ox + p.cx;
    const cy    = oy + p.cy;
    const isSel = _selected === b.id;

    const stroke = isSel ? '#4589ff' : 'rgba(255,255,255,0.65)';
    const sw     = isSel ? 2.5 : 1.5;
    const fill   = isSel ? '#0a1a36' : '#1e1e1e';

    const nameParts = b.name.trim().split(' ');
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

  const comb = combsWithAllBees(_data)[0]; // All Bees
  const q    = _searchQuery.trim().toLowerCase();
  let bees   = comb ? [...comb.bees] : [];
  if (q) bees = bees.filter(b => b.name.toLowerCase().includes(q));

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
      const bid = el.dataset.bid;
      const ownerComb = _data.combs.find(c => c.bees.some(b => b.id === bid));
      if (!ownerComb) return;
      const bee = ownerComb.bees.find(b => b.id === bid);
      if (bee) openDetailPanel(bee, ownerComb);
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
    : '<span style="color:#525252;font-size:12px">Not in any comb</span>';

  // Connections
  const allBees = _data.combs.flatMap(c => c.bees);
  const conns   = (bee.connections || []).map(c => {
    const target = allBees.find(b => b.id === c.targetId);
    if (!target) return '';
    const typeLabel = c.type === 'transient' ? 'Met through' : 'Mutual';
    const typeColor = c.type === 'transient' ? '#34d399' : '#a855f7';
    return `<div class="nw-dp-conn-row" data-target-id="${target.id}" style="cursor:pointer">
      <img class="nw-dp-conn-bee-img" src="/img/bee.png" alt="bee"/>
      <div class="nw-dp-conn-info">
        <div class="nw-dp-conn-name">${esc(target.name)}</div>
        <div class="nw-dp-conn-type" style="color:${typeColor}">${typeLabel}${c.note ? ` · ${esc(c.note)}` : ''}</div>
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

    <div class="nw-dp-actions">
      <button class="nw-dp-btn-edit"     id="nwDpEdit">Edit</button>
      <button class="nw-dp-btn-add-from" id="nwDpAddFrom">Add a bee</button>
      <button class="nw-dp-btn-conn"     id="nwDpAddConn">+ Connection</button>
      <button class="nw-dp-btn-delete"   id="nwDpDelete">Delete</button>
    </div>
  `;

  // Add note
  const addNote = () => {
    const input = document.getElementById('nwDpNoteInput');
    const text  = input.value.trim();
    if (!text) return;
    const notes = normaliseNotes(bee.notes);
    notes.push({ text, date: new Date().toISOString() });
    bee.notes = notes;
    persistBee(bee);
    renderDetailPanelBody(bee, ownerComb);
  };
  document.getElementById('nwDpNoteSubmit').addEventListener('click', addNote);
  document.getElementById('nwDpNoteInput').addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });

  document.getElementById('nwDpEdit').addEventListener('click', () => {
    closeDetailPanel();
    openEditBeeModal(bee, ownerComb);
  });

  // "Add a bee" from this bee's panel — opens add modal pre-connected to current bee
  document.getElementById('nwDpAddFrom').addEventListener('click', () => {
    openAddBeeFromModal(bee, ownerComb);
  });

  document.getElementById('nwDpAddConn').addEventListener('click', () => openAddConnectionModal(bee, ownerComb));

  // Click a connection row to open that bee's panel
  body.querySelectorAll('.nw-dp-conn-row[data-target-id]').forEach(row => {
    row.addEventListener('click', () => {
      const tid  = row.dataset.targetId;
      const tComb = _data.combs.find(c => c.bees.some(b => b.id === tid));
      if (!tComb) return;
      const tBee = tComb.bees.find(b => b.id === tid);
      if (tBee) openDetailPanel(tBee, tComb);
    });
  });

  document.getElementById('nwDpDelete').addEventListener('click', () => {
    const realComb = ownerComb && ownerComb.id !== ALL_BEES_ID
      ? _data.combs.find(c => c.id === ownerComb.id)
      : _data.combs.find(c => c.bees.some(b => b.id === bee.id));
    if (realComb) {
      realComb.bees = realComb.bees.filter(b => b.id !== bee.id);
      saveData(_data);
    }
    closeDetailPanel();
    renderSidebar();
    renderCanvas();
  });
}

function closeDetailPanel() {
  _detailBee   = null;
  _detailOwner = null;
  _selected    = null;
  const panel  = document.getElementById('nwDetailPanel');
  if (panel) panel.classList.remove('open');
  renderCanvas();
}

/** Persist a mutated bee object back into _data */
function persistBee(bee) {
  for (const comb of _data.combs) {
    const idx = comb.bees.findIndex(b => b.id === bee.id);
    if (idx !== -1) { comb.bees[idx] = bee; }
  }
  saveData(_data);
}

// ── Add connection modal ──────────────────────────────────────────

// ── Add a bee directly from another bee's panel ───────────────────
/**
 * Opens the "Add a bee" modal and, on save, automatically creates
 * a mutual connection between the new bee and sourceBee.
 */
function openAddBeeFromModal(sourceBee, sourceComb) {
  const newId  = uid();
  const newBee = { id: newId, name: '', role: '', company: '', email: '', location: '', relationship: '', metThrough: '', notes: [], connections: [] };

  // Reuse showBeeModal in "add" mode
  showBeeModal({
    title:     `Add a bee connected to ${sourceBee.name || 'this bee'}`,
    bee:       newBee,
    isNew:     true,
    ownerComb: sourceComb,
    _afterSave: (saved, targetComb) => {
      // Wire mutual connection both ways
      saved.connections = [...(saved.connections || []), { targetId: sourceBee.id, type: 'mutual', note: '' }];
      sourceBee.connections = [...(sourceBee.connections || []), { targetId: saved.id, type: 'mutual', note: '' }];
      // Persist both
      const idx = targetComb.bees.findIndex(b => b.id === saved.id);
      if (idx !== -1) targetComb.bees[idx] = saved;
      persistBee(sourceBee);
      saveData(_data);
      renderSidebar();
      renderCanvas();
      openDetailPanel(saved, targetComb);
    },
  });
}


function openAddConnectionModal(bee, ownerComb) {
  document.getElementById('nwConnModal')?.remove();

  // Available targets: all bees except this one
  const allBees = _data.combs.flatMap(c => c.bees).filter(b => b.id !== bee.id);
  // Deduplicate
  const seen = new Set();
  const targets = allBees.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });

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
            <option value="mutual">Mutual connection</option>
            <option value="transient">Transient — met through this person</option>
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

    // Prevent duplicates
    const existing = (bee.connections || []).find(c => c.targetId === targetId && c.type === type);
    if (existing) { close(); return; }

    bee.connections = [...(bee.connections || []), { targetId, type, note }];
    persistBee(bee);
    close();
    openDetailPanel(bee, ownerComb);
    renderCanvas();
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
    _data.combs = _data.combs.filter(c => c.id !== combId);
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
      const newComb = { id: uid(), name: combName, description: combDesc, bees: [] };
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
    bee:   { id: uid(), name: '', role: '', company: '', email: '', location: '', relationship: '', metThrough: '', notes: [], connections: [] },
    isNew: true,
  });
}

function openEditBeeModal(bee, ownerComb) {
  showBeeModal({ title: 'Edit bee', bee: { ...bee }, isNew: false, ownerComb });
}

function showBeeModal({ title, bee, isNew, ownerComb, _afterSave }) {
  document.getElementById('nwBeeModal')?.remove();

  const REL_TYPES = ['Mentor', 'Technical Expert', 'Manager', 'Counterpart', 'Partner', 'Peer', 'Client', 'Other'];

  // For import: collect existing bees from other combs (not already in target comb)
  const targetCombId = ownerComb ? ownerComb.id
    : (_activeComb !== ALL_BEES_ID ? _activeComb : (_data.combs[0]?.id || null));
  const targetComb = _data.combs.find(c => c.id === targetCombId);
  const existingIds = new Set(targetComb ? targetComb.bees.map(b => b.id) : []);

  const importCandidates = [];
  const seen = new Set();
  _data.combs.forEach(c => {
    if (c.id === targetCombId) return;
    c.bees.forEach(b => {
      if (!seen.has(b.id) && !existingIds.has(b.id)) {
        seen.add(b.id);
        importCandidates.push(b);
      }
    });
  });

  const importSection = isNew && importCandidates.length > 0 ? `
    <div class="nw-modal-divider">— or import existing bee —</div>
    <label class="nw-modal-label">
      Import from another comb
      <select class="nw-modal-select" id="nwmImport">
        <option value="">— choose a bee to import —</option>
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

  // Import select auto-fills the form
  const importSel = document.getElementById('nwmImport');
  if (importSel) {
    importSel.addEventListener('change', () => {
      const beeId = importSel.value;
      if (!beeId) return;
      const src = importCandidates.find(b => b.id === beeId);
      if (!src) return;
      document.getElementById('nwmName').value        = src.name        || '';
      document.getElementById('nwmRole').value        = src.role        || '';
      document.getElementById('nwmCompany').value     = src.company     || '';
      document.getElementById('nwmEmail').value       = src.email       || '';
      document.getElementById('nwmLocation').value    = src.location    || '';
      document.getElementById('nwmMetThrough').value  = src.metThrough  || '';
      const relSel = document.getElementById('nwmRelationship');
      relSel.value = src.relationship || '';
      // Store the imported bee's id so we can reuse it
      overlay.dataset.importId = src.id;
    });
  }

  document.getElementById('nwmDelete')?.addEventListener('click', () => {
    const comb = ownerComb || activeComb();
    if (comb && comb.id !== ALL_BEES_ID) {
      comb.bees = comb.bees.filter(b => b.id !== bee.id);
      saveData(_data);
    }
    renderSidebar();
    close();
    renderCanvas();
  });

  document.getElementById('nwmSave').addEventListener('click', () => {
    const name = document.getElementById('nwmName').value.trim();
    if (!name) { document.getElementById('nwmName').focus(); return; }

    // If importing, reuse the imported bee's id so connections stay intact
    const finalId = (isNew && overlay.dataset.importId) ? overlay.dataset.importId : bee.id;

    const updated = {
      id:           finalId,
      name,
      role:         document.getElementById('nwmRole').value.trim(),
      company:      document.getElementById('nwmCompany').value.trim(),
      email:        document.getElementById('nwmEmail').value.trim(),
      location:     document.getElementById('nwmLocation').value.trim(),
      relationship: document.getElementById('nwmRelationship').value,
      metThrough:   document.getElementById('nwmMetThrough').value.trim(),
      notes:        normaliseNotes(bee.notes),
      connections:  bee.connections || [],
      ...(typeof bee.x === 'number' ? { x: bee.x, y: bee.y } : {}),
    };

    let targetComb = ownerComb || null;
    if (!targetComb || targetComb.id === ALL_BEES_ID) {
      const realCombs = _data.combs.filter(c => c.id !== ALL_BEES_ID);
      targetComb = _activeComb !== ALL_BEES_ID
        ? _data.combs.find(c => c.id === _activeComb)
        : realCombs[0] || null;
    }
    if (!targetComb) { close(); return; }

    if (isNew) {
      targetComb.bees.push(updated);
    } else {
      const idx = targetComb.bees.findIndex(b => b.id === bee.id);
      if (idx !== -1) targetComb.bees[idx] = updated;
    }

    if (_afterSave) {
      // Let caller handle save/render/panel
      close();
      _afterSave(updated, targetComb);
    } else {
      saveData(_data);
      renderSidebar();
      close();
      renderCanvas();
      if (_detailBee && _detailBee.id === updated.id) {
        openDetailPanel(updated, targetComb);
      }
    }
  });

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
