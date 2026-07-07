/**
 * org.js — IBM Hive: zoomable organizational map
 *
 * Hierarchy (correct):
 *   IBM Hive
 *   └── Market (Colony)         — Enterprise / Strategic / Horizon / Territory
 *       └── Organization (Comb) — Infrastructure / Data & AI / Security …
 *           └── Team (Cell)     — manager-led group
 *               └── Person (Bee)
 *
 * Behaviour — Google Maps metaphor:
 *   Zoom out  → see Markets
 *   Zoom in   → see Organizations within a Market
 *   Zoom more → see Teams within an Org
 *   Zoom full → see People within a Team
 *
 *   Click any node → expand it / select it / show detail panel
 *   Breadcrumb always shows current position
 *   "You are here" node always highlighted
 */
import { getPeople } from '../api.js';

// ── Org metadata (comb → org name, products) ─────────────────────
const ORG_META = {
  'Infrastructure Colony':  { name: 'Infrastructure',  products: ['IBM PowerVS', 'IBM FlashSystem', 'IBM Fusion', 'IBM z16', 'IBM LinuxONE'] },
  'Data & AI Colony':       { name: 'Data & AI',       products: ['watsonx.ai', 'watsonx.data', 'IBM Db2', 'IBM Cognos'] },
  'Automation Colony':      { name: 'Automation',      products: ['IBM BAW', 'IBM RPA', 'IBM FileNet'] },
  'Security Colony':        { name: 'Security',        products: ['IBM QRadar', 'IBM Guardium', 'IBM Verify'] },
  'Sustainability Colony':  { name: 'Sustainability',  products: ['IBM Envizi', 'IBM TRIRIGA', 'IBM Maximo'] },
  'Hybrid Cloud Colony':    { name: 'Hybrid Cloud',    products: ['Red Hat OpenShift', 'IBM Cloud', 'IBM Cloud Paks'] },
};

const ROLE_LABEL = {
  exec:'VP / Executive', director:'Director', manager:'Manager',
  bss:'Brand Sales Spec.', bts:'Brand Tech. Sales', csm:'Customer Success',
  sdr:'SDR', partner:'Partner', intern:'Intern', other:'—',
};

// Market color palette
const MKT_COLOR = {
  'Enterprise': '#4589ff',
  'Strategic':  '#a855f7',
  'Horizon':    '#6c63ff',
  'Territory':  '#d946ef',
};

const ORG_COLOR = {
  'Infrastructure Colony':  '#a855f7',
  'Data & AI Colony':       '#4589ff',
  'Automation Colony':      '#6c63ff',
  'Security Colony':        '#ef4444',
  'Sustainability Colony':  '#22c55e',
  'Hybrid Cloud Colony':    '#ec4899',
};

// ── View state ────────────────────────────────────────────────────
let _all      = [];
let _me       = null;
let _sel      = null;   // selected node { type:'market'|'org'|'team'|'person', id }
let _expanded = new Set(); // expanded node keys (e.g. "market:Horizon", "org:Infrastructure Colony")
let _zoom     = 1;
let _tx = 0, _ty = 0;
let _svgW = 0, _svgH = 0;
let _container = null;

// ── Entry ─────────────────────────────────────────────────────────
export async function renderOrg(container) {
  _container = container;
  container.innerHTML = `
    <div class="hmap-shell">
      <div class="hmap-topbar">
        <div class="hmap-breadcrumb" id="hmapBreadcrumb"></div>
        <div class="hmap-you-here" id="hmapYouHere"></div>
        <div class="hmap-zoom-btns">
          <button class="hmap-zbtn" id="hmapZoomIn" title="Zoom in">+</button>
          <button class="hmap-zbtn" id="hmapZoomOut" title="Zoom out">−</button>
          <button class="hmap-zbtn hmap-zbtn-fit" id="hmapFit" title="Fit to screen">Fit</button>
        </div>
      </div>
      <div class="hmap-stage" id="hmapStage">
        <svg id="hmapSvg" class="hmap-svg"></svg>
      </div>
      <div class="hmap-detail" id="hmapDetail" style="display:none">
        <button class="hmap-detail-close" id="hmapDetailClose">✕</button>
        <div id="hmapDetailBody"></div>
      </div>
    </div>
  `;

  _all = await getPeople();
  _me  = _all.find(p => p.is_current_user) || _all[0];

  // Auto-expand me's market and org
  if (_me) {
    _expanded.add(`market:${_me.market}`);
    _expanded.add(`org:${_me.comb}`);
    // auto-expand my team (find manager)
    const teamKey = teamId(_me);
    if (teamKey) _expanded.add(`team:${teamKey}`);
  }

  wireZoom();
  wireDetailClose();
  buildMap();
  updateBreadcrumb();
  updateYouHere();
}

