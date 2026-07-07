/**
 * colony.js — IBM Hive Colony view
 *
 * Default zoom-out: all people pack into ONE large hexagonal hive silhouette.
 * Zoom in: colony cluster labels + individual names become legible.
 * Zero gap between cells; cells separated only by a 1px white outline stroke.
 */
import { getPeople } from '../api.js';
import { openPerson } from '../panel.js';

// ── Colony metadata ────────────────────────────────────────────
const COLONY_COLORS = {
  'Data & AI Colony':      '#1a3a5c',
  'Automation Colony':     '#1e2e4a',
  'Sustainability Colony': '#1a3028',
  'Security Colony':       '#3a1a1a',
  'Infrastructure Colony': '#2a1f3a',
  'Hybrid Cloud Colony':   '#2e1f30',
};

const COLONY_ORDER = [
  'Data & AI Colony',
  'Automation Colony',
  'Sustainability Colony',
  'Security Colony',
  'Infrastructure Colony',
  'Hybrid Cloud Colony',
];

// Role display labels from IBM spec
const ROLE_LABELS = {
  exec:     'VP / Exec',
  director: 'Director',
  manager:  'Manager',
  bss:      'BSS',
  bts:      'BTS',
  csm:      'CSM',
  ae:       'AE',
  tse:      'BTS',
  sdr:      'SDR',
  partner:  'Partner',
  intern:   'Intern',
  other:    'Other',
};

const ROLE_ORDER = {
  exec: 0, director: 1, manager: 2,
  bss: 3, ae: 3,
  bts: 4, tse: 4,
  csm: 5, sdr: 6, partner: 7,
  intern: 8, other: 9,
};

// ── Hex geometry helpers ───────────────────────────────────────
// Flat-top hexagons: width = size*2, height = size*sqrt(3)
// We use pointy-top for the hive (vertical stacking)
// Cell size (hex "radius" = center to vertex)
const HEX_R   = 44;   // outer radius (px)
const HEX_W   = Math.round(Math.sqrt(3) * HEX_R);  // pointy-top width
const HEX_H   = HEX_R * 2;                          // pointy-top height
// Row pitch (rows overlap by 1/4 height)
const ROW_H   = HEX_H * 0.75;
// Col pitch (no gap)
const COL_W   = HEX_W;

/**
 * Generate axial (q,r) coordinates for a filled hexagonal region of radius N.
 * Returns array of {q, r} — covers all cells where max(|q|,|r|,|q+r|) <= N.
 */
