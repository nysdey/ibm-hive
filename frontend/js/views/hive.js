/**
 * hive.js — The Hive: all-black, white grid-line hexagon map of all people.
 *
 * • All cells are #000 with 1px white stroke — no colors anywhere.
 * • Names hidden at low zoom; appear at zoom > 0.55.
 * • Colony section labels appear at zoom > 0.3.
 * • Sidebar filter events (portfolios / jobs / markets) dim non-matching cells.
 * • Click any cell → person detail panel.
 */
import { getPeople } from '../api.js';
import { openPerson } from '../panel.js';

const COLONY_ORDER = [
  'Data & AI Colony',
  'Automation Colony',
  'Sustainability Colony',
  'Security Colony',
  'Infrastructure Colony',
  'Hybrid Cloud Colony',
];

const ROLE_LABELS = {
  exec: 'VP / Exec', director: 'Director', manager: 'Manager',
  bss: 'BSS', bts: 'BTS', csm: 'CSM', ae: 'AE',
  tse: 'BTS', sdr: 'SDR', partner: 'Partner', intern: 'Intern', other: '',
};

const ROLE_ORDER = {
  exec: 0, director: 1, manager: 2, bss: 3, ae: 3,
  bts: 4, tse: 4, csm: 5, sdr: 6, partner: 7, intern: 8, other: 9,
};

// Map sidebar filter IDs to data fields
const COLONY_MAP = {
  'data-ai': 'Data & AI Colony',
  'automation': 'Automation Colony',
  'sustainability': 'Sustainability Colony',
  'security': 'Security Colony',
  'infrastructure': 'Infrastructure Colony',
  'hybrid-cloud': 'Hybrid Cloud Colony',
};

const MARKET_MAP = {
  enterprise: 'Enterprise',
  strategic:  'Strategic',
  horizon:    'Horizon',
  territory:  'Territory',
};

// Hex geometry — pointy-top
const HEX_R = 44;
const HEX_W = Math.round(Math.sqrt(3) * HEX_R);
const ROW_H = HEX_R * 1.5;

function hexRegion(N) {
  const cells = [];
  for (let q = -N; q <= N; q++) {
    const r1 = Math.max(-N, -q - N);
    const r2 = Math.min(N,  -q + N);
    for (let r = r1; r <= r2; r++) cells.push({ q, r });
  }
  return cells;
}

function axialToPixel(q, r) {
  return { x: HEX_W * (q + r / 2), y: ROW_H * r };
}

