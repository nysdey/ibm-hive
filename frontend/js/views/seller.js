/**
 * seller.js — My Team view
 *
 * Two-column layout: BTSS (left) | TSS (right)
 * Gray dashed lines  = reporting relationship
 * IBM blue lines     = BTSS ↔ TSS partnership
 * Right-side panel   = persistent person detail
 */
import { getPeople } from '../api.js';

// ── Static team data ──────────────────────────────────────────────
const TEAM_META = {
  products: ['IBM PowerVS', 'IBM FlashSystem', 'IBM Fusion'],
  coverage: ['Select Territory', 'National', 'C&D (Channels & Distribution)'],
  btssManager: 'Chris Kennedy',
  tssManager:  'Rob Hanes',
};

const PERSON_DETAIL = {
  'Chris Kennedy':      { role: 'BTSS Manager',                     manager: null,                pair: null,              products: null,                            territory: 'National',  coverage: 'Select Territory',  responsibilities: 'Team leadership, BTSS alignment, escalation support.',           contact: 'ckennedy@us.ibm.com' },
  'Rob Hanes':          { role: 'TSS Manager',                      manager: null,                pair: null,              products: null,                            territory: 'National',  coverage: 'Select Territory',  responsibilities: 'Team leadership, TSS quota ownership, territory strategy.',        contact: 'rhanes@us.ibm.com' },
  'Sydney Chin':        { role: 'Brand Technical Sales Specialist',  manager: 'Chris Kennedy',     pair: null,              products: ['PowerVS','FlashSystem','Fusion'],territory: 'C&D',      coverage: 'Select Territory',  responsibilities: 'Technical discovery, demos, POCs, solution validation.',          contact: 'schin@us.ibm.com' },
  'Mark Hoffman':       { role: 'Brand Technical Sales Specialist',  manager: 'Chris Kennedy',     pair: 'Ross Holley',     products: ['PowerVS','FlashSystem'],        territory: 'C&D',      coverage: 'Select Territory',  responsibilities: 'Technical discovery, demos, POCs, solution validation.',          contact: 'mhoffman@us.ibm.com' },
  'Armada Veraepalli':  { role: 'Brand Technical Sales Specialist',  manager: 'Chris Kennedy',     pair: 'Patrick McBride', products: ['Fusion','z16'],                 territory: 'C&D',      coverage: 'Select Territory',  responsibilities: 'Technical discovery, demos, POCs, solution validation.',          contact: 'averaepalli@us.ibm.com' },
  'Ross Holley':        { role: 'Territory Sales Specialist',        manager: 'Rob Hanes',         pair: 'Mark Hoffman',    products: null,                            territory: 'National',  coverage: 'Select Territory',  responsibilities: 'Territory pipeline, prospecting, commercial close.',              contact: 'rholley@us.ibm.com' },
  'Patrick McBride':    { role: 'Territory Sales Specialist',        manager: 'Rob Hanes',         pair: 'Armada Veraepalli',products: null,                           territory: 'National',  coverage: 'Select Territory',  responsibilities: 'Territory pipeline, prospecting, commercial close.',              contact: 'pmcbride@us.ibm.com' },
};

// ── Layout constants ──────────────────────────────────────────────
const NW      = 160;   // node width
const NH      = 64;    // node height
const COL_GAP = 240;   // gap between BTSS right-edge and TSS left-edge
const V_STEP  = 92;    // vertical step between member rows
const MGR_Y   = 56;    // top margin for managers row
const MBR_Y   = MGR_Y + NH + 64;  // members start Y

// X positions
const BTSSx = 0;
const TSSx  = BTSSx + NW + COL_GAP;
const midX  = BTSSx + NW + COL_GAP / 2;
const SVG_W = TSSx + NW;

// Y positions
const yMark    = MBR_Y;
const yArmada  = MBR_Y + V_STEP;
const ySydney  = MBR_Y + V_STEP * 2;
const yRoss    = yMark;
const yPatrick = yArmada;
const SVG_H    = ySydney + NH + 48;

// ── State ─────────────────────────────────────────────────────────
let _selected    = null;   // person name string
let _hovered     = null;   // person name string
let _personNodes = [];     // [{name, x, y, isManager, person, col}]