// ── Team key: "managerName" used as team identifier ───────────────
function teamId(person) {
  // A "team" is all people sharing the same manager within the same org
  // Key = manager_id + comb
  if (!person?.manager_id) return null;
  return `${person.manager_id}:${person.comb}`;
}

function teamLabel(mgrId, comb) {
  const mgr = _all.find(p => p.id === mgrId);
  if (!mgr) return 'Team';
  const orgName = ORG_META[comb]?.name || comb.replace(' Colony','');
  return `${mgr.first_name} ${mgr.last_name}'s team`;
}

// ── Build and render the full SVG map ─────────────────────────────
function buildMap() {
  const svg = document.getElementById('hmapSvg');
  const stage = document.getElementById('hmapStage');
  if (!svg || !stage) return;

  // --- Layout constants ---
  const MARKET_R  = 64;   // market bubble radius
  const ORG_R     = 44;   // org node radius
  const TEAM_R    = 34;   // team node radius
  const PERSON_R  = 26;   // person node radius
  const PAD       = 40;

  // --- Group people by market → org → team ---
  const markets = [...new Set(_all.map(p => p.market).filter(Boolean))];
  const byMarket = {};
  markets.forEach(m => { byMarket[m] = _all.filter(p => p.market === m); });

  // --- Position markets in a horizontal row, centered ---
  const MARKET_STEP = 260;
  const totalW = markets.length * MARKET_STEP;

  // Node positions stored for line drawing
  const positions = {}; // key → {x,y}

  let nodes = ''; // SVG markup accumulator
  let lines = ''; // connection lines (drawn under nodes)

  const marketY = 120;

  markets.forEach((mkt, mi) => {
    const mx = PAD + mi * MARKET_STEP + MARKET_STEP / 2;
    const my = marketY;
    const mkey = `market:${mkt}`;
    const color = MKT_COLOR[mkt] || '#525252';
    const isMyMkt = _me?.market === mkt;
    const isExpanded = _expanded.has(mkey);
    const isSel = _sel?.type === 'market' && _sel.id === mkt;

    positions[mkey] = { x: mx, y: my };

    // Market bubble
    nodes += marketNode(mx, my, MARKET_R, mkt, color, isMyMkt, isSel, isExpanded,
      byMarket[mkt].length);

    if (!isExpanded) return;

    // --- Orgs within this market ---
    const orgs = [...new Set(byMarket[mkt].map(p => p.comb).filter(Boolean))];
    const orgStep = Math.max(180, MARKET_STEP / Math.max(orgs.length, 1));
    const orgY = my + MARKET_R + 100;
    const orgStartX = mx - ((orgs.length - 1) * orgStep) / 2;

    orgs.forEach((org, oi) => {
      const ox = orgStartX + oi * orgStep;
      const oy = orgY;
      const okey = `org:${org}`;
      const ocolor = ORG_COLOR[org] || '#525252';
      const inOrg = byMarket[mkt].filter(p => p.comb === org);
      const isMyOrg = _me?.comb === org;
      const isOrgExp = _expanded.has(okey);
      const isOrgSel = _sel?.type === 'org' && _sel.id === org;

      positions[okey] = { x: ox, y: oy };

      // Line: market → org
      lines += connLine(mx, my + MARKET_R, ox, oy - ORG_R, color, 0.4);

      nodes += orgNode(ox, oy, ORG_R, org, ocolor, isMyOrg, isOrgSel, isOrgExp, inOrg.length);

      if (!isOrgExp) return;

      // --- Teams within this org ---
      // A team = all people sharing the same manager_id within this org
      const teamMap = {};
      inOrg.forEach(p => {
        const tid = teamId(p);
        if (!teamMap[tid]) teamMap[tid] = [];
        teamMap[tid].push(p);
      });
      // Also include managers themselves in "their own" team display
      const teamKeys = Object.keys(teamMap).filter(k => k !== 'null:' + org);

      const teamStep = Math.max(160, orgStep);
      const teamY = oy + ORG_R + 90;
      const teamStartX = ox - ((teamKeys.length - 1) * teamStep) / 2;

      teamKeys.forEach((tk, ti) => {
        const [mgrId, tcomb] = tk.split(':');
        if (tcomb !== org) return;
        const tx_ = teamStartX + ti * teamStep;
        const ty_ = teamY;
        const tkey = `team:${tk}`;
        const members = teamMap[tk] || [];
        const mgr = _all.find(p => p.id === parseInt(mgrId));
        const label = mgr ? `${mgr.first_name} ${mgr.last_name}` : 'Team';
        const isMyTeam = _me && teamId(_me) === tk;
        const isTeamExp = _expanded.has(tkey);
        const isTeamSel = _sel?.type === 'team' && _sel.id === tk;

        positions[tkey] = { x: tx_, y: ty_ };

        // Line: org → team
        lines += connLine(ox, oy + ORG_R, tx_, ty_ - TEAM_R, ocolor, 0.35);

        nodes += teamNode(tx_, ty_, TEAM_R, tk, label, ocolor, isMyTeam, isTeamSel, isTeamExp, members.length);

        if (!isTeamExp) return;

        // --- People within this team ---
        const allTeamMembers = [...members];
        // Include the manager too if not already in members
        if (mgr && !allTeamMembers.find(p => p.id === mgr.id)) {
          allTeamMembers.unshift(mgr);
        }

        const personStep = Math.max(70, teamStep / Math.max(allTeamMembers.length, 1));
        const personY = ty_ + TEAM_R + 80;
        const personStartX = tx_ - ((allTeamMembers.length - 1) * personStep) / 2;

        allTeamMembers.forEach((person, pi) => {
          const px_ = personStartX + pi * personStep;
          const py_ = personY;
          const pkey = `person:${person.id}`;
          const isMe_ = person.is_current_user;
          const pSel  = _sel?.type === 'person' && _sel.id === person.id;

          positions[pkey] = { x: px_, y: py_ };

          // Line: team → person
          lines += connLine(tx_, ty_ + TEAM_R, px_, py_ - PERSON_R, ocolor, 0.25);

          nodes += personNode(px_, py_, PERSON_R, person, isMe_, pSel);
        });
      });
    });
  });

  // Calculate total SVG dimensions from positions
  let maxX = 800, maxY = 600;
  Object.values(positions).forEach(({ x, y }) => {
    if (x + 120 > maxX) maxX = x + 120;
    if (y + 120 > maxY) maxY = y + 120;
  });
  _svgW = maxX + PAD;
  _svgH = maxY + PAD;

  svg.setAttribute('width',   _svgW);
  svg.setAttribute('height',  _svgH);
  svg.setAttribute('viewBox', `0 0 ${_svgW} ${_svgH}`);
  svg.innerHTML = `<g id="hmapLines">${lines}</g><g id="hmapNodes">${nodes}</g>`;

  // Wire all node clicks
  svg.querySelectorAll('[data-node-key]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleNodeClick(el.dataset.nodeKey, el.dataset.nodeType, el.dataset.nodeId);
    });
  });

  applyTransform();
}

