/**
 * network.js — Network tab
 *
 * Purpose: "Who do I know?"
 * Layout: full SVG honeycomb, you at center, contacts as hex nodes,
 *         lines connecting each contact back to you.
 * Click a contact hex → modal with editable details.
 * Contacts are custom-created (no dependency on backend people).
 * Data stored in localStorage under 'ibm_hive_network_v2'.
 */

// ── Persistence ───────────────────────────────────────────────────
const STORE_KEY = 'ibm_hive_network_v2';

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
  // Each contact: { id, name, role, company, relationship, notes }
}

function saveContacts(contacts) {
  localStorage.setItem(STORE_KEY, JSON.stringify(contacts));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Hex geometry (flat-top, same as org.js) ───────────────────────
const R   = 60;                        // hex radius
const W   = R * 2;                     // hex width  (flat-top)
const H   = R * Math.sqrt(3);          // hex height (flat-top)
const GAP = 14;                        // gap between hexes

// Flat-top hex points: angle offset = 0
function hexPts(cx, cy, r) {
  r = r || R;
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

// Spiral positions around a center hex (flat-top axial coords)
// Returns [{cx, cy}] for up to N surrounding slots
function spiralPositions(count) {
  const step = W + GAP;          // center-to-center horizontal
  const vert = H + GAP;          // center-to-center vertical
  // Six directions in flat-top offset coords
  const dirs = [
    [step,        0         ],   // E
    [step * 0.5,  vert * 0.5],   // SE (approx cube-to-offset)
    [-step * 0.5, vert * 0.5],   // SW
    [-step,       0         ],   // W
    [-step * 0.5, -vert * 0.5],  // NW
    [step * 0.5,  -vert * 0.5],  // NE
  ];

  // Use flat-top cube coordinate ring generation
  // ring r = r*(step) from center
  const positions = [];
  let ring = 1;
  while (positions.length < count) {
    // Start at top-right of ring
    let q = ring, r2 = 0, s = -ring;
    const cubeToXY = (q, r2) => {
      const x = step * q + step * 0.5 * r2;
      const y = vert * 0.5 * r2;
      return { cx: x, cy: y };
    };
    // Walk the ring in 6 directions
    const ringDirs = [
      [0,  1, -1],  [-1, 1, 0],  [-1, 0, 1],
      [0, -1,  1],  [1, -1, 0],  [1,  0, -1],
    ];
    for (let d = 0; d < 6; d++) {
      for (let i = 0; i < ring; i++) {
        positions.push(cubeToXY(q, r2));
        q += ringDirs[d][0];
        r2 += ringDirs[d][1];
        s += ringDirs[d][2];
      }
    }
    ring++;
  }
  return positions.slice(0, count);
}

// ── Module state ──────────────────────────────────────────────────
let _contacts  = [];
let _container = null;
let _selected  = null;   // contact id currently selected (highlighted blue)
let _drag      = null;   // { id, startX, startY, origCx, origCy, moved }
let _ox        = 0;      // canvas-space "you" origin, refreshed each drawHive()
let _oy        = 0;

// ── Entry ─────────────────────────────────────────────────────────
export function renderNetwork(container) {
  _container = container;
  _contacts  = loadContacts();
  _selected  = null;

  container.innerHTML = `
    <div class="nw-page">
      <div class="nw-toolbar">
        <span class="nw-toolbar-title">My Network</span>
        <button class="nw-add-btn" id="nwAddContact">+ Add contact</button>
      </div>
      <div class="nw-canvas-wrap" id="nwCanvasWrap"></div>
    </div>
  `;

  document.getElementById('nwAddContact').addEventListener('click', () => openAddModal());

  // Drag tracking lives at the window level and is wired once per view
  // activation (renderNetwork only runs once — see app.js's view cache),
  // rather than per-redraw, so it never stacks up duplicate listeners.
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);

  drawHive();
}

// ── Drag handlers (wired once at window level) ────────────────────
function onDragMove(e) {
  if (!_drag) return;

  const dx = e.clientX - _drag.startX;
  const dy = e.clientY - _drag.startY;
  if (!_drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    _drag.moved = true;
    document.body.style.userSelect = 'none'; // prevent text selection during drag
  }
  if (!_drag.moved) return;

  const cx = _drag.origCx + dx;
  const cy = _drag.origCy + dy;

  // Move the hex group by translating it relative to its painted position
  const g = document.querySelector(`.nw-hex-node[data-cid="${_drag.id}"]`);
  if (g) {
    const baseCx = parseFloat(g.dataset.cx);
    const baseCy = parseFloat(g.dataset.cy);
    g.setAttribute('transform', `translate(${(cx - baseCx).toFixed(1)},${(cy - baseCy).toFixed(1)})`);
    g.style.cursor = 'grabbing';
  }
  // Rubber-band the connecting line
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

  if (!moved) {
    // Tap with no movement → open the detail modal
    const c = _contacts.find(x => x.id === id);
    if (c) openDetailModal(c);
    return;
  }

  // Real drag: save final position and redraw to commit it
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  const contact = _contacts.find(c => c.id === id);
  if (contact) {
    contact.x = (origCx + dx) - _ox;
    contact.y = (origCy + dy) - _oy;
    saveContacts(_contacts);
  }
  drawHive();
}

// ── Draw SVG hive ─────────────────────────────────────────────────
function drawHive() {
  const wrap = document.getElementById('nwCanvasWrap');
  if (!wrap) return;

  const contacts = _contacts;
  const fallback = spiralPositions(Math.max(contacts.length, 1));

  // A contact keeps its auto (spiral) slot until it's been dragged, at
  // which point its own stored x/y — relative to the "you" origin —
  // takes over permanently.
  const positions = contacts.map((c, i) =>
    (typeof c.x === 'number' && typeof c.y === 'number') ? { cx: c.x, cy: c.y } : fallback[i]
  );

  // Compute bounding box
  const allCX = [0, ...positions.map(p => p.cx)];
  const allCY = [0, ...positions.map(p => p.cy)];
  const minX  = Math.min(...allCX);
  const minY  = Math.min(...allCY);
  const maxX  = Math.max(...allCX);
  const maxY  = Math.max(...allCY);

  const PAD   = R + 48;
  const svgW  = (maxX - minX) + W + PAD * 2;
  const svgH  = (maxY - minY) + H + PAD * 2;
  const ox    = PAD + (-minX) + (W / 2);  // offset to center "you" at origin→canvas
  const oy    = PAD + (-minY) + (H / 2);

  // ── Lines (you → each contact) ───────────────────────────────
  let lines = '';
  contacts.forEach((c, i) => {
    const p  = positions[i];
    const opacity = 0.30;
    lines += `<line
      id="nw-line-${c.id}"
      x1="${ox.toFixed(1)}" y1="${oy.toFixed(1)}"
      x2="${(ox + p.cx).toFixed(1)}" y2="${(oy + p.cy).toFixed(1)}"
      stroke="#4589ff" stroke-width="1.5" stroke-opacity="${opacity}"
      stroke-linecap="round"/>`;
  });

  // ── "You" hex ────────────────────────────────────────────────
  const YOU_LABEL = 'Sydney';
  const YOU_SUB   = 'BTSS';
  let hexes = `
    <g class="nw-you-node" style="cursor:default">
      <polygon points="${hexPts(ox, oy)}" fill="#2a2a2a" stroke="#a855f7" stroke-width="2.5"/>
      <text x="${ox}" y="${(oy - 8).toFixed(1)}" text-anchor="middle"
        fill="#ffffff" font-size="13" font-weight="600"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${YOU_LABEL}</text>
      <text x="${ox}" y="${(oy + 10).toFixed(1)}" text-anchor="middle"
        fill="rgba(255,255,255,0.45)" font-size="10"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${YOU_SUB}</text>
    </g>`;

  // ── Contact hexes ─────────────────────────────────────────────
  contacts.forEach((c, i) => {
    const p     = positions[i];
    const cx    = ox + p.cx;
    const cy    = oy + p.cy;
    const isSel = _selected === c.id;

    const stroke    = isSel ? '#4589ff' : 'rgba(255,255,255,0.70)';
    const sw        = isSel ? 2.5 : 1.5;
    const fill      = isSel ? '#0a1a36' : '#2a2a2a';

    // Wrap long names: first/last on separate lines
    const nameParts  = c.name.trim().split(' ');
    const firstName  = nameParts[0] || '';
    const restName   = nameParts.slice(1).join(' ');
    const hasTwo     = restName.length > 0;
    const roleTxt    = c.role ? (c.role.length > 14 ? c.role.slice(0, 13) + '…' : c.role) : '';

    let nameEl;
    if (hasTwo) {
      nameEl = `
        <text x="${cx.toFixed(1)}" y="${(cy - 12).toFixed(1)}" text-anchor="middle"
          fill="#ffffff" font-size="11" font-weight="500"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${esc(firstName)}</text>
        <text x="${cx.toFixed(1)}" y="${(cy + 2).toFixed(1)}" text-anchor="middle"
          fill="#ffffff" font-size="11" font-weight="500"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${esc(restName)}</text>
        ${roleTxt ? `<text x="${cx.toFixed(1)}" y="${(cy + 17).toFixed(1)}" text-anchor="middle"
          fill="rgba(255,255,255,0.40)" font-size="9"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${esc(roleTxt)}</text>` : ''}`;
    } else {
      nameEl = `
        <text x="${cx.toFixed(1)}" y="${(cy - 4).toFixed(1)}" text-anchor="middle"
          fill="#ffffff" font-size="11" font-weight="500"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${esc(firstName)}</text>
        ${roleTxt ? `<text x="${cx.toFixed(1)}" y="${(cy + 12).toFixed(1)}" text-anchor="middle"
          fill="rgba(255,255,255,0.40)" font-size="9"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${esc(roleTxt)}</text>` : ''}`;
    }

    hexes += `
      <g class="nw-hex-node" data-cid="${c.id}" data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}" style="cursor:grab">
        <polygon points="${hexPts(cx, cy)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        ${nameEl}
      </g>`;
  });

  // Empty state hint
  const emptyHint = contacts.length === 0
    ? `<text x="${ox}" y="${(oy + R + 36).toFixed(1)}" text-anchor="middle"
        fill="#3a3a3a" font-size="12" font-family="IBM Plex Sans,system-ui,sans-serif"
        pointer-events="none">Click "+ Add contact" to build your network</text>`
    : '';

  wrap.innerHTML = `
    <svg id="nwHiveSvg"
      width="${svgW.toFixed(0)}" height="${svgH.toFixed(0)}"
      viewBox="0 0 ${svgW.toFixed(0)} ${svgH.toFixed(0)}"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block;overflow:visible">
      <g>${lines}</g>
      <g>${hexes}</g>
      ${emptyHint}
    </svg>`;

  _ox = ox;
  _oy = oy;

  // ── Per-node events ───────────────────────────────────────────
  // hover highlight is handled by CSS .nw-hex-node:hover polygon — no redraw needed.
  // mousedown starts a drag; the window-level mouseup decides click vs drag.
  wrap.querySelectorAll('.nw-hex-node').forEach(el => {
    const cid = el.dataset.cid;

    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault(); // stop browser native drag / text-select
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

// ── Add Contact Modal ─────────────────────────────────────────────
function openAddModal() {
  showModal({
    title: 'Add contact',
    contact: { id: uid(), name: '', role: '', company: '', relationship: '', notes: '' },
    isNew: true,
  });
}

// ── Detail / Edit Modal ───────────────────────────────────────────
function openDetailModal(contact) {
  showModal({ title: contact.name || 'Contact', contact: { ...contact }, isNew: false });
}

function showModal({ title, contact, isNew }) {
  // Remove any existing modal
  document.getElementById('nwModal')?.remove();

  const REL_TYPES = ['Mentor', 'Technical Expert', 'Manager', 'Counterpart', 'Partner', 'Peer', 'Client', 'Other'];

  const overlay = document.createElement('div');
  overlay.id = 'nwModal';
  overlay.className = 'nw-modal-overlay';
  overlay.innerHTML = `
    <div class="nw-modal">
      <div class="nw-modal-header">
        <div class="nw-modal-title">${esc(title)}</div>
        <button class="nw-modal-close" id="nwModalClose">✕</button>
      </div>
      <div class="nw-modal-body">
        <label class="nw-modal-label">
          Name
          <input class="nw-modal-input" id="nwmName" type="text" placeholder="Full name" value="${esc(contact.name)}"/>
        </label>
        <label class="nw-modal-label">
          Role / Title
          <input class="nw-modal-input" id="nwmRole" type="text" placeholder="e.g. Solutions Architect" value="${esc(contact.role || '')}"/>
        </label>
        <label class="nw-modal-label">
          Company
          <input class="nw-modal-input" id="nwmCompany" type="text" placeholder="e.g. IBM, Partner Co." value="${esc(contact.company || '')}"/>
        </label>
        <label class="nw-modal-label">
          Relationship
          <select class="nw-modal-select" id="nwmRelationship">
            <option value="">— select —</option>
            ${REL_TYPES.map(r => `<option value="${r}"${contact.relationship === r ? ' selected' : ''}>${r}</option>`).join('')}
          </select>
        </label>
        <label class="nw-modal-label">
          Notes
          <textarea class="nw-modal-textarea" id="nwmNotes" rows="3" placeholder="Context, how you met, why this relationship matters…">${esc(contact.notes || '')}</textarea>
        </label>
      </div>
      <div class="nw-modal-footer">
        ${!isNew ? `<button class="nw-modal-delete" id="nwmDelete">Delete</button>` : ''}
        <div style="flex:1"></div>
        <button class="nw-modal-cancel" id="nwModalCancel">Cancel</button>
        <button class="nw-modal-save" id="nwmSave">Save</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const close = () => { overlay.remove(); _selected = null; drawHive(); };

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('nwModalClose').addEventListener('click', close);
  document.getElementById('nwModalCancel').addEventListener('click', close);

  document.getElementById('nwmDelete')?.addEventListener('click', () => {
    _contacts = _contacts.filter(c => c.id !== contact.id);
    saveContacts(_contacts);
    close();
  });

  document.getElementById('nwmSave').addEventListener('click', () => {
    const name = document.getElementById('nwmName').value.trim();
    if (!name) {
      document.getElementById('nwmName').focus();
      return;
    }
    const updated = {
      id:           contact.id,
      name,
      role:         document.getElementById('nwmRole').value.trim(),
      company:      document.getElementById('nwmCompany').value.trim(),
      relationship: document.getElementById('nwmRelationship').value,
      notes:        document.getElementById('nwmNotes').value.trim(),
      // Preserve a dragged position — editing details shouldn't snap it back.
      ...(typeof contact.x === 'number' ? { x: contact.x, y: contact.y } : {}),
    };
    if (isNew) {
      _contacts.push(updated);
    } else {
      const idx = _contacts.findIndex(c => c.id === contact.id);
      if (idx !== -1) _contacts[idx] = updated;
    }
    saveContacts(_contacts);
    close();
  });

  // Focus name field
  setTimeout(() => document.getElementById('nwmName')?.focus(), 60);
}

// ── Util ──────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