// ── Entry ─────────────────────────────────────────────────────────
export async function renderSeller(container) {
  _selected = null;
  _hovered  = null;

  const allPeople = await getPeople();

  const find = (fn, ln) => allPeople.find(p => p.first_name === fn && p.last_name === ln);
  const chrisK   = find('Chris',   'Kennedy');
  const robH     = find('Rob',     'Hanes');
  const sydneyC  = allPeople.find(p => p.is_current_user) || find('Sydney', 'Chin');
  const markH    = find('Mark',    'Hoffman');
  const armada   = find('Armada',  'Veraepalli');
  const rossH    = find('Ross',    'Holley');
  const patrickM = find('Patrick', 'McBride');

  _personNodes = [
    { name: 'Chris Kennedy',     x: BTSSx, y: MGR_Y,   isManager: true,  col: 'btss', person: chrisK   },
    { name: 'Rob Hanes',         x: TSSx,  y: MGR_Y,   isManager: true,  col: 'tss',  person: robH     },
    { name: 'Mark Hoffman',      x: BTSSx, y: yMark,   isManager: false, col: 'btss', person: markH    },
    { name: 'Armada Veraepalli', x: BTSSx, y: yArmada, isManager: false, col: 'btss', person: armada   },
    { name: 'Sydney Chin',       x: BTSSx, y: ySydney, isManager: false, col: 'btss', person: sydneyC  },
    { name: 'Ross Holley',       x: TSSx,  y: yRoss,   isManager: false, col: 'tss',  person: rossH    },
    { name: 'Patrick McBride',   x: TSSx,  y: yPatrick,isManager: false, col: 'tss',  person: patrickM },
  ];

  container.innerHTML = `
    <div class="mt-page">
      <div class="mt-layout">
        <div class="mt-left">

          <div class="mt-overview">
            <div class="mt-overview-title">Team overview</div>
            <div class="mt-overview-grid">
              <div class="mt-ov-block">
                <div class="mt-ov-label">Products</div>
                <div class="mt-ov-list">${TEAM_META.products.map(p => `<div class="mt-ov-item">${p}</div>`).join('')}</div>
              </div>
              <div class="mt-ov-block">
                <div class="mt-ov-label">Coverage</div>
                <div class="mt-ov-list">${TEAM_META.coverage.map(c => `<div class="mt-ov-item">${c}</div>`).join('')}</div>
              </div>
              <div class="mt-ov-block">
                <div class="mt-ov-label">BTSS Manager</div>
                <div class="mt-ov-item mt-ov-name">${TEAM_META.btssManager}</div>
              </div>
              <div class="mt-ov-block">
                <div class="mt-ov-label">TSS Manager</div>
                <div class="mt-ov-item mt-ov-name">${TEAM_META.tssManager}</div>
              </div>
            </div>
          </div>

          <div class="mt-diagram-wrap">
            <div class="mt-svg-scroll" id="mtSvgWrap"></div>
            <div class="mt-legend">
              <span class="mt-leg"><span class="mt-leg-line mt-leg-report"></span>Reports to manager</span>
              <span class="mt-leg"><span class="mt-leg-line mt-leg-pair"></span>BTSS ↔ TSS partnership</span>
            </div>
          </div>

        </div>
        <div class="mt-detail-panel" id="mtDetail">
          <div class="mt-detail-empty">Click anyone on the team map to see their details.</div>
        </div>
      </div>
    </div>
  `;

  drawMap(container);
}

