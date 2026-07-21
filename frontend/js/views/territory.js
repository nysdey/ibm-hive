/**
 * territory.js — Territory Coverage (inside My Team)
 *
 * An interactive US map that shows whose territory is whose, drawn in the
 * isometric IBM style: every state is a real geographic shape (Albers USA)
 * lifted off a dark board with an extruded base, coloured by the rep who owns it.
 *
 *  • One map per market type; manager and role coverage can overlap.
 *  • Click a state to see every person assigned to that territory.
 *  • Coverage is edited from My Team's List view; this map stays read-only.
 *  • Everything saves per-user, per-market (server-side, key `territory_coverage_v1`).
 */

import { US_PATHS, US_CENTROIDS, US_VIEWBOX } from './us-geo.js';
import { TERRITORY_VIEWS, TERRITORY_TILES, TERRITORY_TILE_NAMES } from './territory-data.js';
import { getStore, saveStore, getToken } from '../api.js';

const STORE_KEY = 'territory_coverage_v1';       // server key (when logged in)
const LOCAL_KEY = 'ibm_hive_territory_v1';        // localStorage key (login-less)
const DEPTH = 7; // isometric lift, px

// IBM Carbon-inspired palette limited to gray, blue, and purple. It is ordered
// so neighbouring coverage groups remain distinct without introducing extra
// accent colours.
const IBM_PALETTE = [
  '#0f62fe', // blue 60
  '#8a3ffc', // purple 60
  '#525252', // gray 70
  '#4589ff', // blue 50
  '#a56eff', // purple 50
  '#6f6f6f', // gray 60
  '#0043ce', // blue 70
  '#be95ff', // purple 40
  '#393939', // gray 80
  '#78a9ff', // blue 40
  '#6929c4', // purple 70
  '#8d8d8d', // gray 50
  '#002d9c', // blue 80
  '#491d8b', // purple 80
  '#262626', // gray 90
  '#d0e2ff', // blue 20
  '#d4bbff', // purple 20
  '#a8a8a8', // gray 40
];

// ── Working state ─────────────────────────────────────────────────
let _views     = [];        // working copy (presets, possibly overridden by saved edits)
let _viewId    = null;
let _selState  = null;      // state used to show territory details
let _container = null;
let _saveTimer = null;
let _detailsCollapsed = false;

// ── Load / save ───────────────────────────────────────────────────
function marketId(market) {
  return 'market-' + market.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Merge manager/product slices into one map for each market type. */
function clonePresets() {
  const markets = new Map();
  TERRITORY_VIEWS.forEach(source => {
    if (!markets.has(source.market)) {
      markets.set(source.market, {
        id: marketId(source.market),
        market: source.market,
        role: 'Market Coverage',
        managers: [],
        reps: [],
      });
    }
    const view = markets.get(source.market);
    if (!view.managers.includes(source.manager)) view.managers.push(source.manager);
    source.reps.forEach(rep => {
      view.reps.push({
        ...rep,
        states: [...rep.states],
        sourceId: source.id,
        sourceManager: source.manager,
        sourceRole: source.role,
      });
    });
  });

  return [...markets.values()].map(view => ({
    ...view,
    manager: view.managers.join(' · '),
    reps: view.reps.map((rep, i) => ({ ...rep, color: IBM_PALETTE[i % IBM_PALETTE.length] })),
  }));
}

/** Overlay saved state assignments onto the presets (matched by rep name). */
function reconcile(saved) {
  const presets = clonePresets();
  if (!saved || !Array.isArray(saved.views)) return presets;
  const savedStates = new Map();
  saved.views.forEach(view => {
    (view.reps || []).forEach(rep => {
      if (!Array.isArray(rep.states)) return;
      savedStates.set(`${view.market || ''}::${rep.name}`, rep.states);
      // Supports data saved by the older per-manager view model.
      savedStates.set(rep.name, rep.states);
    });
  });
  return presets.map(p => {
    const merged = {
      ...p,
      reps: p.reps.map(r => ({
        ...r,
        states: savedStates.has(`${p.market}::${r.name}`)
          ? [...savedStates.get(`${p.market}::${r.name}`)]
          : savedStates.has(r.name) ? [...savedStates.get(r.name)] : r.states,
      })),
    };
    const savedView = saved.views.find(v => v.market === p.market || v.id === p.id);
    (savedView?.reps || []).forEach(rep => {
      if (!rep.sourceId || !(rep.states || []).length || merged.reps.some(r => r.sourceId === rep.sourceId && r.name === rep.name)) return;
      merged.reps.push({ ...rep, states: [...(rep.states || [])] });
    });
    return merged;
  });
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function writeLocal(saved) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(saved)); } catch {}
}

