/**
 * seller.js — My Team view
 *
 * IBM Infrastructure – Select-T Activate
 * Four manager groups: Chris Kennedy (BTSS), Rob Mason (TSS),
 * Adrian Meghoo (BTS), Darryl Pope (SDR Manager)
 *
 * Three views:
 *  - List View     — grouped rows, name / region / territory
 *  - Hive View     — each group as a tessellated hex cluster (2×2 grid)
 *  - Pairings View — SVG showing BTSS↔TSS territory pairs with connecting lines
 */

// ── Team data ─────────────────────────────────────────────────────
const ORG_META = {
  name:    'IBM Infrastructure',
  segment: 'Select-T Activate',
};

// BTSS first — that's Sydney's team
const MANAGER_GROUPS = [
  {
    id:          'btss',
    manager:     'Chris Kennedy',
    title:       'BTSS Manager',
    product:     null,
    market:      'Comms / Distribution',
    products:    ['PowerVS', 'FlashSystem', 'Fusion'],
    accentColor: '#4589ff', // IBM blue
    members: [
      { name: 'John Tatum',           territory: 'CA South, AL, GA, MS, HI',          region: null },
      { name: 'Emmanuel Garit',        territory: 'FL',                                 region: null },
      { name: 'Jette Jones',           territory: 'KY, TN, NC, SC',                    region: null },
      { name: 'Morgan McKeithan',      territory: 'VA, WV, MD, DC',                    region: null },
      { name: 'Tyler Reinsmith',       territory: 'MI, IN, OH, PA',                    region: null },
      { name: 'Roshan Dave',           territory: 'New York State',                     region: null },
      { name: 'Mark Hoffman',          territory: 'New York City, CT, MA, NH, ME',      region: null },
      { name: 'Demetrius Bell Jr',     territory: 'TX, LA',                             region: null },
      { name: 'Mark James',            territory: 'WI, IL',                             region: null },
      { name: 'Armada Veraepalli',     territory: 'WA, OR, ID, MT, ND, SD, MN',       region: null },
      { name: 'John Haschke',          territory: 'Northern California',               region: null },
      { name: 'Jacob Kim',             territory: 'NE, KS, OK, IA, MO, AR',           region: null },
      { name: 'Lydia Zhong',           territory: 'NV, UT, CO, WY, AZ, NM',           region: null },
      { name: 'Sydney Chin',           territory: null,                                region: null },
    ],
  },
  {
    id:          'tss',
    manager:     'Rob Mason',
    title:       'TSS Manager',
    product:     null,
    market:      'Comms / Distribution',
    products:    [],
    accentColor: '#4589ff', // IBM blue
    members: [
      { name: 'Ryan Hlinegarder', territory: 'NY, NJ, PA',                              region: null },
      { name: 'Ross Holley',      territory: 'ME, NH, MA, CT, RI',                       region: null },
      { name: 'Chloe Cree',       territory: 'MI, IN, OH',                               region: null },
      { name: 'Negusu Mulu',      territory: 'WI, IL',                                   region: null },
      { name: 'Jackson France',   territory: 'VA, WV, KY, TN, NC, SC, MD, DC, DE',      region: null },
      { name: 'Rick Morse',       territory: 'FL, GA, AL, MS',                           region: null },
      { name: 'Luke Chandler',    territory: 'California',                               region: null },
      { name: 'Archit Myadam',    territory: 'ND, SD, NE, KS, OK, MN, IA, MO, AR',     region: null },
      { name: 'Hayden King',      territory: 'NV, UT, CO, WY, AZ, NM, TX, LA',         region: null },
      { name: 'Jason Grant',      territory: 'WA, OR, ID, MT, AK, HI',                  region: null },
    ],
  },
  {
    id:          'bts',
    manager:     'Adrian Meghoo',
    title:       'BTS Manager',
    product:     'Storage',
    market:      null,
    products:    ['Storage'],
    accentColor: '#4589ff', // IBM blue
    members: [
      { name: 'David Masefield',  territory: 'NY, PA, NJ, CT, MA, NH, VT, ME, RI',                                          region: 'Northeast'        },
      { name: 'Jeff Anderson',    territory: 'VA, WV, KY, TN, NC, SC, GA, AL, MS, FL',                                       region: 'Southeast'        },
      { name: 'Jeff Gillespie',   territory: 'ND, SD, NE, KS, OK, MN, IA, MO, WI, IL, IN, MI, OH, AR',                      region: 'Central / Midwest' },
      { name: 'Roy Peek',         territory: 'WA, OR, CA, NV, ID, MT, WY, UT, CO, AZ, NM, TX, LA, AK, HI',                  region: 'West & Southwest' },
    ],
  },
  {
    id:          'mgr',
    manager:     'Darryl Pope',
    title:       'SDR Manager',
    product:     null,
    market:      null,
    products:    [],
    accentColor: '#4589ff', // IBM blue
    members: [
      { name: 'Adam Ezzaoudi',       territory: null, region: null },
      { name: 'Adiel Dereje',        territory: null, region: null },
      { name: 'Amber Jamison',       territory: null, region: null },
      { name: 'Beneal Kenea',        territory: null, region: null },
      { name: 'Gabrielle Singleton', territory: null, region: null },
      { name: 'Hasnain Sheikh',      territory: null, region: null },
      { name: 'Hayley Westendick',   territory: null, region: null },
      { name: 'Jasen Louis',         territory: null, region: null },
      { name: 'Joseph Esfandiari',   territory: null, region: null },
      { name: 'Kaylin Brandon',      territory: null, region: null },
      { name: 'Matthew McIntyre',    territory: null, region: null },
      { name: 'Wesley Toomer',       territory: null, region: null },
    ],
  },
];