function hexRegion(N) {
  const cells = [];
  for (let q = -N; q <= N; q++) {
    const r1 = Math.max(-N, -q - N);
    const r2 = Math.min(N,  -q + N);
    for (let r = r1; r <= r2; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

/**
 * Convert axial (q,r) to pixel center (pointy-top orientation).
 */
function axialToPixel(q, r) {
  const x = HEX_W * (q + r / 2);
  const y = ROW_H * r;
  return { x, y };
}

export async function renderOrg(container) {
  container.innerHTML = `
    <div class="colony-page">
      <div class="colony-toolbar">
        <div class="colony-toolbar-left">
          <span class="colony-title">IBM Hive</span>
          <span class="colony-subtitle" id="colonySubtitle">Loading…</span>
        </div>
        <div class="colony-toolbar-controls">
          <select class="sort-select" id="colonySort">
            <option value="colony">Group by Colony</option>
            <option value="role">Sort by Role</option>
            <option value="name">Sort by Name</option>
          </select>
          <button class="colony-zoom-btn" id="colonyZoomIn"  title="Zoom in">+</button>
          <button class="colony-zoom-btn" id="colonyZoomOut" title="Zoom out">−</button>
          <button class="colony-zoom-btn" id="colonyZoomReset" title="Fit to screen" style="font-size:11px;letter-spacing:0.5px">FIT</button>
        </div>
      </div>
      <div class="colony-viewport" id="colonyViewport">
        <svg class="colony-svg" id="colonySvg" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
    </div>
  `;

  const people = await getPeople();
  document.getElementById('colonySubtitle').textContent =
    `All Colonies · ${people.length} people`;

  let sortMode = 'colony';

  function redraw() {
    buildHive(people, sortMode);
  }

  document.getElementById('colonySort')?.addEventListener('change', e => {
    sortMode = e.target.value;
    redraw();
  });

  redraw();
  wireZoom(people, sortMode);
}

// ── Build the SVG hive ─────────────────────────────────────────
function buildHive(people, sortMode) {
  const svg = document.getElementById('colonySvg');
  if (!svg) return;

  // Determine grid radius that fits everyone
  // hexRegion(N) gives (3N²+3N+1) cells
  let N = 1;
  while (hexRegion(N).length < people.length) N++;
  const cells = hexRegion(N);

  // Sort people
  let sorted = [...people];
  if (sortMode === 'name') {
    sorted.sort((a, b) => (a.first_name + a.last_name).localeCompare(b.first_name + b.last_name));
  } else if (sortMode === 'role') {
    sorted.sort((a, b) => (ROLE_ORDER[a.role_type] ?? 9) - (ROLE_ORDER[b.role_type] ?? 9));
  } else {
    // colony — group by colony, sorted by role within colony
    const byColony = {};
    COLONY_ORDER.forEach(c => { byColony[c] = []; });
    sorted.forEach(p => {
      const key = p.comb || 'Other';
      if (!byColony[key]) byColony[key] = [];
      byColony[key].push(p);
    });
    COLONY_ORDER.forEach(c => {
      if (byColony[c]) byColony[c].sort((a, b) => (ROLE_ORDER[a.role_type] ?? 9) - (ROLE_ORDER[b.role_type] ?? 9));
    });
    sorted = COLONY_ORDER.flatMap(c => byColony[c] || []);
    // append anyone in an unknown colony
    const known = new Set(COLONY_ORDER);
    people.forEach(p => { if (p.comb && !known.has(p.comb)) sorted.push(p); });
    // dedupe (in case the above double-added)
    const seen = new Set();
    sorted = sorted.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  }

  // Map cells in spiral order (outward from center) — cells from hexRegion
  // come naturally in a good order (row by row) but we want concentric rings.
  // Sort cells by ring then angle for natural colony grouping.
  cells.sort((a, b) => {
    const ra = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
    const rb = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
    if (ra !== rb) return ra - rb;
    return Math.atan2(axialToPixel(a.q,a.r).y, axialToPixel(a.q,a.r).x) -
           Math.atan2(axialToPixel(b.q,b.r).y, axialToPixel(b.q,b.r).x);
  });

  // Assign people to cells
  const assignments = cells.slice(0, sorted.length).map((cell, i) => ({
    ...cell,
    person: sorted[i] || null,
    px: axialToPixel(cell.q, cell.r),
  }));

  // Compute SVG bounding box
  const xs = assignments.map(a => a.px.x);
  const ys = assignments.map(a => a.px.y);
  const minX = Math.min(...xs) - HEX_R;
  const maxX = Math.max(...xs) + HEX_R;
  const minY = Math.min(...ys) - HEX_R;
  const maxY = Math.max(...ys) + HEX_R;
  const svgW = maxX - minX + 4;
  const svgH = maxY - minY + 4;

  svg.setAttribute('viewBox', `${minX - 2} ${minY - 2} ${svgW} ${svgH}`);
  svg.setAttribute('width',  svgW);
  svg.setAttribute('height', svgH);

  // Build SVG content
  const ns = 'http://www.w3.org/2000/svg';

  // Clear
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Defs — clip paths per cell (not needed with polygon approach)
  const defs = document.createElementNS(ns, 'defs');
  svg.appendChild(defs);

  // Pointy-top hex polygon points (centered at 0,0, outer radius HEX_R)
  function hexPoints(cx, cy, r) {
    return Array.from({length: 6}, (_, i) => {
      const angle = Math.PI / 180 * (60 * i - 30); // pointy-top
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  }

  // Draw all filled hex cells
  assignments.forEach((a, idx) => {
    const { x, y } = a.px;
    const p = a.person;
    const colony = p?.comb || 'Other';
    const bg = COLONY_COLORS[colony] || '#222222';
    const isYou = p?.is_current_user;

    // Background hex (full size, touching neighbors)
    const bgHex = document.createElementNS(ns, 'polygon');
    bgHex.setAttribute('points', hexPoints(x, y, HEX_R - 0.5));
    bgHex.setAttribute('fill', isYou ? '#1e3a5f' : bg);
    bgHex.setAttribute('stroke', 'rgba(255,255,255,0.18)');
    bgHex.setAttribute('stroke-width', '1');
    bgHex.style.cursor = 'pointer';
    svg.appendChild(bgHex);

    // "You" ring
    if (isYou) {
      const ring = document.createElementNS(ns, 'polygon');
      ring.setAttribute('points', hexPoints(x, y, HEX_R - 1));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'rgba(255,255,255,0.6)');
      ring.setAttribute('stroke-width', '2');
      svg.appendChild(ring);
    }

    // Name text — hidden at low zoom, revealed by CSS class .show-names
    if (p) {
      const name = p.first_name + ' ' + (p.last_name.length > 6 ? p.last_name.charAt(0) + '.' : p.last_name);
      const role = ROLE_LABELS[p.role_type] || p.role_type?.toUpperCase() || '';

      const nameText = document.createElementNS(ns, 'text');
      nameText.setAttribute('x', x);
      nameText.setAttribute('y', y - 3);
      nameText.setAttribute('text-anchor', 'middle');
      nameText.setAttribute('dominant-baseline', 'middle');
      nameText.setAttribute('fill', isYou ? '#fff' : 'rgba(255,255,255,0.85)');
      nameText.setAttribute('font-size', '8');
      nameText.setAttribute('font-weight', '500');
      nameText.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
      nameText.setAttribute('pointer-events', 'none');
      nameText.classList.add('hex-label-name');
      nameText.textContent = name;
      svg.appendChild(nameText);

      const roleText = document.createElementNS(ns, 'text');
      roleText.setAttribute('x', x);
      roleText.setAttribute('y', y + 8);
      roleText.setAttribute('text-anchor', 'middle');
      roleText.setAttribute('dominant-baseline', 'middle');
      roleText.setAttribute('fill', 'rgba(255,255,255,0.45)');
      roleText.setAttribute('font-size', '6');
      roleText.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
      roleText.setAttribute('pointer-events', 'none');
      roleText.classList.add('hex-label-role');
      roleText.textContent = role;
      svg.appendChild(roleText);
    }

    // Invisible click target
    if (p) {
      const hit = document.createElementNS(ns, 'polygon');
      hit.setAttribute('points', hexPoints(x, y, HEX_R - 0.5));
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('stroke', 'none');
      hit.setAttribute('data-person-id', p.id);
      hit.style.cursor = 'pointer';
      svg.appendChild(hit);
    }
  });

  // Colony section labels (shown when zoomed in enough)
  if (sortMode === 'colony') {
    // Find centroid of each colony's cells
    const centroids = {};
    assignments.forEach(a => {
      if (!a.person) return;
      const c = a.person.comb || 'Other';
      if (!centroids[c]) centroids[c] = { xs: [], ys: [] };
      centroids[c].xs.push(a.px.x);
      centroids[c].ys.push(a.px.y);
    });

    COLONY_ORDER.forEach(colonyName => {
      if (!centroids[colonyName]) return;
      const cxs = centroids[colonyName].xs;
      const cys = centroids[colonyName].ys;
      const cx = cxs.reduce((s, v) => s + v, 0) / cxs.length;
      const cy = Math.min(...cys) - HEX_R - 8;

      const label = document.createElementNS(ns, 'text');
      label.setAttribute('x', cx);
      label.setAttribute('y', cy);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', 'rgba(255,255,255,0.35)');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '600');
      label.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
      label.setAttribute('letter-spacing', '1');
      label.setAttribute('text-transform', 'uppercase');
      label.setAttribute('pointer-events', 'none');
      label.classList.add('colony-section-label');
      label.textContent = colonyName.replace(' Colony', '').toUpperCase();
      svg.appendChild(label);
    });
  }

  // Wire click events
  svg.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

// ── Zoom / Pan with scale-aware label visibility ──────────────
function wireZoom(people, sortMode) {
  const viewport = document.getElementById('colonyViewport');
  const svg      = document.getElementById('colonySvg');
  if (!viewport || !svg) return;

  let scale = 1;
  let tx = 0, ty = 0;
  let dragging = false, didDrag = false, sx = 0, sy = 0, stx = 0, sty = 0;

  // Fit the whole hive into the viewport on load
  function fitToViewport() {
    const vw = viewport.clientWidth  || 800;
    const vh = viewport.clientHeight || 600;
    const svgW = parseFloat(svg.getAttribute('width')  || vw);
    const svgH = parseFloat(svg.getAttribute('height') || vh);
    scale = Math.min(vw / svgW, vh / svgH) * 0.92;
    tx = (vw - svgW * scale) / 2;
    ty = (vh - svgH * scale) / 2;
    applyTransform();
  }

  function applyTransform() {
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    svg.style.transformOrigin = '0 0';
    updateLabelVisibility();
  }

  // Show names only when zoomed in enough (scale > 0.55)
  function updateLabelVisibility() {
    const showNames = scale > 0.55;
    const showColonyLabels = scale > 0.3;
    svg.querySelectorAll('.hex-label-name, .hex-label-role').forEach(el => {
      el.style.opacity = showNames ? '1' : '0';
    });
    svg.querySelectorAll('.colony-section-label').forEach(el => {
      el.style.opacity = showColonyLabels ? '1' : '0';
    });
  }

  // Wait for SVG to render, then fit
  requestAnimationFrame(() => {
    requestAnimationFrame(fitToViewport);
  });

  document.getElementById('colonyZoomIn')?.addEventListener('click', () => {
    const vw = viewport.clientWidth / 2;
    const vh = viewport.clientHeight / 2;
    const ns = Math.min(scale * 1.35, 5);
    tx = vw - (vw - tx) * (ns / scale);
    ty = vh - (vh - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  });
  document.getElementById('colonyZoomOut')?.addEventListener('click', () => {
    const vw = viewport.clientWidth / 2;
    const vh = viewport.clientHeight / 2;
    const ns = Math.max(scale / 1.35, 0.08);
    tx = vw - (vw - tx) * (ns / scale);
    ty = vh - (vh - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  });
  document.getElementById('colonyZoomReset')?.addEventListener('click', fitToViewport);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    const ns = Math.min(Math.max(scale * delta, 0.08), 5);
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    tx = mx - (mx - tx) * (ns / scale);
    ty = my - (my - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  }, { passive: false });

  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    dragging = true; didDrag = false;
    sx = e.clientX; sy = e.clientY;
    stx = tx; sty = ty;
    viewport.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag = true;
    tx = stx + dx; ty = sty + dy;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    if (viewport) viewport.style.cursor = 'grab';
  });
  viewport.addEventListener('click', e => {
    if (didDrag) { e.stopImmediatePropagation(); didDrag = false; }
  }, true);

  let lt = null;
  viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 1) lt = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if (!lt || e.touches.length !== 1) return;
    tx = lt.tx + (e.touches[0].clientX - lt.x);
    ty = lt.ty + (e.touches[0].clientY - lt.y);
    applyTransform();
  }, { passive: true });
  viewport.addEventListener('touchend', () => { lt = null; });
}
