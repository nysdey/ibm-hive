/**
 * org.js — Organization: a huge virtual hexagon hive of ~270,000 bees.
 *
 * Architecture:
 *  • Background: <canvas> with HEX_R=3 cells → ~4700×2700px canvas (48 MB) — fast
 *  • Overlay: <svg> with real person hexes at same HEX_R=3 coordinate system
 *  • Both layers get the same CSS transform (translate + scale) for pan/zoom
 *
 * At the default zoom-out (scale≈0.12) the hive looks like a small dense grid.
 * Zoom in to see person cells clearly; names appear at scale>5.
 * Colony section labels (huge SVG text) only appear when zoomed way out.
 */
import { getPeople } from '../api.js';

const COLONY_ORDER = [
  'Data & AI Colony',
  'Automation Colony',
  'Sustainability Colony',
  'Security Colony',
  'Infrastructure Colony',
  'Hybrid Cloud Colony',
];

const COLONY_INFO = {
  'Data & AI Colony': {
    label: 'Data & AI',
    color: '#0f62fe',
    desc: 'watsonx, data platforms, analytics, and AI governance. The largest colony — driving AI adoption across enterprise accounts.',
    headcount: '~47,000',
    products: ['watsonx.ai', 'watsonx.data', 'watsonx.governance', 'IBM Db2', 'IBM Cognos'],
  },
  'Automation Colony': {
    label: 'Automation',
    color: '#6c63ff',
    desc: 'Business automation, workflow intelligence, and RPA. Reduces operational overhead and accelerates decision-making.',
    headcount: '~38,000',
    products: ['IBM Business Automation Workflow', 'IBM RPA', 'IBM Datacap', 'IBM FileNet'],
  },
  'Sustainability Colony': {
    label: 'Sustainability',
    color: '#24a148',
    desc: 'Environmental intelligence and sustainability reporting. Enables organizations to measure, manage, and improve their environmental footprint.',
    headcount: '~29,000',
    products: ['IBM Envizi', 'IBM TRIRIGA', 'IBM Maximo'],
  },
  'Security Colony': {
    label: 'Security',
    color: '#da1e28',
    desc: 'Threat intelligence, SOC operations, identity, and data security. Protects the world\'s critical infrastructure and enterprise data.',
    headcount: '~44,000',
    products: ['IBM QRadar', 'IBM Guardium', 'IBM Verify', 'IBM Security X-Force'],
  },
  'Infrastructure Colony': {
    label: 'Infrastructure',
    color: '#a855f7',
    desc: 'IBM Power, Storage, and z Systems. Sells IBM PowerVS, IBM FlashSystems, and IBM Fusion to all US enterprise accounts.',
    headcount: '~61,000',
    products: ['IBM PowerVS', 'IBM FlashSystem', 'IBM Fusion', 'IBM z16', 'IBM LinuxONE'],
  },
  'Hybrid Cloud Colony': {
    label: 'Hybrid Cloud',
    color: '#ee5396',
    desc: 'Red Hat OpenShift, IBM Cloud, and hybrid multi-cloud strategy. Bridges on-premises and cloud-native workloads.',
    headcount: '~51,000',
    products: ['Red Hat OpenShift', 'IBM Cloud', 'IBM Cloud Paks', 'Red Hat Ansible'],
  },
};

const COLONY_MAP = {
  'data-ai':        'Data & AI Colony',
  'automation':     'Automation Colony',
  'sustainability': 'Sustainability Colony',
  'security':       'Security Colony',
  'infrastructure': 'Infrastructure Colony',
  'hybrid-cloud':   'Hybrid Cloud Colony',
};

const MARKET_MAP = {
  enterprise: 'Enterprise', strategic: 'Strategic',
  horizon:    'Horizon',    territory: 'Territory',
};

const ROLE_ORDER = {
  exec:0, director:1, manager:2, bss:3, bts:4, csm:5, sdr:6, partner:7, intern:8, other:9,
};

// ── Hex geometry (single coordinate system for canvas + SVG) ─────
// HEX_R=3 → ~4700×2700 canvas, browser-safe
const HEX_R = 3;
const HEX_W = Math.sqrt(3) * HEX_R;
const ROW_H = HEX_R * 1.5;

// Virtual hive size — hexRegion(300) = 270,901 cells ≈ "270,000 bees"
const VIRTUAL_N = 300;

function axialToPixel(q, r) {
  return { x: HEX_W * (q + r / 2), y: ROW_H * r };
}