/**
 * BTSS ↔ TSS territory pairings.
 * Derived from overlapping state coverage.
 * label: short region name shown on the connecting line.
 */
const PAIRINGS = [
  { btss: 'Roshan Dave',       tss: 'Ryan Hlinegarder', label: 'New York / NJ / PA'   },
  { btss: 'Mark Hoffman',      tss: 'Ross Holley',       label: 'New England'          },
  { btss: 'Tyler Reinsmith',   tss: 'Chloe Cree',        label: 'Great Lakes'          },
  { btss: 'Mark James',        tss: 'Negusu Mulu',       label: 'WI / IL'              },
  { btss: 'Jette Jones',       tss: 'Jackson France',    label: 'Carolinas / Appalachia' },
  { btss: 'Morgan McKeithan',  tss: 'Jackson France',    label: 'Mid-Atlantic'         },
  { btss: 'Emmanuel Garit',    tss: 'Rick Morse',        label: 'Florida / Southeast'  },
  { btss: 'John Tatum',        tss: 'Luke Chandler',     label: 'S. California'        },
  { btss: 'John Haschke',      tss: 'Luke Chandler',     label: 'N. California'        },
  { btss: 'Demetrius Bell Jr', tss: 'Hayden King',       label: 'Texas / Louisiana'    },
  { btss: 'Jacob Kim',         tss: 'Archit Myadam',     label: 'Plains'               },
  { btss: 'Lydia Zhong',       tss: 'Hayden King',       label: 'Mountain West'        },
  { btss: 'Armada Veraepalli', tss: 'Jason Grant',       label: 'Pacific Northwest'    },
];

function emailFor(name) {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.') + '@ibm.com';
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ROW_SIZE = 4;

// ── Notes persistence ─────────────────────────────────────────────
const NOTES_KEY = 'ibm_hive_team_notes_v1';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; }
}
function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function formatNoteDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return ''; }
}

// ── View state ──────────────────────────────────────────────────
let _activeView = 'list'; // 'list' | 'hive' | 'pairings'