// ── Node click handler ────────────────────────────────────────────
function handleNodeClick(key, type, id) {
  const wasExpanded = _expanded.has(key);

  // Toggle expand
  if (['market','org','team'].includes(type)) {
    if (wasExpanded) _expanded.delete(key);
    else _expanded.add(key);
  }

  // Set selection
  _sel = { type, id: type === 'person' ? parseInt(id) : id };

  buildMap();
  showDetail(type, id);
  updateBreadcrumb();
}

// ── SVG node generators ───────────────────────────────────────────

function marketNode(cx, cy, r, label, color, isMine, isSel, isExp, count) {
  const key  = `market:${label}`;
  const ring = isMine ? `<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5" pointer-events="none"/>` : '';
  const selRing = isSel ? `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9" pointer-events="none"/>` : '';
  const chevron = isExp ? '▾' : '▸';

  return `
    <g data-node-key="${key}" data-node-type="market" data-node-id="${label}">
      ${ring}${selRing}
      <circle cx="${cx}" cy="${cy}" r="${r}"
        fill="${isMine ? color + '2a' : '#1a1a1a'}"
        stroke="${color}"
        stroke-width="${isSel ? 2.5 : 1.5}"
      />
      <text x="${cx}" y="${cy - 10}" text-anchor="middle" dominant-baseline="middle"
        fill="${color}" font-size="13" font-weight="600"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${label}</text>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="middle"
        fill="${color}99" font-size="11"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">Colony</text>
      <text x="${cx}" y="${cy + 24}" text-anchor="middle" dominant-baseline="middle"
        fill="${color}66" font-size="10"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${count} people  ${chevron}</text>
      ${isMine ? `<text x="${cx}" y="${cy - r - 12}" text-anchor="middle"
        fill="${color}" font-size="10" font-weight="600"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">YOUR COLONY</text>` : ''}
    </g>`;
}

function orgNode(cx, cy, r, comb, color, isMine, isSel, isExp, count) {
  const key   = `org:${comb}`;
  const label = ORG_META[comb]?.name || comb.replace(' Colony','');
  const selRing = isSel ? `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9" pointer-events="none"/>` : '';
  const chevron = isExp ? '▾' : '▸';

  return `
    <g data-node-key="${key}" data-node-type="org" data-node-id="${comb}">
      ${selRing}
      <circle cx="${cx}" cy="${cy}" r="${r}"
        fill="${isMine ? color + '28' : '#202020'}"
        stroke="${color}"
        stroke-width="${isSel ? 2.5 : 1.2}"
      />
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" dominant-baseline="middle"
        fill="${isMine ? color : '#e0e0e0'}" font-size="11" font-weight="600"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${label}</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" dominant-baseline="middle"
        fill="#666" font-size="9"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${count}  ${chevron}</text>
    </g>`;
}