function hexPath(ctx, cx, cy, r) {
  // pointy-top (matches svgHexPoints)
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function svgHexPoints(cx, cy, r) {
  // pointy-top
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 180 * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

function cellColony(q, r) {
  if (q === 0 && r === 0) return COLONY_ORDER[0];
  const { x, y } = axialToPixel(q, r);
  let angle = Math.atan2(y, x);
  if (angle < 0) angle += Math.PI * 2;
  return COLONY_ORDER[Math.floor((angle / (Math.PI * 2)) * 6) % 6];
}

// Subtle colony tints for background canvas
const COLONY_TINTS = {
  'Data & AI Colony':      '#050c14',
  'Automation Colony':     '#07070f',
  'Sustainability Colony': '#050c07',
  'Security Colony':       '#0d0505',
  'Infrastructure Colony': '#09051a',
  'Hybrid Cloud Colony':   '#0d0509',
};

let _people       = [];
let _activeFilter = null;
let _scale        = 1;
let _canvasW      = 0;
let _canvasH      = 0;
let _OX           = 0;
let _OY           = 0;

// Map "q,r" → {cx, cy} (canvas pixel centers)
const _cellPx = new Map();

export async function renderOrg(container) {
  container.innerHTML = `
    <div class="org-hive-page">
      <div class="org-hive-toolbar">
        <div class="org-hive-toolbar-left">
          <span class="org-hive-title">Organization</span>
          <span class="org-hive-subtitle" id="orgSubtitle">270,000 bees · 6 colonies</span>
        </div>
        <div class="org-hive-controls">
          <button class="colony-zoom-btn" id="orgZoomIn"    title="Zoom in">+</button>
          <button class="colony-zoom-btn" id="orgZoomOut"   title="Zoom out">−</button>
          <button class="colony-zoom-btn" id="orgZoomReset" title="Fit" style="font-size:11px">Fit</button>
        </div>
      </div>
      <div class="colony-viewport" id="orgViewport"
           style="position:relative;cursor:grab;overflow:hidden;flex:1;min-height:0">
        <canvas id="orgCanvas"
                style="position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;image-rendering:pixelated"></canvas>
        <svg id="orgSvg" xmlns="http://www.w3.org/2000/svg"
             style="position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;overflow:visible"></svg>
      </div>
    </div>
    <div class="org-modal-overlay" id="orgModalOverlay">
      <div class="org-modal">
        <div class="org-modal-header">
          <div class="org-modal-title" id="orgModalTitle"></div>
          <div class="org-modal-close" id="orgModalClose">✕</div>
        </div>
        <div class="org-modal-body" id="orgModalBody"></div>
      </div>
    </div>
  `;

  _people = await getPeople();

  // ── Sort people: colony → role ────────────────────────────────
  const byColony = {};
  COLONY_ORDER.forEach(c => { byColony[c] = []; });
  _people.forEach(p => {
    const c = p.comb || COLONY_ORDER[0];
    if (!byColony[c]) byColony[c] = [];
    byColony[c].push(p);
  });
  COLONY_ORDER.forEach(c => {
    byColony[c].sort((a, b) => (ROLE_ORDER[a.role_type] ?? 9) - (ROLE_ORDER[b.role_type] ?? 9));
  });
  const realPeople = COLONY_ORDER.flatMap(c => byColony[c] || []);

  // ── Canvas dimensions ─────────────────────────────────────────
  const edgeX = Math.abs(axialToPixel(VIRTUAL_N, 0).x)        + HEX_R + 4;
  const edgeY = Math.abs(axialToPixel(0, -VIRTUAL_N).y)       + HEX_R + 4;
  _canvasW = Math.ceil(edgeX * 2 + 8);
  _canvasH = Math.ceil(edgeY * 2 + 8);
  _OX = _canvasW / 2;
  _OY = _canvasH / 2;

  // ── Assign real people to center hex cells ────────────────────
  // Grow smallN until there are enough center cells for all people
  let smallN = 1;
  let cnt = 7; // hexRegion(1) = 7
  while (cnt < realPeople.length) { smallN++; cnt = 3 * smallN * (smallN + 1) + 1; }

  const smallCells = [];
  for (let q = -smallN; q <= smallN; q++) {
    const r1 = Math.max(-smallN, -q - smallN);
    const r2 = Math.min(smallN,  -q + smallN);
    for (let r = r1; r <= r2; r++) smallCells.push({ q, r });
  }
  smallCells.sort((a, b) => {
    const ra = Math.max(Math.abs(a.q), Math.abs(a.r), Math.abs(a.q + a.r));
    const rb = Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r));
    if (ra !== rb) return ra - rb;
    const pa = axialToPixel(a.q, a.r);
    const pb = axialToPixel(b.q, b.r);
    return Math.atan2(pa.y, pa.x) - Math.atan2(pb.y, pb.x);
  });

  const personByKey = new Map(); // "q,r" → person
  smallCells.slice(0, realPeople.length).forEach((c, i) => {
    personByKey.set(`${c.q},${c.r}`, realPeople[i]);
  });

  // ── Draw canvas background ────────────────────────────────────
  const canvas = document.getElementById('orgCanvas');
  canvas.width  = _canvasW;
  canvas.height = _canvasH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, _canvasW, _canvasH);

  // Pre-compute all pixel centers and sort by colony for batched draw
  const colonyBatches = {};
  COLONY_ORDER.forEach(c => { colonyBatches[c] = []; });

  for (let q = -VIRTUAL_N; q <= VIRTUAL_N; q++) {
    const r1 = Math.max(-VIRTUAL_N, -q - VIRTUAL_N);
    const r2 = Math.min(VIRTUAL_N,  -q + VIRTUAL_N);
    for (let r = r1; r <= r2; r++) {
      const { x, y } = axialToPixel(q, r);
      const cx = x + _OX;
      const cy = y + _OY;
      _cellPx.set(`${q},${r}`, { cx, cy });
      const c = personByKey.has(`${q},${r}`)
        ? (personByKey.get(`${q},${r}`).comb || COLONY_ORDER[0])
        : cellColony(q, r);
      colonyBatches[c].push({ cx, cy });
    }
  }

  // Batch-draw each colony: one fill pass + one stroke pass per colony
  COLONY_ORDER.forEach(colony => {
    const cells = colonyBatches[colony];
    ctx.beginPath();
    cells.forEach(({ cx, cy }) => hexPath(ctx, cx, cy, HEX_R - 0.3));
    ctx.fillStyle = COLONY_TINTS[colony] || '#0a0a0a';
    ctx.fill();

    ctx.beginPath();
    cells.forEach(({ cx, cy }) => hexPath(ctx, cx, cy, HEX_R - 0.3));
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
  });

  // ── SVG overlay — person cells + labels ───────────────────────
  const svg = document.getElementById('orgSvg');
  svg.setAttribute('width',   _canvasW);
  svg.setAttribute('height',  _canvasH);
  svg.setAttribute('viewBox', `0 0 ${_canvasW} ${_canvasH}`);

  personByKey.forEach((person, key) => {
    const { cx, cy } = _cellPx.get(key);
    const isMe = person.is_current_user;

    // Highlighted person cell
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', svgHexPoints(cx, cy, HEX_R - 0.2));
    poly.setAttribute('fill', isMe ? '#1a2e5e' : '#1e1e2e');
    poly.setAttribute('stroke', isMe ? 'rgba(77,123,255,0.9)' : 'rgba(255,255,255,0.6)');
    poly.setAttribute('stroke-width', isMe ? '0.6' : '0.4');
    poly.setAttribute('data-person-id', person.id);
    poly.style.cursor = 'pointer';
    svg.appendChild(poly);

    if (isMe) {
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      ring.setAttribute('points', svgHexPoints(cx, cy, HEX_R - 1.2));
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', 'rgba(77,123,255,0.4)');
      ring.setAttribute('stroke-width', '0.3');
      ring.style.pointerEvents = 'none';
      svg.appendChild(ring);
    }

    poly.addEventListener('click', e => {
      e.stopPropagation();
      openPersonModal(person);
    });

    // Name label (shown only at high zoom via CSS class opacity)
    const nameEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    nameEl.setAttribute('x', cx);
    nameEl.setAttribute('y', cy);
    nameEl.setAttribute('text-anchor', 'middle');
    nameEl.setAttribute('dominant-baseline', 'middle');
    nameEl.setAttribute('fill', 'rgba(255,255,255,0.9)');
    nameEl.setAttribute('font-size', '1.8');
    nameEl.setAttribute('font-weight', '500');
    nameEl.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
    nameEl.setAttribute('pointer-events', 'none');
    nameEl.classList.add('org-hex-name');
    nameEl.textContent = person.first_name + ' ' + person.last_name;
    svg.appendChild(nameEl);
  });

  // ── Colony labels (huge text, shown only when zoomed way out) ─
  // Sample colony centroids from virtual grid
  const colLabels = {};
  COLONY_ORDER.forEach(c => { colLabels[c] = { sx: 0, sy: 0, n: 0 }; });
  for (let q = -VIRTUAL_N; q <= VIRTUAL_N; q += 8) {
    const r1 = Math.max(-VIRTUAL_N, -q - VIRTUAL_N);
    const r2 = Math.min(VIRTUAL_N,  -q + VIRTUAL_N);
    for (let r = r1; r <= r2; r += 8) {
      const px = _cellPx.get(`${q},${r}`);
      if (!px) continue;
      const c = cellColony(q, r);
      colLabels[c].sx += px.cx;
      colLabels[c].sy += px.cy;
      colLabels[c].n++;
    }
  }

  COLONY_ORDER.forEach(colony => {
    const d = colLabels[colony];
    if (!d.n) return;
    const info = COLONY_INFO[colony] || {};
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('colony-section-label');
    g.style.cursor = 'pointer';

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', d.sx / d.n);
    t.setAttribute('y', d.sy / d.n);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('fill', info.color || 'rgba(255,255,255,0.4)');
    t.setAttribute('font-size', '70');
    t.setAttribute('font-weight', '700');
    t.setAttribute('font-family', 'IBM Plex Sans, system-ui, sans-serif');
    t.setAttribute('letter-spacing', '4');
    t.setAttribute('pointer-events', 'none');
    t.textContent = (info.label || colony.replace(' Colony', '')).toUpperCase();

    g.appendChild(t);
    svg.appendChild(g);
    g.addEventListener('click', () => openColonyModal(colony));
  });

  updateVisibility(_scale);
  wireZoom();
  wireModal();

  document.addEventListener('sidebar:filter', onFilter);
  container._cleanup = () => document.removeEventListener('sidebar:filter', onFilter);
}