// ── Entry ─────────────────────────────────────────────────────────
export async function renderSeller(container) {
  container.innerHTML = `
    <div class="mt-page">
      <div class="mt-team-header">
        <div class="mt-team-header-left">
          <div class="mt-team-org">${ORG_META.name}</div>
          <div class="mt-team-seg">${ORG_META.segment}</div>
        </div>
        <div class="mt-view-btns" id="mtViewBtns">
          <button class="mt-view-btn active" data-view="list">List</button>
          <button class="mt-view-btn" data-view="hive">Hive</button>
          <button class="mt-view-btn" data-view="pairings">Pairings</button>
        </div>
      </div>
      <div id="mtBody" class="mt-body-wrap"></div>
    </div>
  `;

  document.getElementById('mtViewBtns').addEventListener('click', e => {
    const btn = e.target.closest('.mt-view-btn');
    if (!btn) return;
    document.querySelectorAll('.mt-view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _activeView = btn.dataset.view;
    renderBody();
  });

  renderBody();
}

function renderBody() {
  const body = document.getElementById('mtBody');
  if (!body) return;
  if (_activeView === 'list') {
    body.innerHTML = listViewHtml();
    wireListView(body);
  } else if (_activeView === 'hive') {
    body.innerHTML = hiveViewHtml(); wireHiveView();
  } else {
    body.innerHTML = pairingsViewHtml(); wirePairingsView();
  }
}

// ═══════════════════════════════════════════════════════════════
// List View
// ═══════════════════════════════════════════════════════════════
function listViewHtml() {
  return `<div class="mt-team-body">${MANAGER_GROUPS.map(g => renderGroup(g)).join('')}</div>`;
}

function wireListView(body) {
  body.querySelectorAll('.mt-member-row[data-group]').forEach(el => {
    el.addEventListener('click', () => {
      const g = MANAGER_GROUPS.find(x => x.id === el.dataset.group);
      if (!g) return;
      body.querySelectorAll('.mt-member-row').forEach(r => r.classList.remove('mt-member-selected'));
      el.classList.add('mt-member-selected');

      // Inject detail panel alongside the list body
      let panel = document.getElementById('mtListDetail');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'mtListDetail';
        panel.className = 'mt-detail-panel';
        panel.style.display = 'flex';
        // Insert it as sibling inside mt-body-wrap
        const wrap = document.getElementById('mtBody');
        if (wrap) wrap.style.flexDirection = 'row';
        wrap?.appendChild(panel);
      }
      panel.style.display = 'flex';

      const idx = parseInt(el.dataset.idx, 10);
      const member = g.members[idx];
      showListDetail(member, g, panel, () => {
        panel.style.display = 'none';
        body.querySelectorAll('.mt-member-row').forEach(r => r.classList.remove('mt-member-selected'));
      });
    });
  });
}