function teamNode(cx, cy, r, tk, label, color, isMine, isSel, isExp, count) {
  const key = `team:${tk}`;
  const selRing = isSel ? `<rect x="${cx - r - 5}" y="${cy - r - 5}" width="${(r + 5) * 2}" height="${(r + 5) * 2}" rx="${r + 2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9" pointer-events="none"/>` : '';
  const chevron = isExp ? '▾' : '▸';
  // Team node is a rounded rect
  const w = r * 2 + 20, h = r * 2;
  const rx2 = 6;
  return `
    <g data-node-key="${key}" data-node-type="team" data-node-id="${tk}">
      ${selRing}
      <rect x="${cx - w/2}" y="${cy - h/2}" width="${w}" height="${h}" rx="${rx2}"
        fill="${isMine ? color + '22' : '#1e1e1e'}"
        stroke="${color}"
        stroke-width="${isSel ? 2.2 : 1}"
      />
      <text x="${cx}" y="${cy - 5}" text-anchor="middle" dominant-baseline="middle"
        fill="${isMine ? '#fff' : '#d4d4d4'}" font-size="9.5" font-weight="500"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${label}</text>
      <text x="${cx}" y="${cy + 8}" text-anchor="middle" dominant-baseline="middle"
        fill="#555" font-size="9"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${count} members  ${chevron}</text>
    </g>`;
}

function personNode(cx, cy, r, person, isMe, isSel) {
  const key   = `person:${person.id}`;
  const fname = person.first_name;
  const lname = person.last_name;
  const color = isMe ? '#4589ff' : '#525252';
  const fill  = isMe ? '#0d1f4c' : '#1c1c1c';
  const selRing = isSel ? `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" stroke="${color}" stroke-width="2" opacity="0.9" pointer-events="none"/>` : '';
  const youLabel = isMe ? `<text x="${cx}" y="${cy - r - 10}" text-anchor="middle"
    fill="#4589ff" font-size="9" font-weight="600"
    font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">YOU</text>` : '';

  // Pointy-top hexagon for people
  const pts = hexPts(cx, cy, r);

  return `
    <g data-node-key="${key}" data-node-type="person" data-node-id="${person.id}">
      ${selRing}${youLabel}
      <polygon points="${pts}"
        fill="${fill}" stroke="${color}"
        stroke-width="${isMe ? 1.8 : 1}"
      />
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" dominant-baseline="middle"
        fill="${isMe ? '#a0c4ff' : '#d4d4d4'}" font-size="8" font-weight="500"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${fname}</text>
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" dominant-baseline="middle"
        fill="${isMe ? '#7aabff' : '#888'}" font-size="7.5"
        font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${lname}</text>
    </g>`;
}