// ── Filter ────────────────────────────────────────────────────────
function onFilter(e) {
  _activeFilter = e.detail;
  const svg = document.getElementById('orgSvg');
  if (!svg) return;

  const count = _activeFilter ? _people.filter(p => !isFiltered(p)).length : 270000;
  const sub = document.getElementById('orgSubtitle');
  if (sub) sub.textContent = _activeFilter
    ? `${count.toLocaleString()} matching · 6 colonies`
    : '270,000 bees · 6 colonies';

  svg.querySelectorAll('[data-person-id]').forEach(poly => {
    const pid    = poly.dataset.personId;
    const person = _people.find(p => String(p.id) === pid);
    if (!person) return;
    const dim = isFiltered(person);
    const me  = person.is_current_user;
    poly.setAttribute('fill', dim ? '#080808' : (me ? '#1a2e5e' : '#1e1e2e'));
    poly.setAttribute('stroke', dim ? 'rgba(255,255,255,0.08)' : (me ? 'rgba(77,123,255,0.9)' : 'rgba(255,255,255,0.6)'));
    poly.style.opacity = dim ? '0.25' : '1';
  });
}

function isFiltered(p) {
  if (!_activeFilter) return false;
  const { group, value } = _activeFilter;
  if (group === 'colonies') return p.comb !== COLONY_MAP[value];
  if (group === 'jobs') {
    const m = { bss:'bss',bts:'bts',csm:'csm',manager:'manager',
                director:'director',exec:'exec',partner:'partner',sdr:'sdr',intern:'intern' };
    return p.role_type !== m[value];
  }
  if (group === 'markets') return p.market !== MARKET_MAP[value];
  return false;
}