function renderGroup(g) {
  const metaParts = [...new Set([
    g.market  ? g.market  : null,
    g.product ? g.product : null,
    ...(g.products && g.products.length ? g.products : []),
  ].filter(Boolean))];

  const memberRows = g.members.map((m, idx) => {
    const isSydney = m.name === 'Sydney Chin';
    const metaLine = [m.region, m.territory].filter(Boolean).join(' — ');
    return `
      <div class="mt-member-row${isSydney ? ' mt-member-me' : ''}" data-group="${g.id}" data-idx="${idx}" style="cursor:pointer">
        <div class="mt-member-name">${m.name}${isSydney ? ' <span class="mt-member-you">you</span>' : ''}</div>
        ${metaLine ? `<div class="mt-member-meta-line">${esc(metaLine)}</div>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="mt-group" data-group-id="${g.id}">
      <div class="mt-group-header" style="border-left-color:${g.accentColor}">
        <div class="mt-group-manager">
          <div class="mt-group-name">${g.manager}</div>
          <div class="mt-group-title" style="color:${g.accentColor}">${g.title}</div>
          ${metaParts.length ? `<div class="mt-group-meta">${metaParts.map(esc).join(' · ')}</div>` : ''}
          <div class="mt-group-count">${g.members.length} ${g.members.length === 1 ? 'report' : 'reports'}</div>
        </div>
      </div>
      <div class="mt-member-list">${memberRows}</div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════
// Hive View
// ═══════════════════════════════════════════════════════════════
function hiveViewHtml() {
  return `
    <div class="mt-hive-layout">
      <div class="mt-hive-area" id="mtHiveArea">
        ${MANAGER_GROUPS.map(g => renderCluster(g)).join('')}
      </div>
      <div class="mt-detail-panel" id="mtDetail" style="display:none"></div>
    </div>
  `;
}

function hexHtml(name, opts) {
  const { color, isManager, key } = opts;
  return `
    <div class="mth-hex-wrap${isManager ? ' mth-hex-manager' : ''}" data-member-key="${key}"
         style="background:${color}">
      <div class="mth-hex">
        <div class="mth-hex-name">${esc(name)}</div>
      </div>
    </div>`;
}

function hexColor(name) {
  return name === 'Sydney Chin' ? '#a855f7' : 'rgba(255,255,255,0.70)';
}

function renderCluster(g) {
  const managerRow = `
    <div class="mth-manager-row">
      ${hexHtml(g.manager, { color: hexColor(g.manager), isManager: true, key: `${g.id}:manager` })}
    </div>`;

  const rows = [];
  for (let i = 0; i < g.members.length; i += ROW_SIZE) {
    rows.push(g.members.slice(i, i + ROW_SIZE));
  }
  const memberRowsHtml = rows.map(row => `
    <div class="mth-hex-row" style="justify-content:center">
      ${row.map(m => {
        const key = `${g.id}:${g.members.indexOf(m)}`;
        return hexHtml(m.name, { color: hexColor(m.name), isManager: false, key });
      }).join('')}
    </div>`).join('');

  const meta = [g.product ? `Product: ${g.product}` : null, g.market ? `Market: ${g.market}` : null]
    .filter(Boolean).join(' · ');

  // Product pills for BTSS cluster
  const productPills = (g.products && g.products.length)
    ? `<div class="mt-product-pills mth-cluster-products">${g.products.map(p => `<span class="mt-product-pill">${esc(p)}</span>`).join('')}</div>`
    : '';

  return `
    <div class="mth-cluster">
      <div class="mth-cluster-label" style="color:${g.accentColor}">
        ${esc(g.manager)} · ${esc(g.title)}${meta ? ` <span class="mth-cluster-meta">— ${meta}</span>` : ''}
      </div>
      ${productPills}
      ${managerRow}
      <div class="mth-cluster-hexes">
        ${memberRowsHtml}
      </div>
    </div>`;
}

function wireHiveView() {
  const area = document.getElementById('mtHiveArea');
  if (!area) return;
  area.querySelectorAll('[data-member-key]').forEach(el => {
    el.addEventListener('click', () => {
      area.querySelectorAll('[data-member-key]').forEach(o => o.classList.remove('mth-selected'));
      el.classList.add('mth-selected');
      showMemberDetail(el.dataset.memberKey);
    });
  });
}

function closeDetailPanel() {
  const panel = document.getElementById('mtDetail');
  const area  = document.getElementById('mtHiveArea');
  if (panel) panel.style.display = 'none';
  if (area)  area.querySelectorAll('[data-member-key]').forEach(o => o.classList.remove('mth-selected'));
}

function showMemberDetail(key) {
  const panel = document.getElementById('mtDetail');
  if (!panel) return;

  const [groupId, rest] = key.split(':');
  const g = MANAGER_GROUPS.find(x => x.id === groupId);
  if (!g) return;

  const isManager = rest === 'manager';
  const member = isManager ? { name: g.manager, territory: null, region: null } : g.members[Number(rest)];

  panel.style.display = 'flex';
  renderMemberPanel(member, g, isManager, panel, closeDetailPanel);
}

function showListDetail(member, g, panel, onClose) {
  renderMemberPanel(member, g, false, panel, onClose);
}

function renderMemberPanel(member, g, isManager, panel, onClose) {
  const isYou  = member.name === 'Sydney Chin';
  const email  = emailFor(member.name);
  const noteKey = `${g.id}:${member.name}`;
  const allNotes = loadNotes();
  const notes  = allNotes[noteKey] || [];

  panel.innerHTML = `
    <div class="mt-dp-close" id="mtDpCloseBtn">✕</div>
    <div class="mt-dp-content">
      <div class="mt-dp-name">${esc(member.name)}${isYou ? ' <span class="mt-dp-you-badge">You</span>' : ''}</div>
      <div class="mt-dp-role" style="color:${g.accentColor}">${isManager ? g.title : `Reports to ${g.manager}`}</div>

      ${!isManager ? mtRow('Team', `${g.manager} — ${g.title}`) : ''}
      ${member.region ? mtRow('Region', member.region) : ''}
      ${member.territory ? mtRow('Territory', member.territory) : ''}
      ${mtRow('Email', `<a class="mt-dp-link" href="mailto:${email}">${email}</a>`)}

      <div class="mt-dp-row">
        <div class="mt-dp-label">Notes</div>
        <div id="mtDpNotesList" class="mt-notes-list">
          ${notes.length === 0
            ? `<div class="mt-notes-empty">No notes yet.</div>`
            : notes.slice().reverse().map(n => `
                <div class="mt-note-item">
                  <div class="mt-note-text">${esc(n.text)}</div>
                  <div class="mt-note-date">${formatNoteDate(n.date)}</div>
                </div>`).join('')}
        </div>
        <div class="mt-note-input-row">
          <input class="mt-note-input" id="mtNoteInput" type="text" placeholder="Add a note…"/>
          <button class="mt-note-submit" id="mtNoteAdd">Add</button>
        </div>
      </div>
    </div>`;

  document.getElementById('mtDpCloseBtn').addEventListener('click', onClose);

  const addNote = () => {
    const inp  = document.getElementById('mtNoteInput');
    const text = inp?.value.trim();
    if (!text) return;
    const all = loadNotes();
    const arr = all[noteKey] || [];
    arr.push({ text, date: new Date().toISOString() });
    all[noteKey] = arr;
    saveNotes(all);
    renderMemberPanel(member, g, isManager, panel, onClose);
  };
  document.getElementById('mtNoteAdd')?.addEventListener('click', addNote);
  document.getElementById('mtNoteInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') addNote(); });
}

// ═══════════════════════════════════════════════════════════════
// Pairings View — SVG showing BTSS↔TSS territory pairs
// ═══════════════════════════════════════════════════════════════

function pairingsViewHtml() {
  return `
    <div class="mt-pairings-page">
      <div class="mt-pairings-canvas" id="mtPairingsCanvas"></div>
    </div>`;
}

function wirePairingsView() {
  const canvas = document.getElementById('mtPairingsCanvas');
  if (!canvas) return;

  const btssGroup = MANAGER_GROUPS.find(g => g.id === 'btss');
  const tssGroup  = MANAGER_GROUPS.find(g => g.id === 'tss');

  // Collect unique BTSS and TSS names that appear in pairings
  const btssNames = [...new Set(PAIRINGS.map(p => p.btss))];
  const tssNames  = [...new Set(PAIRINGS.map(p => p.tss))];

  // Layout constants
  const CARD_W    = 220;
  const CARD_H    = 68;
  const CARD_GAP  = 18;
  const COL_PAD   = 48;
  const TOP_PAD   = 32;
  const LABEL_H   = 28;   // space above first card for column header

  const leftCount  = btssNames.length;
  const rightCount = tssNames.length;
  const maxCount   = Math.max(leftCount, rightCount);

  const svgH = TOP_PAD + LABEL_H + maxCount * (CARD_H + CARD_GAP) + 32;
  const svgW = COL_PAD * 2 + CARD_W * 2 + 160; // 160px gap between columns

  const leftX  = COL_PAD;
  const rightX = svgW - COL_PAD - CARD_W;
  const midX   = leftX + CARD_W;
  const midXR  = rightX;

  // Y position for each name's card center
  function cardCY(i) {
    return TOP_PAD + LABEL_H + i * (CARD_H + CARD_GAP) + CARD_H / 2;
  }

  const btssY = Object.fromEntries(btssNames.map((n, i) => [n, cardCY(i)]));
  const tssY  = Object.fromEntries(tssNames.map((n, i) => [n, cardCY(i)]));

  // Build SVG
  let lines = '';
  PAIRINGS.forEach(p => {
    const y1 = btssY[p.btss];
    const y2 = tssY[p.tss];
    const lmx = midX + (midXR - midX) / 2;
    const lmy = (y1 + y2) / 2;
    lines += `
      <path d="M ${midX} ${y1} C ${lmx} ${y1}, ${lmx} ${y2}, ${midXR} ${y2}"
        stroke="rgba(255,255,255,0.55)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  });

  // Column headers
  const headers = `
    <text x="${leftX + CARD_W / 2}" y="${TOP_PAD + 18}" text-anchor="middle"
      fill="#4589ff" font-size="12" font-weight="600" font-family="IBM Plex Sans,system-ui,sans-serif">BTSS</text>
    <text x="${rightX + CARD_W / 2}" y="${TOP_PAD + 18}" text-anchor="middle"
      fill="#4589ff" font-size="12" font-weight="600" font-family="IBM Plex Sans,system-ui,sans-serif">TSS</text>`;

  // BTSS cards
  let btssCards = '';
  btssNames.forEach((name, i) => {
    const cy = cardCY(i);
    const y  = cy - CARD_H / 2;
    const member = btssGroup.members.find(m => m.name === name);
    const isYou  = name === 'Sydney Chin';
    const terr   = member?.territory || '';
    btssCards += `
      <g class="mt-pair-card" data-key="btss:${btssGroup.members.indexOf(member)}" style="cursor:pointer">
        <rect x="${leftX}" y="${y}" width="${CARD_W}" height="${CARD_H}"
          rx="0" fill="#161616" stroke="rgba(255,255,255,0.7)" stroke-width="${isYou ? 2 : 1}"/>
        <text x="${leftX + 12}" y="${y + 24}" fill="${isYou ? '#a855f7' : '#f4f4f4'}"
          font-size="13" font-weight="${isYou ? 600 : 400}" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(name)}${isYou ? ' ★' : ''}</text>
        <text x="${leftX + 12}" y="${y + 46}" fill="rgba(255,255,255,0.45)"
          font-size="12" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(terr || '—')}</text>
      </g>`;
  });

  // TSS cards
  let tssCards = '';
  tssNames.forEach((name, i) => {
    const cy = cardCY(i);
    const y  = cy - CARD_H / 2;
    const member = tssGroup.members.find(m => m.name === name);
    const terr   = member?.territory || '';
    tssCards += `
      <g class="mt-pair-card" data-key="tss:${tssGroup.members.indexOf(member)}" style="cursor:pointer">
        <rect x="${rightX}" y="${y}" width="${CARD_W}" height="${CARD_H}"
          rx="0" fill="#161616" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        <text x="${rightX + 12}" y="${y + 24}" fill="#f4f4f4"
          font-size="13" font-weight="400" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(name)}</text>
        <text x="${rightX + 12}" y="${y + 46}" fill="rgba(255,255,255,0.45)"
          font-size="12" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(terr || '—')}</text>
      </g>`;
  });

  canvas.innerHTML = `
    <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;margin:0 auto;">
      <g>${lines}</g>
      ${headers}
      <g>${btssCards}</g>
      <g>${tssCards}</g>
    </svg>`;

  // Click card → open detail panel (reuse hive detail logic)
  canvas.querySelectorAll('.mt-pair-card').forEach(el => {
    el.addEventListener('click', () => {
      // Inject a temporary detail panel into pairings page
      let panel = document.getElementById('mtPairDetail');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'mtPairDetail';
        panel.className = 'mt-detail-panel';
        panel.style.cssText = 'position:fixed;top:64px;right:0;height:calc(100vh - 64px);display:flex;';
        document.body.appendChild(panel);
      }
      showPairDetail(el.dataset.key, panel);
    });
  });
}

function showPairDetail(key, panel) {
  const [groupId, rest] = key.split(':');
  const g = MANAGER_GROUPS.find(x => x.id === groupId);
  if (!g) return;

  const member = g.members[Number(rest)];
  if (!member) return;

  panel.style.display = 'flex';
  renderMemberPanel(member, g, false, panel, () => { panel.style.display = 'none'; });
}

// ── Shared helpers ────────────────────────────────────────────────
function mtRow(label, value) {
  return `
    <div class="mt-dp-row">
      <div class="mt-dp-label">${label}</div>
      <div class="mt-dp-value">${value}</div>
    </div>`;
}