// ── Draw the SVG map ──────────────────────────────────────────────
function drawMap(container) {
  const wrap = document.getElementById('mtSvgWrap');
  if (!wrap) return;

  const detail = PERSON_DETAIL[_selected] || null;
  const hDetail = PERSON_DETAIL[_hovered] || null;

  // Determine which names to highlight based on hover or selection
  const focusName = _hovered || _selected;
  const focusDetail = PERSON_DETAIL[focusName] || null;
  const highlighted = new Set();
  if (focusName) {
    highlighted.add(focusName);
    if (focusDetail?.manager)  highlighted.add(focusDetail.manager);
    if (focusDetail?.pair)     highlighted.add(focusDetail.pair);
    // If it's a manager, highlight all their reports
    _personNodes.forEach(n => {
      const d = PERSON_DETAIL[n.name];
      if (d?.manager === focusName) highlighted.add(n.name);
    });
  }
  const hasFocus = highlighted.size > 0;

  // ── Lines ─────────────────────────────────────────────────────
  let lines = '';

  // Vertical divider
  lines += `<line x1="${midX}" y1="0" x2="${midX}" y2="${SVG_H}"
    stroke="rgba(255,255,255,0.04)" stroke-width="1"/>`;

  // Reporting lines (gray dashed, vertical)
  const reportTargets = [
    [BTSSx, MGR_Y, [yMark, yArmada, ySydney]],
    [TSSx,  MGR_Y, [yRoss, yPatrick]],
  ];
  reportTargets.forEach(([cx, my, memberYs]) => {
    memberYs.forEach(my2 => {
      const mgrName   = cx === BTSSx ? 'Chris Kennedy' : 'Rob Hanes';
      const mbrName   = _personNodes.find(n => n.x === cx && n.y === my2)?.name;
      const isLit     = hasFocus && (highlighted.has(mgrName) && highlighted.has(mbrName));
      const opacity   = !hasFocus ? 0.15 : isLit ? 0.50 : 0.06;
      lines += `<line x1="${cx + NW/2}" y1="${my + NH}" x2="${cx + NW/2}" y2="${my2}"
        stroke="rgba(255,255,255,${opacity})" stroke-width="1" stroke-dasharray="4,4"/>`;
    });
  });

  // Pairing lines (IBM blue, bezier)
  const pairs = [
    ['Mark Hoffman', 'Ross Holley',       yMark,   yRoss],
    ['Armada Veraepalli', 'Patrick McBride', yArmada, yPatrick],
  ];
  pairs.forEach(([bName, tName, y1, y2]) => {
    const isLit   = hasFocus && (highlighted.has(bName) || highlighted.has(tName));
    const opacity = !hasFocus ? 0.45 : isLit ? 1.0 : 0.12;
    const sw      = isLit ? 2 : 1.5;
    lines += `<path d="M ${BTSSx + NW} ${y1 + NH/2} C ${midX} ${y1 + NH/2}, ${midX} ${y2 + NH/2}, ${TSSx} ${y2 + NH/2}"
      stroke="#4589ff" stroke-width="${sw}" fill="none" opacity="${opacity}"/>`;
  });

  // ── Nodes ──────────────────────────────────────────────────────
  let nodes = '';

  // Column headings
  nodes += `<text x="${BTSSx + NW/2}" y="${MGR_Y - 28}" text-anchor="middle"
    fill="#a855f7" font-size="12" font-weight="600"
    font-family="IBM Plex Sans, system-ui, sans-serif">BTSS</text>
  <text x="${BTSSx + NW/2}" y="${MGR_Y - 12}" text-anchor="middle"
    fill="#525252" font-size="10"
    font-family="IBM Plex Sans, system-ui, sans-serif">Brand Technical Sales</text>
  <text x="${TSSx + NW/2}" y="${MGR_Y - 28}" text-anchor="middle"
    fill="#0ea5e9" font-size="12" font-weight="600"
    font-family="IBM Plex Sans, system-ui, sans-serif">TSS</text>
  <text x="${TSSx + NW/2}" y="${MGR_Y - 12}" text-anchor="middle"
    fill="#525252" font-size="10"
    font-family="IBM Plex Sans, system-ui, sans-serif">Territory Sales</text>`;

  _personNodes.forEach(({ name, x, y, isManager, col, person }) => {
    if (!person) return;
    const isMe  = person.is_current_user;
    const isSel = _selected === name;
    const isHov = _hovered  === name;
    const isHighlighted = highlighted.has(name);
    const isDimmed = hasFocus && !isHighlighted;

    // Border color
    const borderColor = isSel
      ? '#4589ff'
      : isManager
        ? (col === 'btss' ? '#a855f7' : '#0ea5e9')
        : (col === 'btss' ? '#4589ff' : '#0ea5e9');
    const borderOpacity = isDimmed ? 0.25 : 1;
    const sw = isSel ? 2 : 1;

    const fillColor = isSel ? '#0d1f3c' : '#1c1c1c';
    const fillOpacity = isDimmed ? 0.4 : 1;

    const nameColor = isDimmed ? 'rgba(255,255,255,0.30)' : (isMe ? '#78a9ff' : '#e0e0e0');
    const subColor  = isDimmed ? 'rgba(255,255,255,0.15)' : borderColor;

    const roleText = isManager
      ? PERSON_DETAIL[name]?.role || '—'
      : (col === 'btss' ? 'BTSS' : 'TSS');

    nodes += `
      <g class="mt-node" data-name="${name}" data-person-id="${person.id}" style="cursor:pointer">
        <rect x="${x}" y="${y}" width="${NW}" height="${NH}" rx="4"
          fill="${fillColor}" fill-opacity="${fillOpacity}"
          stroke="${borderColor}" stroke-opacity="${borderOpacity}" stroke-width="${sw}"/>
        ${isMe ? `<rect x="${x-3}" y="${y-3}" width="${NW+6}" height="${NH+6}" rx="7"
          fill="none" stroke="#4589ff" stroke-opacity="${isDimmed ? 0.15 : 0.5}"
          stroke-width="1" stroke-dasharray="3,3"/>` : ''}
        <text x="${x + NW/2}" y="${y + 22}" text-anchor="middle"
          fill="${nameColor}" font-size="13" font-weight="500"
          font-family="IBM Plex Sans, system-ui, sans-serif">${name}</text>
        <text x="${x + NW/2}" y="${y + 40}" text-anchor="middle"
          fill="${subColor}" fill-opacity="${isDimmed ? 0.4 : 0.85}" font-size="10"
          font-family="IBM Plex Sans, system-ui, sans-serif">${roleText}</text>
        ${isMe ? `<text x="${x + NW/2}" y="${y + 56}" text-anchor="middle"
          fill="#4589ff" fill-opacity="${isDimmed ? 0.3 : 0.7}" font-size="9"
          font-family="IBM Plex Sans, system-ui, sans-serif">you</text>` : ''}
      </g>`;
  });

  wrap.innerHTML = `
    <svg width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
      <g>${lines}</g>
      <g>${nodes}</g>
    </svg>`;

  // ── Events ────────────────────────────────────────────────────
  wrap.querySelectorAll('.mt-node').forEach(el => {
    const name = el.dataset.name;

    el.addEventListener('mouseenter', () => {
      _hovered = name;
      drawMap(document.querySelector('.mt-page')?.closest('[id^="view"]') || wrap.closest('.view') || document.getElementById('view-cell'));
    });
    el.addEventListener('mouseleave', () => {
      _hovered = null;
      drawMap(document.querySelector('.mt-page')?.closest('[id^="view"]') || wrap.closest('.view') || document.getElementById('view-cell'));
    });
    el.addEventListener('click', e => {
      e.stopPropagation();
      _selected = (_selected === name) ? null : name;
      drawMap(document.querySelector('.mt-page')?.closest('[id^="view"]') || wrap.closest('.view') || document.getElementById('view-cell'));
      showPersonDetail(name);
    });
  });
}