function connLine(x1, y1, x2, y2, color, opacity = 0.3) {
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
    stroke="${color}" stroke-width="1" opacity="${opacity}" pointer-events="none"/>`;
}

function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 3 * i - Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

// ── Breadcrumb ────────────────────────────────────────────────────
function updateBreadcrumb() {
  const el = document.getElementById('hmapBreadcrumb');
  if (!el || !_me) return;

  const orgName  = ORG_META[_me.comb]?.name || _me.comb?.replace(' Colony','') || '—';
  const teamKey_ = teamId(_me);
  const mgr      = _me.manager_id ? _all.find(p => p.id === _me.manager_id) : null;
  const teamLbl  = mgr ? `${mgr.first_name} ${mgr.last_name}'s team` : 'Team';

  const crumbs = [
    { label: 'IBM Hive', key: null, type: null },
    { label: _me.market + ' Colony', key: `market:${_me.market}`, type: 'market', id: _me.market },
    { label: orgName + ' Org',       key: `org:${_me.comb}`,       type: 'org',    id: _me.comb },
    { label: teamLbl,                key: `team:${teamKey_}`,       type: 'team',   id: teamKey_ },
    { label: _me.first_name + ' ' + _me.last_name, key: null, type: null, isYou: true },
  ];

  el.innerHTML = crumbs.map((c, i) => {
    const sep  = i > 0 ? `<span class="bc-sep">›</span>` : '';
    const cls  = c.isYou ? 'bc-you' : (c.key ? 'bc-link' : 'bc-root');
    const attr = c.key ? `data-bc-key="${c.key}" data-bc-type="${c.type}" data-bc-id="${c.id}"` : '';
    return `${sep}<span class="${cls}" ${attr}>${c.label}</span>`;
  }).join('');

  el.querySelectorAll('[data-bc-key]').forEach(seg => {
    seg.addEventListener('click', () => {
      const k = seg.dataset.bcKey;
      const t = seg.dataset.bcType;
      const id = seg.dataset.bcId;
      // Expand target, collapse everything below
      _expanded.add(k);
      _sel = { type: t, id: t === 'person' ? parseInt(id) : id };
      buildMap();
      updateBreadcrumb();
    });
  });
}

// ── You Are Here banner ───────────────────────────────────────────
function updateYouHere() {
  const el = document.getElementById('hmapYouHere');
  if (!el || !_me) return;
  const mgr = _me.manager_id ? _all.find(p => p.id === _me.manager_id) : null;
  el.innerHTML = `
    <span class="yah-dot"></span>
    <span class="yah-text">
      <strong>${_me.first_name} ${_me.last_name}</strong>
      · ${_me.role || ROLE_LABEL[_me.role_type] || '—'}
      · ${_me.market} Colony
      ${mgr ? `· Reports to ${mgr.first_name} ${mgr.last_name}` : ''}
    </span>
  `;
}