function hexPoints(cx, cy, r) {
  return Array.from({length: 6}, (_, i) => {
    const a = Math.PI / 180 * (60 * i - 30);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

let _people = [];
let _activeFilter = null; // { group, value }

export async function renderHive(container) {
  container.innerHTML = `
    <div class="hive-page">
      <div class="hive-toolbar">
        <div class="hive-toolbar-left">
          <span class="hive-title">The Hive</span>
          <span class="hive-subtitle" id="hiveSubtitle">Loading…</span>
        </div>
        <div class="hive-toolbar-controls">
          <button class="colony-zoom-btn" id="hiveZoomIn"  title="Zoom in">+</button>
          <button class="colony-zoom-btn" id="hiveZoomOut" title="Zoom out">−</button>
          <button class="colony-zoom-btn" id="hiveZoomReset" title="Fit" style="font-size:11px">Fit</button>
        </div>
      </div>
      <div class="colony-viewport" id="hiveViewport">
        <svg class="colony-svg" id="hiveSvg" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
    </div>
  `;

  _people = await getPeople();
  document.getElementById('hiveSubtitle').textContent =
    `${_people.length} people · 6 colonies`;

  buildSvg();
  wireZoom();

  // Listen for sidebar filter events
  document.addEventListener('sidebar:filter', onFilter);
  // Clean up when view is hidden
  container._cleanup = () => document.removeEventListener('sidebar:filter', onFilter);
}

function onFilter(e) {
  _activeFilter = e.detail;
  buildSvg();
}

function sortedPeople() {
  // Group by colony, sorted by role within colony
  const byColony = {};
  COLONY_ORDER.forEach(c => { byColony[c] = []; });
  _people.forEach(p => {
    const key = p.comb || 'Other';
    if (!byColony[key]) byColony[key] = [];
    byColony[key].push(p);
  });
  COLONY_ORDER.forEach(c => {
    if (byColony[c]) byColony[c].sort((a, b) =>
      (ROLE_ORDER[a.role_type] ?? 9) - (ROLE_ORDER[b.role_type] ?? 9)
    );
  });
  const sorted = COLONY_ORDER.flatMap(c => byColony[c] || []);
  const seen = new Set();
  return sorted.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
}

function isFiltered(p) {
  if (!_activeFilter) return false;
  const { group, value } = _activeFilter;
  if (group === 'portfolios') {
    return p.comb !== COLONY_MAP[value];
  }
  if (group === 'jobs') {
    // map sidebar role id to role_type
    const roleTypeMap = {
      bss: 'bss', bts: 'bts', csm: 'csm',
      manager: 'manager', director: 'director',
      exec: 'exec', partner: 'partner', sdr: 'sdr',
    };
    return p.role_type !== roleTypeMap[value];
  }
  if (group === 'markets') {
    return p.market !== MARKET_MAP[value];
  }
  return false;
}

function buildSvg() {
  const svg = document.getElementById('hiveSvg');
  if (!svg) return;

  const people = sortedPeople();
  let N = 1;
  while (hexRegion(N).length < people.length) N++;
  const cells = hexRegion(N);

  // Sort cells: center-out, then by angle so colonies cluster
  cells.sort((a, b) => {
    const ra = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
    const rb = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
    if (ra !== rb) return ra - rb;
    const pa = axialToPixel(a.q, a.r);
    const pb = axialToPixel(b.q, b.r);
    return Math.atan2(pa.y, pa.x) - Math.atan2(pb.y, pb.x);
  });

  const assignments = cells.slice(0, people.length).map((cell, i) => ({
    ...cell, person: people[i], px: axialToPixel(cell.q, cell.r),
  }));

  // SVG bounds
  const xs = assignments.map(a => a.px.x);
  const ys = assignments.map(a => a.px.y);
  const minX = Math.min(...xs) - HEX_R - 2;
  const maxX = Math.max(...xs) + HEX_R + 2;
  const minY = Math.min(...ys) - HEX_R - 2;
  const maxY = Math.max(...ys) + HEX_R + 2;
  const W = maxX - minX + 4;
  const H = maxY - minY + 4;

  svg.setAttribute('viewBox', `${minX - 2} ${minY - 2} ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const ns = 'http://www.w3.org/2000/svg';

  // Background rect — pure black
  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('x', minX - 2); bg.setAttribute('y', minY - 2);
  bg.setAttribute('width', W + 4); bg.setAttribute('height', H + 4);
  bg.setAttribute('fill', '#000');
  svg.appendChild(bg);

  // Draw cells
  assignments.forEach(a => {
    const { x, y } = a.px;
    const p = a.person;
    const dimmed = isFiltered(p);
    const isYou  = p.is_current_user;

    // Cell body — black fill, white stroke
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', hexPoints(x, y, HEX_R - 0.5));
    poly.setAttribute('fill', isYou ? '#111' : '#000');
    poly.setAttribute('stroke', dimmed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.22)');
    poly.setAttribute('stroke-width', '1');
    svg.appendChild(poly);

    // "You" inner ring
    if (isYou) {
      const ring = document.createElementNS(ns, 'polygon');
      ring.setAttribute('points', hexPoints(x, y, HEX_R - 3));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', dimmed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)');
      ring.setAttribute('stroke-width', '1.5');
      svg.appendChild(ring);
    }

    // Name — hidden by default, shown on zoom
    const name = p.first_name + ' ' + (p.last_name.length > 7 ? p.last_name.charAt(0) + '.' : p.last_name);
    const role = ROLE_LABELS[p.role_type] || '';

    const nameEl = document.createElementNS(ns, 'text');
    nameEl.setAttribute('x', x);
    nameEl.setAttribute('y', y - 4);
    nameEl.setAttribute('text-anchor', 'middle');
    nameEl.setAttribute('dominant-baseline', 'middle');
    nameEl.setAttribute('fill', dimmed ? 'rgba(255,255,255,0.2)' : (isYou ? '#fff' : 'rgba(255,255,255,0.82)'));
    nameEl.setAttribute('font-size', '8');
    nameEl.setAttribute('font-weight', '500');
    nameEl.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
    nameEl.setAttribute('pointer-events', 'none');
    nameEl.classList.add('hex-label-name');
    nameEl.textContent = name;
    svg.appendChild(nameEl);

    const roleEl = document.createElementNS(ns, 'text');
    roleEl.setAttribute('x', x);
    roleEl.setAttribute('y', y + 7);
    roleEl.setAttribute('text-anchor', 'middle');
    roleEl.setAttribute('dominant-baseline', 'middle');
    roleEl.setAttribute('fill', dimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.38)');
    roleEl.setAttribute('font-size', '6');
    roleEl.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
    roleEl.setAttribute('pointer-events', 'none');
    roleEl.classList.add('hex-label-role');
    roleEl.textContent = role;
    svg.appendChild(roleEl);

    // Click hit area
    const hit = document.createElementNS(ns, 'polygon');
    hit.setAttribute('points', hexPoints(x, y, HEX_R - 0.5));
    hit.setAttribute('fill', 'transparent');
    hit.setAttribute('stroke', 'none');
    hit.setAttribute('data-person-id', p.id);
    hit.style.cursor = 'pointer';
    svg.appendChild(hit);
  });

  // Colony section labels
  const centroids = {};
  assignments.forEach(a => {
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
    const cy = Math.min(...cys) - HEX_R - 10;

    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', cx);
    lbl.setAttribute('y', cy);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('fill', 'rgba(255,255,255,0.28)');
    lbl.setAttribute('font-size', '9');
    lbl.setAttribute('font-weight', '600');
    lbl.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
    lbl.setAttribute('letter-spacing', '1');
    lbl.setAttribute('pointer-events', 'none');
    lbl.classList.add('colony-section-label');
    lbl.textContent = colonyName.replace(' Colony', '');
    svg.appendChild(lbl);
  });

  // Wire clicks
  svg.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });

  // Hover highlight — lighten stroke on polygon under cursor
  svg.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const poly = el.previousElementSibling?.previousElementSibling;
      if (poly && poly.tagName === 'polygon') poly.setAttribute('fill', '#1a1a1a');
    });
    el.addEventListener('mouseleave', () => {
      const poly = el.previousElementSibling?.previousElementSibling;
      const p = _people.find(x => String(x.id) === el.dataset.personId);
      if (poly && poly.tagName === 'polygon') {
        poly.setAttribute('fill', p?.is_current_user ? '#111' : '#000');
      }
    });
  });

  // Restore zoom labels visibility after redraw
  updateLabelVisibility(_currentScale);
}

let _currentScale = 1;

function updateLabelVisibility(scale) {
  _currentScale = scale;
  const svg = document.getElementById('hiveSvg');
  if (!svg) return;
  const showNames    = scale > 0.55;
  const showClusters = scale > 0.28;
  svg.querySelectorAll('.hex-label-name, .hex-label-role').forEach(el => {
    el.style.opacity = showNames ? '1' : '0';
  });
  svg.querySelectorAll('.colony-section-label').forEach(el => {
    el.style.opacity = showClusters ? '1' : '0';
  });
}

function wireZoom() {
  const viewport = document.getElementById('hiveViewport');
  const svg      = document.getElementById('hiveSvg');
  if (!viewport || !svg) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, didDrag = false, sx = 0, sy = 0, stx = 0, sty = 0;

  function applyTransform() {
    svg.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
    svg.style.transformOrigin = '0 0';
    updateLabelVisibility(scale);
  }

  function fit() {
    const vw = viewport.clientWidth || 800;
    const vh = viewport.clientHeight || 600;
    const sw = parseFloat(svg.getAttribute('width') || vw);
    const sh = parseFloat(svg.getAttribute('height') || vh);
    scale = Math.min(vw / sw, vh / sh) * 0.92;
    tx = (vw - sw * scale) / 2;
    ty = (vh - sh * scale) / 2;
    applyTransform();
  }

  requestAnimationFrame(() => requestAnimationFrame(fit));

  const zoom = (factor, cx, cy) => {
    cx = cx ?? viewport.clientWidth / 2;
    cy = cy ?? viewport.clientHeight / 2;
    const ns = Math.min(Math.max(scale * factor, 0.06), 6);
    tx = cx - (cx - tx) * (ns / scale);
    ty = cy - (cy - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  };

  document.getElementById('hiveZoomIn')?.addEventListener('click', () => zoom(1.35));
  document.getElementById('hiveZoomOut')?.addEventListener('click', () => zoom(1 / 1.35));
  document.getElementById('hiveZoomReset')?.addEventListener('click', fit);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  viewport.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    dragging = true; didDrag = false;
    sx = e.clientX; sy = e.clientY; stx = tx; sty = ty;
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
}