// ── Label visibility by zoom level ───────────────────────────────
function updateVisibility(scale) {
  _scale = scale;
  const svg = document.getElementById('orgSvg');
  if (!svg) return;

  // Colony labels: visible only when zoomed way out
  const showLabels = scale < 0.09;
  svg.querySelectorAll('.colony-section-label').forEach(el => {
    el.style.opacity = showLabels ? '0.85' : '0';
    el.style.pointerEvents = showLabels ? 'auto' : 'none';
  });

  // Person names: readable at high zoom (scale ≥ 5 → HEX_R*5=15px cells)
  const showNames = scale >= 4.5;
  svg.querySelectorAll('.org-hex-name').forEach(el => {
    el.style.opacity = showNames ? '1' : '0';
  });
}

// ── Modals ────────────────────────────────────────────────────────
function openColonyModal(colony) {
  const info = COLONY_INFO[colony] || {};
  const el   = document.getElementById('orgModalTitle');
  const body = document.getElementById('orgModalBody');
  const ov   = document.getElementById('orgModalOverlay');
  if (!ov) return;

  el.textContent = info.label || colony;
  el.style.color = info.color || '#fff';

  body.innerHTML = `
    <div class="org-modal-meta">
      <span class="org-modal-badge" style="background:${info.color}22;color:${info.color};border-color:${info.color}44">
        ${info.headcount || ''} employees
      </span>
    </div>
    <p class="org-modal-desc">${info.desc || ''}</p>
    ${info.products ? `
      <div class="org-modal-section-title">Key products</div>
      <div class="org-modal-tags">${info.products.map(p => `<span class="org-modal-tag">${p}</span>`).join('')}</div>
    ` : ''}
  `;
  ov.classList.add('open');
}