// ── Detail panel ──────────────────────────────────────────────────
function showPersonDetail(name) {
  const panel = document.getElementById('mtDetail');
  if (!panel) return;

  if (!name || _selected !== name) {
    panel.innerHTML = `<div class="mt-detail-empty">Click anyone on the team map to see their details.</div>`;
    return;
  }

  const d = PERSON_DETAIL[name] || {};
  const node = _personNodes.find(n => n.name === name);

  const row = (label, value) => value
    ? `<div class="mt-dp-row"><div class="mt-dp-label">${label}</div><div class="mt-dp-value">${value}</div></div>`
    : '';

  const products = d.products?.length
    ? d.products.join(', ')
    : null;

  panel.innerHTML = `
    <div class="mt-dp-content">
      <div class="mt-dp-name">${name}</div>
      <div class="mt-dp-role">${d.role || '—'}</div>
      ${row('Manager', d.manager || 'N/A')}
      ${row('TSS partner', d.pair && d.role?.includes('BTSS') ? d.pair : null)}
      ${row('BTSS partner', d.pair && d.role?.includes('TSS') ? d.pair : null)}
      ${row('Territory', d.territory)}
      ${row('Coverage', d.coverage)}
      ${row('Products', products)}
      ${row('Responsibilities', d.responsibilities)}
      ${row('Contact', d.contact ? `<a href="mailto:${d.contact}" style="color:#4589ff;text-decoration:none">${d.contact}</a>` : null)}
    </div>
  `;
}