// ── Detail panel ──────────────────────────────────────────────────
function showDetail(type, id) {
  const panel = document.getElementById('hmapDetail');
  const body  = document.getElementById('hmapDetailBody');
  if (!panel || !body) return;

  let html = '';

  if (type === 'person') {
    const p = _all.find(x => x.id === parseInt(id));
    if (!p) return;
    const mgr = _all.find(x => x.id === p.manager_id);
    const teamMembers = _all.filter(x => x.manager_id === p.manager_id && x.id !== p.id && x.comb === p.comb);
    const reports = _all.filter(x => x.manager_id === p.id);
    const orgMeta = ORG_META[p.comb] || {};
    const isMe = p.is_current_user;

    html = `
      <div class="hdp-header">
        <div class="hdp-hex" style="background:${isMe ? '#0d1f4c' : '#1c1c1c'};border-color:${isMe ? '#4589ff' : '#525252'}"></div>
        <div>
          <div class="hdp-name">${p.first_name} ${p.last_name}${isMe ? ' <span class="you-tag">You</span>' : ''}</div>
          <div class="hdp-role">${p.role || ROLE_LABEL[p.role_type] || '—'}</div>
        </div>
      </div>
      <div class="hdp-sections">
        <div class="hdp-section">
          <div class="hdp-label">Colony (Market)</div>
          <div class="hdp-val" style="color:${MKT_COLOR[p.market]||'#aaa'}">${p.market} Colony</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Organization</div>
          <div class="hdp-val">${ORG_META[p.comb]?.name || p.comb || '—'}</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Manager</div>
          <div class="hdp-val">${mgr ? `<a href="#" class="hdp-link" data-person-id="${mgr.id}">${mgr.first_name} ${mgr.last_name}</a>` : '— (top of chain)'}</div>
        </div>
        ${reports.length ? `<div class="hdp-section">
          <div class="hdp-label">Direct reports</div>
          <div class="hdp-val">${reports.map(r => `<a href="#" class="hdp-link" data-person-id="${r.id}">${r.first_name} ${r.last_name}</a>`).join(', ')}</div>
        </div>` : ''}
        ${teamMembers.length ? `<div class="hdp-section">
          <div class="hdp-label">On the same team</div>
          <div class="hdp-val">${teamMembers.slice(0,4).map(r => `<a href="#" class="hdp-link" data-person-id="${r.id}">${r.first_name} ${r.last_name}</a>`).join(', ')}${teamMembers.length > 4 ? ` +${teamMembers.length - 4} more` : ''}</div>
        </div>` : ''}
        ${orgMeta.products ? `<div class="hdp-section">
          <div class="hdp-label">Products</div>
          <div class="hdp-tags">${orgMeta.products.map(pr => `<span class="hdp-tag">${pr}</span>`).join('')}</div>
        </div>` : ''}
        <div class="hdp-section">
          <div class="hdp-label">Email</div>
          <div class="hdp-val">${p.email ? `<a href="mailto:${p.email}" class="hdp-link">${p.email}</a>` : '—'}</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Slack</div>
          <div class="hdp-val">${p.slack || '—'}</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Location</div>
          <div class="hdp-val">${p.location || '—'}</div>
        </div>
      </div>`;

  } else if (type === 'market') {
    const mktPeople = _all.filter(p => p.market === id);
    const orgs = [...new Set(mktPeople.map(p => p.comb).filter(Boolean))];
    const color = MKT_COLOR[id] || '#aaa';
    html = `
      <div class="hdp-header">
        <div class="hdp-circle" style="background:${color}22;border-color:${color}"></div>
        <div>
          <div class="hdp-name" style="color:${color}">${id} Colony</div>
          <div class="hdp-role">${mktPeople.length} people across ${orgs.length} organizations</div>
        </div>
      </div>
      <div class="hdp-sections">
        <div class="hdp-section">
          <div class="hdp-label">Organizations</div>
          <div class="hdp-val">${orgs.map(o => ORG_META[o]?.name || o.replace(' Colony','')).join(', ')}</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Headcount</div>
          <div class="hdp-val">${mktPeople.length} people</div>
        </div>
      </div>`;

  } else if (type === 'org') {
    const orgPeople = _all.filter(p => p.comb === id);
    const meta = ORG_META[id] || {};
    const color = ORG_COLOR[id] || '#aaa';
    html = `
      <div class="hdp-header">
        <div class="hdp-circle" style="background:${color}22;border-color:${color}"></div>
        <div>
          <div class="hdp-name" style="color:${color}">${meta.name || id.replace(' Colony','')}</div>
          <div class="hdp-role">Organization · ${orgPeople[0]?.market || ''} Colony</div>
        </div>
      </div>
      <div class="hdp-sections">
        <div class="hdp-section">
          <div class="hdp-label">People</div>
          <div class="hdp-val">${orgPeople.length}</div>
        </div>
        ${meta.products ? `<div class="hdp-section">
          <div class="hdp-label">Products</div>
          <div class="hdp-tags">${meta.products.map(pr => `<span class="hdp-tag">${pr}</span>`).join('')}</div>
        </div>` : ''}
      </div>`;

  } else if (type === 'team') {
    const [mgrIdStr, comb] = id.split(':');
    const mgrId = parseInt(mgrIdStr);
    const mgr = _all.find(p => p.id === mgrId);
    const members = _all.filter(p => p.manager_id === mgrId && p.comb === comb);
    const color = ORG_COLOR[comb] || '#aaa';
    html = `
      <div class="hdp-header">
        <div class="hdp-circle" style="background:${color}22;border-color:${color}"></div>
        <div>
          <div class="hdp-name">${mgr ? mgr.first_name + ' ' + mgr.last_name + "'s team" : 'Team'}</div>
          <div class="hdp-role">Cell · ${ORG_META[comb]?.name || ''} Org</div>
        </div>
      </div>
      <div class="hdp-sections">
        <div class="hdp-section">
          <div class="hdp-label">Manager</div>
          <div class="hdp-val">${mgr ? `<a href="#" class="hdp-link" data-person-id="${mgr.id}">${mgr.first_name} ${mgr.last_name}</a>` : '—'}</div>
        </div>
        <div class="hdp-section">
          <div class="hdp-label">Members (${members.length})</div>
          <div class="hdp-val">${members.map(m => `<a href="#" class="hdp-link" data-person-id="${m.id}">${m.first_name} ${m.last_name}</a>`).join(', ')}</div>
        </div>
      </div>`;
  }

  body.innerHTML = html;
  panel.style.display = 'flex';

  // Wire person links in detail panel
  body.querySelectorAll('[data-person-id]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const pid = parseInt(a.dataset.personId);
      _sel = { type: 'person', id: pid };
      buildMap();
      showDetail('person', pid);
      updateBreadcrumb();
    });
  });
}

