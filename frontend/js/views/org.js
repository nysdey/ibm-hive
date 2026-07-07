/**
 * org.js — Organization tab: expanding honeycomb
 *
 * Purpose: "Where does my role fit in IBM?"
 *
 * Role-centric only. No employee names.
 * Layout: hive fills left side, permanent detail panel on right.
 * Selecting a role highlights its worksWith peers in the hive.
 */

// ─────────────────────────────────────────────────────────────────
// Data — role-centric, no people names
// youAreHere = true on the user's actual segment + function
// User: BTSS in Select Territory
// ─────────────────────────────────────────────────────────────────

const SEGMENTS = [
  {
    id: 'enterprise',
    label: 'Enterprise',
    sub: '143 clients',
    desc: 'IBM\'s top accounts with joint coverage between Technology and Consulting. Clients qualify based on significant investment across both Technology and Consulting. Highest-touch account model with dedicated Client Engineering squads. Examples: JPMorgan Chase, ExxonMobil, General Motors, Boeing.',
    functions: [
      {
        id: 'cse-e', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption post-sale. Provides deep hands-on enablement to ensure clients realize value from IBM technology.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'CSE Lead → VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion',
        segment: 'Enterprise',
      },
      {
        id: 'atl-e', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Provides overall technical leadership across an Enterprise account. Owns the technical architecture strategy and ensures IBM solutions align to the client\'s roadmap.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'VP → IBM Sales Leader',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Enterprise',
      },
      {
        id: 'ce-e', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad that rapidly builds pilots, proofs, and production-ready solutions alongside clients.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → VP',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Enterprise',
      },
      {
        id: 'ae-e', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary commercial relationship owner for Enterprise accounts. Coordinates all IBM resources and owns the overall commercial outcome.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'VP → IBM Sales Leader',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership from Prospect to Renewal',
        segment: 'Enterprise',
      },
    ],
  },
  {
    id: 'strategic',
    label: 'Strategic',
    sub: '446 clients',
    desc: 'Clients that have made strategic bets or have a sizeable footprint with IBM in Technology. Dedicated coverage with director-level oversight. Examples: Fidelity Investments, Anthem, Lockheed Martin, FedEx.',
    functions: [
      {
        id: 'cse-s', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption and expansion across strategic accounts. Deep technical enablement post-close.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'Director → VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion → Renewal',
        segment: 'Strategic',
      },
      {
        id: 'atl-s', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Overall technical leadership for strategic accounts. Owns the technical relationship and architecture decisions.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'Director → VP',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Strategic',
      },
      {
        id: 'ce-s', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad. Rapidly builds pilots and proofs for strategic accounts.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → Director',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Strategic',
      },
      {
        id: 'ae-s', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary relationship owner for strategic accounts. Coordinates full IBM coverage team and owns commercial outcome.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'Director → VP',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership',
        segment: 'Strategic',
      },
    ],
  },
  {
    id: 'horizon',
    label: 'Select Horizon',
    sub: '1,589 clients',
    desc: 'Current IBM clients with potential for future growth and expansion. With dedicated support, Horizon accounts become the next Strategic Clients. Higher-touch than Territory. Examples: Regional banks, mid-size manufacturers, healthcare systems.',
    functions: [
      {
        id: 'cse-h', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption in Horizon accounts. Partners with ATL to identify expansion opportunities and ensure value realization.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'CSE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion',
        segment: 'Select Horizon',
      },
      {
        id: 'atl-h', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Provides overall technical leadership for Horizon accounts. Owns the technical strategy and solution alignment.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Select Horizon',
      },
      {
        id: 'ce-h', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad that rapidly builds pilots and proofs. Engaged post-discovery to accelerate technical evaluation.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Select Horizon',
      },
      {
        id: 'ae-h', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary client relationship owner. Coordinates all IBM resources and owns the overall commercial outcome for Horizon accounts.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'Colony VP',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership from Prospect to Renewal',
        segment: 'Select Horizon',
      },
    ],
  },
  {
    id: 'territory',
    label: 'Select Territory',
    sub: '420K clients',
    desc: 'Digital-first, scaled sales model. Clients buy primarily Technology or Consulting, often through Ecosystem partners. Divided into Select Territory Growth (1,796 clients) and Select Territory Activate. Examples: Small and mid-size businesses, startups, SMB retail, local government.',
    youAreHere: true,
    functions: [
      {
        id: 'btss-t', abbr: 'BTSS', label: 'Brand Technical Sales Specialist',
        purpose: 'Technical discovery, demos, POCs, solution validation, and deal progression for 1–12 specialized IBM products. Paired with TSS for joint coverage across a territory.',
        worksWith: ['TSS', 'SDR', 'Business Partners', 'Tech SME', 'CSM'],
        reportsThrough: 'BTSS Manager → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Technical Discovery → Demo → POC → Solution Validation → Deal Progression',
        segment: 'Select Territory',
        youAreHere: true,
        products: 'Focused on 1–12 products within a specialty (e.g. PowerVS, FlashSystem, Fusion, z16, LinuxONE)',
      },
      {
        id: 'tss-t', abbr: 'TSS', label: 'Territory Sales Specialist',
        purpose: 'Cross-brand sales across a defined territory. Paired with BTSS for joint technical and commercial coverage. Owns territory quota.',
        worksWith: ['BTSS', 'SDR', 'Business Partners'],
        reportsThrough: 'TSS Manager → Colony VP',
        ownsAccounts: true,
        salesMotion: 'Prospecting → Discovery → Paired close with BTSS',
        segment: 'Select Territory',
      },
      {
        id: 'sdr-t', abbr: 'SDR', label: 'Sales Development Rep',
        purpose: 'Pipeline generation through outbound prospecting. Qualifies leads and books discovery calls for TSS and BTSS.',
        worksWith: ['TSS', 'BTSS'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Outbound → Qualification → Handoff to TSS/BTSS',
        segment: 'Select Territory',
      },
      {
        id: 'csm-t', abbr: 'CSM', label: 'Customer Success Manager',
        purpose: 'Drive post-sale adoption and value realization. Monitor account health, flag renewal risk, and coordinate expansion motions.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Renewal → Expansion',
        segment: 'Select Territory',
      },
      {
        id: 'tps-t', abbr: 'TPS', label: 'Technology Partner Specialist',
        purpose: 'Manage and enable Business Partner relationships for a technology domain. Drive partner-sourced pipeline and co-sell execution.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner enablement → Co-sell → Channel close',
        segment: 'Select Territory',
      },
      {
        id: 'pts-t', abbr: 'PTS', label: 'Partner Technical Specialist',
        purpose: 'Provide technical enablement and pre-sales support to Business Partners. Runs demos and POCs with partners on behalf of IBM.',
        worksWith: ['TPS', 'BTSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner Technical Enablement → Partner-led POC → Channel close',
        segment: 'Select Territory',
      },
      {
        id: 'sme-t', abbr: 'Tech SME', label: 'Technical Subject Matter Expert',
        purpose: 'Deep specialist on a specific technology domain. Engaged for complex technical questions that require beyond-BTSS expertise.',
        worksWith: ['BTSS', 'TSS', 'Client Engineering'],
        reportsThrough: 'Technical Leader → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Engaged on-demand at any technical escalation point',
        segment: 'Select Territory',
      },
      {
        id: 'bp-t', abbr: 'BP', label: 'Business Partners',
        purpose: 'Ecosystem partners (ISVs, resellers, distributors) who sell IBM technology to clients. Major growth lever for Select Territory.',
        worksWith: ['TPS', 'PTS', 'BTSS'],
        reportsThrough: 'Partner ecosystem — external to IBM org',
        ownsAccounts: true,
        salesMotion: 'Channel-led selling → Partner close → IBM co-sell support',
        segment: 'Select Territory',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Hex geometry (pointy-top)
// ─────────────────────────────────────────────────────────────────
const R   = 72;                    // original radius
const CS  = R * Math.sqrt(3);      // horizontal center-to-center
const RS  = R * 2;                 // vertical center-to-center
const GAP = 48;                    // spacing so hexes don't touch

function hexPts(cx, cy, r = R) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

// ─────────────────────────────────────────────────────────────────
// View state
// ─────────────────────────────────────────────────────────────────
let _expandedSegments = new Set();
let _selectedId       = null;   // currently selected node id

// ─────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────
export async function renderOrg(container) {
  _expandedSegments = new Set();
  _selectedId       = null;

  container.innerHTML = `
    <div class="ohive-layout">
      <div class="ohive-hive-area">
        <div class="ohive-canvas" id="ohiveCanvas"></div>
      </div>
      <div class="ohive-detail-panel" id="ohiveDetail">
        <div class="ohive-detail-empty">
          <div class="ohive-detail-welcome">
            <div class="ohive-detail-welcome-title">IBM Hive</div>
            <div class="ohive-detail-welcome-body">Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM's go-to-market motion.</div>
            <div class="ohive-detail-welcome-tip">Your current role is highlighted in purple.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  redraw();
}

// ─────────────────────────────────────────────────────────────────
// Layout builder
// ─────────────────────────────────────────────────────────────────
const COLS_PER_ROW = 4;

function buildLayout() {
  const nodes     = [];
  const pos       = {};
  const lines_data = [];

  const PAD_X = R + 48;
  const PAD_Y = R + 36;

  const segCount  = SEGMENTS.length;
  const segTotalW = segCount * CS + (segCount - 1) * GAP;

  // Cluster widths for expanded segments
  const clusterWidths = {};
  SEGMENTS.forEach(seg => {
    if (!_expandedSegments.has(seg.id)) return;
    const n    = seg.functions.length;
    const cols = Math.min(n, COLS_PER_ROW);
    clusterWidths[seg.id] = cols * CS + (cols - 1) * GAP;
  });

  const maxW  = Math.max(segTotalW, ...Object.values(clusterWidths), 0);
  const svgW  = maxW + PAD_X * 2;
  const svgCX = svgW / 2;

  // Root
  let curY = PAD_Y + R;
  nodes.push({
    id: 'root', label: 'IBM', sub: 'Client Segments',
    type: 'root', cx: svgCX, cy: curY,
    isSelected: _selectedId === 'root',
    youAreHere: false, data: null,
  });
  pos['root'] = { cx: svgCX, cy: curY };
  curY += RS + GAP;

  // Segments
  const segStartX = svgCX - segTotalW / 2 + CS / 2;
  SEGMENTS.forEach((seg, si) => {
    const cx = segStartX + si * (CS + GAP);
    const cy = curY;
    nodes.push({
      id: seg.id, label: seg.label, sub: seg.sub,
      type: 'segment', cx, cy,
      isSelected: _selectedId === seg.id,
      youAreHere: seg.youAreHere || false,
      isExpanded: _expandedSegments.has(seg.id),
      data: seg,
    });
    pos[seg.id] = { cx, cy };
    // IBM → segment line
    lines_data.push({ x1: svgCX, y1: pos['root'].cy + R, x2: cx, y2: cy - R, kind: 'root-seg' });
  });
  curY += RS + GAP;

  // Role clusters
  SEGMENTS.forEach(seg => {
    if (!_expandedSegments.has(seg.id)) return;

    const fns  = seg.functions;
    const cols = Math.min(fns.length, COLS_PER_ROW);
    const rows = Math.ceil(fns.length / cols);
    const clusterW      = cols * CS + (cols - 1) * GAP;
    const clusterStartX = svgCX - clusterW / 2 + CS / 2;

    fns.forEach((fn, fi) => {
      const col     = fi % cols;
      const row     = Math.floor(fi / cols);
      const offsetX = (row % 2 === 1) ? CS / 2 : 0;
      const cx      = clusterStartX + col * (CS + GAP) + offsetX;
      const cy      = curY + row * (RS + GAP);

      nodes.push({
        id: fn.id, label: fn.abbr, sub: fn.label,
        type: 'function', cx, cy,
        isSelected: _selectedId === fn.id,
        youAreHere: fn.youAreHere || false,
        isExpanded: false, data: fn,
        segId: seg.id,
      });
      pos[fn.id] = { cx, cy };
      // Segment → role line
      const segPos = pos[seg.id];
      if (segPos) {
        lines_data.push({ x1: segPos.cx, y1: segPos.cy + R, x2: cx, y2: cy - R, kind: 'seg-role' });
      }
    });

    curY += rows * (RS + GAP) + GAP;
  });

  const svgH = curY + R + PAD_Y;
  return { nodes, svgW, svgH, lines_data };
}

// ─────────────────────────────────────────────────────────────────
// Compute which node ids are "related" to the selected node
// Returns: { selected: Set, related: Set }
// ─────────────────────────────────────────────────────────────────
function getRelationshipSets(selectedId) {
  if (!selectedId || selectedId === 'root') return { selected: new Set(), related: new Set() };

  // Find the selected function
  let selFn = null;
  for (const seg of SEGMENTS) {
    const fn = seg.functions.find(f => f.id === selectedId);
    if (fn) { selFn = fn; break; }
  }
  if (!selFn) return { selected: new Set([selectedId]), related: new Set() };

  const worksWithAbbrs = new Set((selFn.worksWith || []).map(w => w.toLowerCase()));

  // Find all role nodes whose abbr is in worksWith
  const related = new Set();
  for (const seg of SEGMENTS) {
    for (const fn of seg.functions) {
      if (worksWithAbbrs.has(fn.abbr.toLowerCase())) {
        related.add(fn.id);
      }
    }
  }

  return { selected: new Set([selectedId]), related };
}

// ─────────────────────────────────────────────────────────────────
// Text wrap — break on spaces, max maxChars per line
// ─────────────────────────────────────────────────────────────────
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxChars) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─────────────────────────────────────────────────────────────────
// Draw
// ─────────────────────────────────────────────────────────────────
function redraw() {
  const canvas = document.getElementById('ohiveCanvas');
  if (!canvas) return;

  const { nodes, svgW, svgH, lines_data } = buildLayout();
  const { selected, related } = getRelationshipSets(_selectedId);
  const hasSelection = selected.size > 0;

  // Lines
  const lines = lines_data.map(l => {
    const isRootSeg = l.kind === 'root-seg';
    return `<line x1="${l.x1.toFixed(1)}" y1="${l.y1.toFixed(1)}"
      x2="${l.x2.toFixed(1)}" y2="${l.y2.toFixed(1)}"
      stroke="rgba(255,255,255,${isRootSeg ? '0.28' : '0.18'})"
      stroke-width="${isRootSeg ? '1.5' : '1'}" stroke-linecap="round" pointer-events="none"/>`;
  }).join('');

  let hexes = '';
  nodes.forEach(n => {
    const isRoot = n.type === 'root';
    const isSeg  = n.type === 'segment';
    const isFn   = n.type === 'function';
    const isSel  = selected.has(n.id);
    const isRel  = related.has(n.id);
    const isYou  = n.youAreHere;

    // Outline: always white except selected (blue) and you-are-here (purple)
    // Related cells get a brighter white outline to highlight the relationship
    const stroke = isSel
      ? '#4589ff'
      : isYou
        ? '#a855f7'
        : isRel
          ? 'rgba(255,255,255,0.90)'
          : 'rgba(255,255,255,0.70)';
    const sw = isSel || isYou ? 2.5 : isRel ? 2 : 1.5;

    // Fill: all cells the same gray — never dim
    const fill = '#2a2a2a';

    // Text: always white
    const labelColor = '#ffffff';
    const subColor   = 'rgba(255,255,255,0.45)';

    const labelFontSize   = isRoot ? 16 : isFn ? 14 : 13;
    const labelFontWeight = isRoot || isSel ? 700 : 500;

    const labelLines  = wrapText(n.label, isRoot ? 10 : 8);
    const lineH       = labelFontSize + 3;
    const labelBlockH = labelLines.length * lineH;
    const labelBaseY  = n.sub
      ? n.cy - labelBlockH / 2 - 6
      : n.cy - labelBlockH / 2 + labelFontSize * 0.35;

    const labelEl = labelLines.map((line, i) =>
      `<text x="${n.cx.toFixed(1)}" y="${(labelBaseY + i * lineH).toFixed(1)}"
        text-anchor="middle" fill="${labelColor}"
        font-size="${labelFontSize}" font-weight="${labelFontWeight}"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${line}</text>`
    ).join('');

    const subLines = n.sub ? wrapText(n.sub, 11) : [];
    const subBaseY = labelBaseY + labelLines.length * lineH + 3;
    const subEl = subLines.map((line, i) =>
      `<text x="${n.cx.toFixed(1)}" y="${(subBaseY + i * 13).toFixed(1)}"
        text-anchor="middle" fill="${subColor}" font-size="10"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${line}</text>`
    ).join('');

    // No expand dot — the lines communicating segment→role is enough

    hexes += `
      <g class="ohive-node" data-node-id="${n.id}" data-node-type="${n.type}"
         ${n.segId ? `data-seg-id="${n.segId}"` : ''} style="cursor:pointer">
        <polygon points="${hexPts(n.cx, n.cy)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelEl}${subEl}
      </g>`;
  });

  canvas.innerHTML = `
    <svg id="ohiveSvg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
      <g>${lines}</g>
      <g>${hexes}</g>
    </svg>`;

  canvas.querySelector('#ohiveSvg')?.addEventListener('click', () => clearSelection());

  canvas.querySelectorAll('.ohive-node').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleClick(el.dataset.nodeId, el.dataset.nodeType, e.shiftKey);
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Interaction
// ─────────────────────────────────────────────────────────────────
function handleClick(id, type, shiftKey = false) {
  if (type === 'root') {
    _expandedSegments.clear();
    _selectedId = null;
    redraw();
    showDetail(null, null);
    return;
  }

  if (type === 'segment') {
    if (_expandedSegments.has(id)) {
      _expandedSegments.delete(id);
      _selectedId = null;
    } else {
      if (!shiftKey) _expandedSegments.clear();
      _expandedSegments.add(id);
      _selectedId = id;
    }
    redraw();
    const seg = SEGMENTS.find(s => s.id === id);
    showDetail(id, 'segment', seg);
    return;
  }

  if (type === 'function') {
    _selectedId = (_selectedId === id) ? null : id;
    redraw();
    if (_selectedId) {
      const seg = SEGMENTS.find(s => s.functions.some(f => f.id === id));
      const fn  = seg?.functions.find(f => f.id === id);
      showDetail(id, 'function', fn);
    } else {
      showDetail(null, null);
    }
    return;
  }
}

function clearSelection() {
  _selectedId = null;
  redraw();
  showDetail(null, null);
}

// ─────────────────────────────────────────────────────────────────
// Permanent right-side detail panel
// ─────────────────────────────────────────────────────────────────
function field(label, value) {
  if (!value) return '';
  return `
    <div class="odp-field">
      <div class="odp-field-label">${label}</div>
      <div class="odp-field-value">${value}</div>
    </div>`;
}

function showDetail(id, type, data) {
  const panel = document.getElementById('ohiveDetail');
  if (!panel) return;

  if (!id || !data) {
    panel.innerHTML = `
      <div class="ohive-detail-empty">
        <div class="ohive-detail-welcome">
          <div class="ohive-detail-welcome-title">IBM Hive</div>
          <div class="ohive-detail-welcome-body">Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM's go-to-market motion.</div>
          <div class="ohive-detail-welcome-tip">Your current role is highlighted in purple.</div>
        </div>
      </div>`;
    return;
  }

  if (type === 'segment') {
    const rows = data.functions.map(f =>
      `<div class="odp-role-row">
        <span class="odp-role-abbr">${f.abbr}</span>
        <span class="odp-role-label">${f.label}</span>
      </div>`
    ).join('');
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-type-badge">Client segment</div>
        <div class="odp-title">${data.label}</div>
        <div class="odp-sub">${data.sub}</div>
        <div class="odp-desc">${data.desc}</div>
        <div class="odp-section-title">Roles in this segment</div>
        <div class="odp-role-list">${rows}</div>
        <div class="odp-hint">Click a role to see how it connects to others.</div>
      </div>`;
    return;
  }

  if (type === 'function') {
    const ww = (data.worksWith || []).map(w =>
      `<span class="odp-works-tag">${w}</span>`
    ).join('');
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-type-badge">Role</div>
        <div class="odp-title">${data.abbr}</div>
        <div class="odp-sub">${data.label}</div>
        ${data.youAreHere ? '<div class="odp-you-badge">You are here</div>' : ''}
        <div class="odp-desc">${data.purpose}</div>

        <div class="odp-section-title">Works with</div>
        <div class="odp-works-tags">${ww || '—'}</div>
        <div class="odp-works-hint">Highlighted in hive above</div>

        ${field('Quota', data.ownsAccounts ? 'Owns accounts — carries quota' : 'Supports quota — does not own accounts')}
        ${field('Sales motion', data.salesMotion)}
        ${data.products ? field('Products', data.products) : ''}
      </div>`;
  }
}