function territoryCodes(value) {
  const text = String(value || '');
  const codes = text.match(/\b[A-Z]{2}\b/g) || [];
  if (/New York/i.test(text)) codes.push('NY');
  if (/California/i.test(text)) codes.push('CA');
  return [...new Set(codes)].filter(code => US_PATHS[code] || TERRITORY_TILES.includes(code));
}

/** Called by My Team List view whenever a bee's coverage changes. */
export function updateTerritoryCoverage(sourceId, oldName, person) {
  if (!sourceId || !oldName) return;
  const views = reconcile(readLocal());
  const view = views.find(v => v.reps.some(r => r.sourceId === sourceId));
  if (!view) return;
  const existing = view.reps.find(r => r.sourceId === sourceId && r.name === oldName);
  const states = territoryCodes(person?.territory);
  if (existing && person?.name !== oldName) {
    existing.states = [];
    view.reps.push({ ...existing, name: person.name, states });
  } else if (existing) {
    existing.states = states;
  } else if (person?.name) {
    const source = TERRITORY_VIEWS.find(v => v.id === sourceId);
    view.reps.push({
      name: person.name, states, sub: null, sourceId,
      sourceManager: source?.manager || '', sourceRole: source?.role || '', color: '#4589ff',
    });
  }
  const saved = { views };
  writeLocal(saved);
  if (getToken()) saveStore(STORE_KEY, saved).catch(() => {});
}

export function removeTerritoryCoverage(sourceId, name) {
  updateTerritoryCoverage(sourceId, name, { name, territory: '' });
}

async function loadViews() {
  // Prefer the server when signed in; otherwise (login disabled) use localStorage.
  if (getToken()) {
    try {
      const res = await getStore(STORE_KEY);
      if (res && res.data) return reconcile(res.data);
    } catch (e) {
      console.warn('Could not load territory coverage from server:', e.message);
    }
  }
  return reconcile(readLocal());
}

function scheduleSave() {
  writeLocal({ views: _views });               // always cache locally
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    if (!getToken()) return;                    // login-less: localStorage only
    try { await saveStore(STORE_KEY, { views: _views }); }
    catch (e) { console.warn('Could not save territory coverage to server:', e.message); }
  }, 500);
}

// ── Colour helpers ────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
function darken(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}
function textOn(hex) {
  const [r, g, b] = hexToRgb(hex);
  // relative luminance
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? '#1a1a1a' : '#ffffff';
}

const NEUTRAL = '#2b2b2b';

// ── Model accessors ───────────────────────────────────────────────
function activeView() { return _views.find(v => v.id === _viewId) || _views[0]; }

/** state code -> overlapping assignments + a stable territory color. */
function assignmentMap() {
  const map = {};
  const v = activeView();
  if (!v) return map;
  v.reps.forEach(rep => rep.states.forEach(code => {
    if (!map[code]) map[code] = { members: [] };
    map[code].members.push(rep);
  }));

  const colors = new Map();
  Object.values(map).forEach(assignment => {
    assignment.members.sort((a, b) => a.name.localeCompare(b.name));
    assignment.signature = assignment.members.map(rep => rep.name).join('|');
    if (!colors.has(assignment.signature)) {
      colors.set(assignment.signature, IBM_PALETTE[colors.size % IBM_PALETTE.length]);
    }
    assignment.color = colors.get(assignment.signature);
  });
  return map;
}

// ── Entry ─────────────────────────────────────────────────────────
export async function renderTerritory(container) {
  _container = container;
  container.innerHTML = `<div class="tc-loading">Loading coverage…</div>`;

  _views = await loadViews();
  if (!_viewId || !_views.some(v => v.id === _viewId)) _viewId = _views[0]?.id || null;

  renderShell();
}