function wireDetailClose() {
  document.getElementById('hmapDetailClose')?.addEventListener('click', () => {
    _sel = null;
    document.getElementById('hmapDetail').style.display = 'none';
  });
}

// ── Zoom + pan ────────────────────────────────────────────────────
function applyTransform() {
  const svg = document.getElementById('hmapSvg');
  if (svg) svg.style.transform = `translate(${_tx}px,${_ty}px) scale(${_zoom})`;
}

function fit() {
  const stage = document.getElementById('hmapStage');
  if (!stage || !_svgW || !_svgH) return;
  const sw = stage.clientWidth  || 900;
  const sh = stage.clientHeight || 700;
  _zoom = Math.min(sw / _svgW, sh / _svgH) * 0.90;
  _tx   = (sw - _svgW * _zoom) / 2;
  _ty   = (sh - _svgH * _zoom) / 2;
  applyTransform();
}

function wireZoom() {
  const stage = document.getElementById('hmapStage');
  if (!stage) return;

  requestAnimationFrame(() => requestAnimationFrame(fit));

  document.getElementById('hmapZoomIn')?.addEventListener('click', () => {
    _zoom = Math.min(_zoom * 1.4, 12);
    applyTransform();
  });
  document.getElementById('hmapZoomOut')?.addEventListener('click', () => {
    _zoom = Math.max(_zoom / 1.4, 0.05);
    applyTransform();
  });
  document.getElementById('hmapFit')?.addEventListener('click', fit);

  // Wheel zoom
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const r = stage.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.min(Math.max(_zoom * factor, 0.05), 12);
    _tx = cx - (cx - _tx) * (newZoom / _zoom);
    _ty = cy - (cy - _ty) * (newZoom / _zoom);
    _zoom = newZoom;
    applyTransform();
  }, { passive: false });

  // Pan
  let drag = false, sx = 0, sy = 0, stx = 0, sty = 0, didDrag = false;
  stage.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    drag = true; didDrag = false;
    sx = e.clientX; sy = e.clientY; stx = _tx; sty = _ty;
    stage.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    _tx = stx + dx; _ty = sty + dy;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    drag = false;
    if (stage) stage.style.cursor = 'default';
  });
  stage.addEventListener('click', e => {
    if (didDrag) { e.stopImmediatePropagation(); didDrag = false; }
  }, true);

  // Pinch
  let lastDist = 0;
  stage.addEventListener('touchstart', e => {
    if (e.touches.length === 2)
      lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: true });
  stage.addEventListener('touchmove', e => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const r = stage.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
    const factor = dist / lastDist;
    const newZoom = Math.min(Math.max(_zoom * factor, 0.05), 12);
    _tx = cx - (cx - _tx) * (newZoom / _zoom);
    _ty = cy - (cy - _ty) * (newZoom / _zoom);
    _zoom = newZoom;
    applyTransform();
    lastDist = dist;
  }, { passive: false });
}