function openPersonModal(person) {
  const el   = document.getElementById('orgModalTitle');
  const body = document.getElementById('orgModalBody');
  const ov   = document.getElementById('orgModalOverlay');
  if (!ov) return;

  el.textContent = person.first_name + ' ' + person.last_name;
  el.style.color = '#fff';

  const ci = COLONY_INFO[person.comb] || {};

  body.innerHTML = `
    <div class="org-modal-meta">
      <span class="org-modal-badge" style="background:${ci.color||'#333'}22;color:${ci.color||'#aaa'};border-color:${ci.color||'#333'}44">
        ${ci.label || person.comb || '—'}
      </span>
      ${person.is_current_user ? '<span class="org-modal-badge" style="background:rgba(77,123,255,0.12);color:#4d7bff;border-color:rgba(77,123,255,0.2)">You</span>' : ''}
    </div>
    <div class="org-modal-person-grid">
      <div class="org-modal-field"><div class="org-modal-field-label">Role</div><div>${person.role || '—'}</div></div>
      <div class="org-modal-field"><div class="org-modal-field-label">Market</div><div>${person.market || '—'}</div></div>
      <div class="org-modal-field"><div class="org-modal-field-label">Location</div><div>${person.location || '—'}</div></div>
      <div class="org-modal-field"><div class="org-modal-field-label">Email</div><div style="color:#4d7bff">${person.email || '—'}</div></div>
    </div>
  `;
  ov.classList.add('open');
}

function wireModal() {
  const ov  = document.getElementById('orgModalOverlay');
  const btn = document.getElementById('orgModalClose');
  if (!ov) return;
  btn?.addEventListener('click', () => ov.classList.remove('open'));
  ov.addEventListener('click',  e => { if (e.target === ov) ov.classList.remove('open'); });
}

// ── Zoom + pan ────────────────────────────────────────────────────
function wireZoom() {
  const viewport = document.getElementById('orgViewport');
  const canvas   = document.getElementById('orgCanvas');
  const svg      = document.getElementById('orgSvg');
  if (!viewport || !canvas || !svg) return;

  let scale = 1, tx = 0, ty = 0;
  let dragging = false, didDrag = false, sx = 0, sy = 0, stx = 0, sty = 0;

  function applyTransform() {
    const t = `translate(${tx}px,${ty}px) scale(${scale})`;
    canvas.style.transform = t;
    svg.style.transform    = t;
    updateVisibility(scale);
  }

  function fit() {
    const vw = viewport.clientWidth  || 900;
    const vh = viewport.clientHeight || 700;
    // Zoom out so hive occupies ~12% of viewport — looks like a tiny dense speck
    scale = Math.min(vw / _canvasW, vh / _canvasH) * 0.12;
    tx = (vw - _canvasW * scale) / 2;
    ty = (vh - _canvasH * scale) / 2;
    applyTransform();
  }

  requestAnimationFrame(() => requestAnimationFrame(fit));

  const zoom = (factor, cx, cy) => {
    cx = cx ?? viewport.clientWidth  / 2;
    cy = cy ?? viewport.clientHeight / 2;
    const ns = Math.min(Math.max(scale * factor, 0.02), 20);
    tx = cx - (cx - tx) * (ns / scale);
    ty = cy - (cy - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  };

  document.getElementById('orgZoomIn')?.addEventListener('click',    () => zoom(1.5));
  document.getElementById('orgZoomOut')?.addEventListener('click',   () => zoom(1 / 1.5));
  document.getElementById('orgZoomReset')?.addEventListener('click', fit);

  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    const r = viewport.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top);
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
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
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

  // Pinch
  let lastDist = 0;
  viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 2)
      lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: true });
  viewport.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                            e.touches[0].clientY - e.touches[1].clientY);
    const r    = viewport.getBoundingClientRect();
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    zoom(dist / lastDist, midX - r.left, midY - r.top);
    lastDist = dist;
  }, { passive: false });
}