function renderShell() {
  const v = activeView();
  _container.innerHTML = `
    <div class="tc-page">
      <div class="tc-toolbar">
        <div class="tc-toolbar-left">
          <select class="tc-view-select" id="tcViewSelect">
            ${_views.map(x => `<option value="${x.id}"${x.id === _viewId ? ' selected' : ''}>${esc(x.market)} Market</option>`).join('')}
          </select>
          <div class="tc-view-meta">
            <span class="tc-view-role">${v.reps.filter(rep => rep.states.length).length} coverage assignments</span>
            <span class="tc-view-market">${v.managers.length} ${v.managers.length === 1 ? 'manager' : 'managers'}</span>
          </div>
        </div>
        <div class="tc-toolbar-right"><span class="tc-readonly-note">Edit coverage in List view</span></div>
      </div>

      <div class="tc-main${_detailsCollapsed ? ' detail-collapsed' : ''}" id="tcMain">
        <div class="tc-map-wrap" id="tcMapWrap">
          ${mapSvg()}
          ${territoryTiles()}
        </div>
        <button class="tc-detail-toggle" id="tcDetailToggle" title="Toggle detail panel">${_detailsCollapsed ? '❬' : '❭'}</button>
        <div class="tc-legend" id="tcLegend">${legendHtml()}</div>
      </div>

      <div class="tc-tooltip" id="tcTooltip" hidden></div>
    </div>
  `;

  wire();
}

// ── Map SVG (isometric extruded states) ──────────────────────────
function mapSvg() {
  const { w, h } = US_VIEWBOX;
  const amap = assignmentMap();
  const abbrs = Object.keys(US_PATHS);

  const selectedSignature = _selState ? amap[_selState]?.signature : null;
  const dimmed = (code) => {
    if (selectedSignature) return amap[code]?.signature !== selectedSignature;
    return false;
  };

  // Pass 1: extruded bases (drawn first so tops sit above neighbours' shadows)
  const bases = abbrs.map(code => {
    const fill = amap[code] ? amap[code].color : NEUTRAL;
    const op = dimmed(code) ? 0.12 : 1;
    return `<path d="${US_PATHS[code]}" transform="translate(0,${DEPTH})"
      fill="${darken(fill, 0.5)}" opacity="${op}"/>`;
  }).join('');

  // Pass 2: top faces + labels
  const tops = abbrs.map(code => {
    const a = amap[code];
    const fill = a ? a.color : NEUTRAL;
    const op = dimmed(code) ? 0.18 : 1;
    const c = US_CENTROIDS[code];
    const label = c
      ? `<text x="${c[0]}" y="${c[1]}" text-anchor="middle" dominant-baseline="central"
          font-size="11" font-weight="600" fill="${a ? textOn(fill) : '#6a6a6a'}"
          font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${code}</text>`
      : '';
    return `<g class="tc-state" data-abbr="${code}" opacity="${op}" style="cursor:pointer">
      <path d="${US_PATHS[code]}" fill="${fill}" stroke="rgba(0,0,0,0.35)" stroke-width="0.75"/>
      ${label}
    </g>`;
  }).join('');

  return `<svg class="tc-svg" viewBox="0 -2 ${w} ${h + DEPTH + 4}" xmlns="http://www.w3.org/2000/svg">
    <g class="tc-bases">${bases}</g>
    <g class="tc-tops">${tops}</g>
  </svg>`;
}

// ── Territory inset tiles (PR / GU / MP / AS / VI) ────────────────
function territoryTiles() {
  const amap = assignmentMap();
  return `<div class="tc-territories">
    ${TERRITORY_TILES.map(code => {
      const a = amap[code];
      const fill = a ? a.color : NEUTRAL;
      const selectedSignature = _selState ? amap[_selState]?.signature : null;
      const dim = selectedSignature && a?.signature !== selectedSignature;
      return `<div class="tc-terr-tile${dim ? ' tc-dim' : ''}" data-abbr="${code}" title="${esc(TERRITORY_TILE_NAMES[code] || code)}">
        <span class="tc-terr-hex" style="background:${fill};border-bottom-color:${darken(fill, 0.5)};color:${a ? textOn(fill) : '#6a6a6a'}">${code}</span>
        <span class="tc-terr-name">${esc(TERRITORY_TILE_NAMES[code] || code)}</span>
      </div>`;
    }).join('')}
  </div>`;
}

