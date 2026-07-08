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
    sub: '143 Clients',
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
    sub: '446 Clients',
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
    sub: '1,589 Clients',
    desc: 'Current IBM clients with potential for future growth and expansion. With dedicated support, Horizon accounts become the next Strategic Clients. Higher-touch than Territory. Examples: Regional banks, mid-size manufacturers, healthcare systems.',
    groupByCategory: true,
    functions: [
      {
        id: 'ae-h', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary client relationship owner. Coordinates all IBM resources and owns the overall commercial outcome for Horizon accounts.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'Colony VP',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership from Prospect to Renewal',
        segment: 'Select Horizon',
        category: 'Sales Roles',
      },
      {
        id: 'cse-h', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption in Horizon accounts. Partners with ATL to identify expansion opportunities and ensure value realization.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'CSE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion',
        segment: 'Select Horizon',
        category: 'Sales Roles',
      },
      {
        id: 'atl-h', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Provides overall technical leadership for Horizon accounts. Owns the technical strategy and solution alignment.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Select Horizon',
        category: 'Technical Roles',
      },
      {
        id: 'ce-h', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad that rapidly builds pilots and proofs. Engaged post-discovery to accelerate technical evaluation.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Select Horizon',
        category: 'Technical Roles',
      },
    ],
  },
  {
    id: 'territory',
    label: 'Select Territory',
    sub: '420k Clients',
    desc: 'Digital-first, scaled sales model. Clients buy primarily Technology or Consulting, often through Ecosystem partners. Divided into Select Territory Growth (1,796 clients) and Select Territory Activate. Examples: Small and mid-size businesses, startups, SMB retail, local government.',
    youAreHere: true,
    groupByCategory: true,
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
        category: 'Sales Roles',
      },
      {
        id: 'tss-t', abbr: 'TSS', label: 'Territory Sales Specialist',
        purpose: 'Cross-brand sales across a defined territory. Paired with BTSS for joint technical and commercial coverage. Owns territory quota.',
        worksWith: ['BTSS', 'SDR', 'Business Partners'],
        reportsThrough: 'TSS Manager → Colony VP',
        ownsAccounts: true,
        salesMotion: 'Prospecting → Discovery → Paired close with BTSS',
        segment: 'Select Territory',
        category: 'Sales Roles',
      },
      {
        id: 'sdr-t', abbr: 'SDR', label: 'Sales Development Rep',
        purpose: 'Pipeline generation through outbound prospecting. Qualifies leads and books discovery calls for TSS and BTSS.',
        worksWith: ['TSS', 'BTSS'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Outbound → Qualification → Handoff to TSS/BTSS',
        segment: 'Select Territory',
        category: 'Sales Roles',
      },
      {
        id: 'csm-t', abbr: 'CSM', label: 'Customer Success Manager',
        purpose: 'Drive post-sale adoption and value realization. Monitor account health, flag renewal risk, and coordinate expansion motions.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Renewal → Expansion',
        segment: 'Select Territory',
        category: 'Technical Roles',
      },
      {
        id: 'sme-t', abbr: 'Tech SME', label: 'Technical Subject Matter Expert',
        purpose: 'Deep specialist on a specific technology domain. Engaged for complex technical questions that require beyond-BTSS expertise.',
        worksWith: ['BTSS', 'TSS', 'Client Engineering'],
        reportsThrough: 'Technical Leader → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Engaged on-demand at any technical escalation point',
        segment: 'Select Territory',
        category: 'Technical Roles',
      },
      {
        id: 'tps-t', abbr: 'TPS', label: 'Technology Partner Specialist',
        purpose: 'Manage and enable Business Partner relationships for a technology domain. Drive partner-sourced pipeline and co-sell execution.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner enablement → Co-sell → Channel close',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
      },
      {
        id: 'pts-t', abbr: 'PTS', label: 'Partner Technical Specialist',
        purpose: 'Provide technical enablement and pre-sales support to Business Partners. Runs demos and POCs with partners on behalf of IBM.',
        worksWith: ['TPS', 'BTSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner Technical Enablement → Partner-led POC → Channel close',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
      },
      {
        id: 'bp-t', abbr: 'BP', label: 'Business Partners',
        purpose: 'Ecosystem partners (ISVs, resellers, distributors) who sell IBM technology to clients. Major growth lever for Select Territory.',
        worksWith: ['TPS', 'PTS', 'BTSS'],
        reportsThrough: 'Partner ecosystem — external to IBM org',
        ownsAccounts: true,
        salesMotion: 'Channel-led selling → Partner close → IBM co-sell support',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
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
let _expandedSegments  = new Set();
let _selectedId        = null;   // currently selected node id
let _panelCollapsed    = false;
let _zoom              = 1;
const ZOOM_STEP        = 0.15;
const ZOOM_MIN         = 0.4;
const ZOOM_MAX         = 2.5;

// ─────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────
export async function renderOrg(container) {
  _expandedSegments = new Set();
  _selectedId       = null;
  _panelCollapsed   = false;
  _zoom             = 1;

  container.innerHTML = `
    <div class="ohive-layout">
      <div class="ohive-hive-area" id="ohiveHiveArea">
        <div class="ohive-zoom-controls" id="ohiveZoomControls">
          <button class="ohive-zoom-btn" id="ohiveZoomIn" title="Zoom in">+</button>
          <button class="ohive-zoom-btn" id="ohiveZoomReset" title="Reset zoom">⊙</button>
          <button class="ohive-zoom-btn" id="ohiveZoomOut" title="Zoom out">−</button>
        </div>
        <div class="ohive-canvas" id="ohiveCanvas"></div>
      </div>
      <button class="ohive-panel-toggle" id="ohivePanelToggle" title="Toggle detail panel">&#x276D;</button>
      <div class="ohive-detail-panel" id="ohiveDetail">
        <div class="ohive-detail-empty">
          <div class="ohive-detail-welcome">
            <div class="ohive-detail-welcome-title">IBM Colonies</div>
            <div class="ohive-detail-welcome-body">Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM's go-to-market motion.</div>
            <div class="ohive-detail-welcome-tip">Your current role is highlighted in purple.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('ohiveZoomIn')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = Math.min(ZOOM_MAX, parseFloat((_zoom + ZOOM_STEP).toFixed(2)));
    applyZoom();
  });
  document.getElementById('ohiveZoomOut')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = Math.max(ZOOM_MIN, parseFloat((_zoom - ZOOM_STEP).toFixed(2)));
    applyZoom();
  });
  document.getElementById('ohiveZoomReset')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = 1;
    applyZoom();
  });
  document.getElementById('ohivePanelToggle')?.addEventListener('click', e => {
    e.stopPropagation();
    _panelCollapsed = !_panelCollapsed;
    const layout = container.querySelector('.ohive-layout');
    const toggle = document.getElementById('ohivePanelToggle');
    const detail = document.getElementById('ohiveDetail');
    layout?.classList.toggle('ohive-panel-collapsed', _panelCollapsed);
    if (toggle) toggle.innerHTML = _panelCollapsed ? '&#x276C;' : '&#x276D;';
    // The hive area's available width changes as the panel slides in/out,
    // so the role clusters need to re-pack. Redraw now for responsiveness
    // and again once the width transition settles for a pixel-perfect fit.
    redraw();
    detail?.addEventListener('transitionend', () => redraw(), { once: true });
  });

  // Trackpad pinch-to-zoom: browsers report a trackpad pinch gesture as a
  // wheel event with ctrlKey set. Plain two-finger scroll (no ctrlKey)
  // is left alone so it keeps panning the canvas via native scrolling.
  const hiveArea = document.getElementById('ohiveHiveArea');
  hiveArea?.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.01);
    _zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, _zoom * factor));
    applyZoom();
  }, { passive: false });

  // Re-pack role clusters if the window itself is resized.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('ohiveCanvas')) redraw();
    }, 150);
  });

  redraw();
}

function applyZoom() {
  const canvas = document.getElementById('ohiveCanvas');
  if (canvas) canvas.style.transform = `scale(${_zoom})`;
}

// ─────────────────────────────────────────────────────────────────
// Layout builder
// ─────────────────────────────────────────────────────────────────
const COLS_PER_ROW        = 4;
const CATEGORY_LABEL_H    = 26; // height reserved above a category's hex row for its label
const CAT_GAP             = GAP * 1.5; // horizontal gap between category groups

// How much horizontal room the hive actually has right now — shrinks
// when the detail panel is open, grows when it's collapsed. Category
// groups wrap to a new row (see packCategoryRows) once they no longer
// fit, rather than overflowing off-screen behind the panel.
function getAvailableWidth() {
  const hiveArea = document.getElementById('ohiveHiveArea');
  const raw = hiveArea ? hiveArea.clientWidth : 900;
  return Math.max(CS + 40, (raw || 900) - 64);
}

// Bin-packs a groupByCategory segment's role categories into as few rows
// as fit within availW — one row when there's room (the "three tiers"
// case: root → segments → roles), wrapping a clump of categories down
// to additional rows only when the available width forces it.
function packCategoryRows(seg, availW) {
  const categoryOrder = [];
  const categoryMap   = {};
  seg.functions.forEach(fn => {
    const cat = fn.category || 'Other';
    if (!categoryMap[cat]) { categoryMap[cat] = []; categoryOrder.push(cat); }
    categoryMap[cat].push(fn);
  });

  const cats = categoryOrder.map(cat => {
    const fns  = categoryMap[cat];
    const cols = Math.min(fns.length, COLS_PER_ROW);
    const rows = Math.ceil(fns.length / cols);
    const w    = cols * CS + (cols - 1) * GAP;
    return { cat, fns, cols, rows, w };
  });

  const rows = [];
  let curRow = [];
  let curRowW = 0;
  cats.forEach(c => {
    const addW = c.w + (curRow.length > 0 ? CAT_GAP : 0);
    if (curRow.length > 0 && curRowW + addW > availW) {
      rows.push(curRow);
      curRow = [c];
      curRowW = c.w;
    } else {
      curRow.push(c);
      curRowW += addW;
    }
  });
  if (curRow.length) rows.push(curRow);

  return rows.map(row => ({
    cats: row,
    rowWidth:  row.reduce((s, c, i) => s + c.w + (i > 0 ? CAT_GAP : 0), 0),
    rowHeight: CATEGORY_LABEL_H + Math.max(...row.map(c => c.rows)) * (RS + GAP),
  }));
}

function buildLayout() {
  const nodes     = [];
  const pos       = {};
  const lines_data = [];

  const PAD_X = R + 48;
  const PAD_Y = R + 36;
  const availW = getAvailableWidth();

  const segCount  = SEGMENTS.length;
  const segTotalW = segCount * CS + (segCount - 1) * GAP;

  // Pre-compute grouped-row layouts once so the width used to size the
  // canvas and the positions used to place hexes never disagree.
  const groupedRowsBySeg = {};
  const clusterWidths = {};
  SEGMENTS.forEach(seg => {
    if (!_expandedSegments.has(seg.id)) return;
    if (seg.groupByCategory) {
      const rows = packCategoryRows(seg, availW);
      groupedRowsBySeg[seg.id] = rows;
      clusterWidths[seg.id] = Math.max(...rows.map(r => r.rowWidth));
    } else {
      const n    = seg.functions.length;
      const cols = Math.min(n, COLS_PER_ROW);
      clusterWidths[seg.id] = cols * CS + (cols - 1) * GAP;
    }
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

    if (seg.groupByCategory) {
      const rows = groupedRowsBySeg[seg.id] || [];

      // Each row of categories is centred independently and stacked
      // vertically — one row when everything fits (three tiers total),
      // extra rows only for the clump that didn't fit on the row above.
      rows.forEach(row => {
        let groupStartX = svgCX - row.rowWidth / 2 + CS / 2; // left-centre of first hex in this row

        row.cats.forEach(c => {
          const groupCX = groupStartX + c.w / 2 - CS / 2; // centre of this group
          const labelX  = groupStartX - CS / 2;

          // Category label — sits just above the hexes, left-aligned to the group
          nodes.push({
            id: `cat-${seg.id}-${c.cat}`, label: c.cat, sub: null,
            type: 'category-label',
            cx: groupCX, cy: curY + CATEGORY_LABEL_H / 2,
            clusterX: labelX,
            isSelected: false, youAreHere: false, isExpanded: false, data: null,
            segId: seg.id,
          });

          // Hexes for this category
          c.fns.forEach((fn, fi) => {
            const col = fi % c.cols;
            const frow = Math.floor(fi / c.cols);
            const cx  = groupStartX + col * (CS + GAP);
            const cy  = curY + CATEGORY_LABEL_H + frow * (RS + GAP);

            nodes.push({
              id: fn.id, label: fn.abbr, sub: fn.label,
              type: 'function', cx, cy,
              isSelected: _selectedId === fn.id,
              youAreHere: fn.youAreHere || false,
              isExpanded: false, data: fn,
              segId: seg.id,
            });
            pos[fn.id] = { cx, cy };
            const segPos = pos[seg.id];
            if (segPos) {
              lines_data.push({ x1: segPos.cx, y1: segPos.cy + R, x2: cx, y2: cy - R, kind: 'seg-role' });
            }
          });

          groupStartX += c.w + CAT_GAP;
        });

        curY += row.rowHeight + GAP;
      });
    } else {
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
    }
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
    // Category label — a real heading for the role grouping (Sales / Technical / Ecosystem Roles)
    if (n.type === 'category-label') {
      // Use the same cluster left-edge as the hexes below it
      const labelX = n.clusterX !== undefined ? n.clusterX : n.cx;
      hexes += `
        <g pointer-events="none">
          <text x="${labelX.toFixed(1)}" y="${(n.cy + 5).toFixed(1)}"
            text-anchor="start" fill="rgba(255,255,255,0.85)" font-size="13" font-weight="600"
            letter-spacing="0.2" font-family="IBM Plex Sans,system-ui,sans-serif">${n.label}</text>
        </g>`;
      return;
    }

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
    const subColor   = 'rgba(255,255,255,0.72)';

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
    const subBaseY = labelBaseY + labelLines.length * lineH + 4;
    const subEl = subLines.map((line, i) =>
      `<text x="${n.cx.toFixed(1)}" y="${(subBaseY + i * 14).toFixed(1)}"
        text-anchor="middle" fill="${subColor}" font-size="11.5"
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
          <div class="ohive-detail-welcome-title">IBM Colonies</div>
          <div class="ohive-detail-welcome-body">Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM's go-to-market motion.</div>
          <div class="ohive-detail-welcome-tip">Your current role is highlighted in purple.</div>
        </div>
      </div>`;
    return;
  }

  if (type === 'segment') {
    let rolesHtml = '';
    if (data.groupByCategory) {
      const categoryOrder = [];
      const categoryMap   = {};
      data.functions.forEach(f => {
        const cat = f.category || 'Other';
        if (!categoryMap[cat]) { categoryMap[cat] = []; categoryOrder.push(cat); }
        categoryMap[cat].push(f);
      });
      rolesHtml = categoryOrder.map(cat => {
        const rows = categoryMap[cat].map(f =>
          `<div class="odp-role-row">
            <span class="odp-role-abbr">${f.abbr}</span>
            <span class="odp-role-label">${f.label}</span>
          </div>`
        ).join('');
        return `<div class="odp-cat-heading">${cat}</div><div class="odp-role-list">${rows}</div>`;
      }).join('');
    } else {
      rolesHtml = `<div class="odp-role-list">${data.functions.map(f =>
        `<div class="odp-role-row">
          <span class="odp-role-abbr">${f.abbr}</span>
          <span class="odp-role-label">${f.label}</span>
        </div>`
      ).join('')}</div>`;
    }
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-type-badge">Client Segment</div>
        <div class="odp-title">${data.label}</div>
        <div class="odp-sub">${data.sub}</div>
        <div class="odp-desc">${data.desc}</div>
        <div class="odp-section-title">Roles in This Segment</div>
        ${rolesHtml}
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

        <div class="odp-section-title">Works With</div>
        <div class="odp-works-tags">${ww || '—'}</div>
        <div class="odp-works-hint">Highlighted in hive above</div>

        ${field('Quota', data.ownsAccounts ? 'Owns accounts — carries quota' : 'Supports quota — does not own accounts')}
        ${field('Sales Motion', data.salesMotion)}
        ${data.products ? field('Products', data.products) : ''}
      </div>`;
  }
}