// ── Legend ────────────────────────────────────────────────────────
function legendHtml() {
  const v = activeView();
  const amap = assignmentMap();

  if (!_selState || !amap[_selState]) {
      const territoryCount = new Set(Object.values(amap).map(a => a.signature)).size;
      return `
        <div class="tc-legend-title">Territory Details</div>
        <div class="tc-territory-empty">
          <strong>${esc(v.market)} Market</strong>
          <span>${territoryCount} overlapping territories</span>
          <span>Click a state or territory to see everyone covering it.</span>
        </div>`;
  }

    const selected = amap[_selState];
    const matchingStates = Object.entries(amap)
      .filter(([, assignment]) => assignment.signature === selected.signature)
      .map(([code]) => code);
    const territoryLabel = matchingStates.map(code => STATE_NAMES[code] || TERRITORY_TILE_NAMES[code] || code).join(', ');

  return `
      <div class="tc-legend-title">Territory Details</div>
      <div class="tc-territory-detail">
        <div class="tc-territory-heading">${esc(territoryLabel)}</div>
        <div class="tc-territory-code">${matchingStates.join(' · ')}</div>
        <div class="tc-territory-people-title">Coverage Team</div>
        ${selected.members.map(rep => `
          <div class="tc-territory-person">
            <span class="tc-swatch" style="background:${selected.color};border-bottom-color:${darken(selected.color, 0.5)}"></span>
            <span class="tc-legend-text">
              <span class="tc-legend-name">${esc(rep.name)}</span>
              <span class="tc-legend-sub">${esc(rep.sourceRole)} · ${esc(rep.sourceManager)}</span>
              ${rep.sub ? `<span class="tc-legend-sub tc-territory-sub">${esc(rep.sub)}</span>` : ''}
            </span>
          </div>`).join('')}
      </div>`;
}

// ── Wiring ────────────────────────────────────────────────────────
function wire() {
  document.getElementById('tcDetailToggle')?.addEventListener('click', () => {
    _detailsCollapsed = !_detailsCollapsed;
    document.getElementById('tcMain')?.classList.toggle('detail-collapsed',_detailsCollapsed);
    document.getElementById('tcDetailToggle').textContent = _detailsCollapsed ? '❬' : '❭';
  });
  document.getElementById('tcViewSelect').addEventListener('change', e => {
    _viewId = e.target.value;
    _selState = null;
    renderShell();
  });

  const wrap = document.getElementById('tcMapWrap');

  // Click a state / territory
  wrap.addEventListener('click', e => {
    const el = e.target.closest('[data-abbr]');
    if (!el) {
      // Clicking the empty canvas returns the map to its complete overview.
      if (_selState) {
        _selState = null;
        renderShell();
      }
      return;
    }
    const code = el.dataset.abbr;
    _selState = _selState === code ? null : code;
    if (_selState) _detailsCollapsed = false;
    renderShell();
  });

  // Hover tooltip
  const tip = document.getElementById('tcTooltip');
  wrap.addEventListener('mousemove', e => {
    const el = e.target.closest('[data-abbr]');
    if (!el) { tip.hidden = true; return; }
    const code = el.dataset.abbr;
    const a = assignmentMap()[code];
    const name = STATE_NAMES[code] || TERRITORY_TILE_NAMES[code] || code;
    const people = a?.members.map(rep => rep.sub || rep.name).join(' · ');
    tip.innerHTML = `<strong>${esc(name)}</strong>${people ? ` · ${esc(people)}` : ' · Unassigned'}`;
    const r = _container.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left + 14) + 'px';
    tip.style.top  = (e.clientY - r.top + 14) + 'px';
    tip.hidden = false;
  });
  wrap.addEventListener('mouseleave', () => { tip.hidden = true; });
}

// ── Util ──────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',DC:'Washington, D.C.',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',
  IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
};
