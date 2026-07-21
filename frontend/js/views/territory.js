/**
 * territory.js — Territory Coverage (inside My Team)
 *
 * An interactive US map that shows whose territory is whose, drawn in the
 * isometric IBM style: every state is a real geographic shape (Albers USA)
 * lifted off a dark board with an extruded base, coloured by the rep who owns it.
 *
 *  • Switch between coverage "views" (manager / market / product slices).
 *  • Click a rep in the legend to spotlight their territory.
 *  • Toggle Edit to re-assign states: pick a rep, then click states/territories.
 *  • Everything saves per-user, per-view (server-side, key `territory_coverage_v1`).
 */

import { US_PATHS, US_CENTROIDS, US_VIEWBOX } from './us-geo.js';
import { TERRITORY_VIEWS, TERRITORY_TILES, TERRITORY_TILE_NAMES } from './territory-data.js';
import { getStore, saveStore, getToken } from '../api.js';

const STORE_KEY = 'territory_coverage_v1';       // server key (when logged in)
const LOCAL_KEY = 'ibm_hive_territory_v1';        // localStorage key (login-less)
const DEPTH = 7; // isometric lift, px

// IBM Carbon palette — magenta / purple / blue / cyan (+ teal for headroom),
// ordered so neighbouring reps in a legend land on distinct hues. Rep colours
// are assigned from this list by index, so every view stays on-brand.
const IBM_PALETTE = [
  '#0f62fe', // blue 60
  '#ee5396', // magenta 50
  '#009d9a', // teal 50
  '#8a3ffc', // purple 60
  '#33b1ff', // cyan 40
  '#9f1853', // magenta 70
  '#0043ce', // blue 70
  '#be95ff', // purple 40
  '#007d79', // teal 60
  '#ff7eb6', // magenta 40
  '#4589ff', // blue 50
  '#6929c4', // purple 70
  '#1192e8', // cyan 50
  '#d02670', // magenta 60
  '#78a9ff', // blue 40
  '#a56eff', // purple 50
  '#08bdba', // teal 40
  '#00539a', // cyan 70
];

// ── Working state ─────────────────────────────────────────────────
let _views     = [];        // working copy (presets, possibly overridden by saved edits)
let _viewId    = null;
let _selRep    = null;      // spotlighted / paint-target rep name
let _editMode  = false;
let _container = null;
let _saveTimer = null;

// ── Load / save ───────────────────────────────────────────────────
function clonePresets() {
  // Colours are assigned here from the IBM palette (by rep order), so they are
  // owned by code — recolouring the palette recolours everyone, and saved edits
  // (which only concern state assignments) never carry stale colours.
  return TERRITORY_VIEWS.map(v => ({
    ...v,
    reps: v.reps.map((r, i) => ({ ...r, color: IBM_PALETTE[i % IBM_PALETTE.length], states: [...r.states] })),
  }));
}

/** Overlay saved state assignments onto the presets (matched by rep name). */
function reconcile(saved) {
  const presets = clonePresets();
  if (!saved || !Array.isArray(saved.views)) return presets;
  const savedById = new Map(saved.views.map(v => [v.id, v]));
  return presets.map(p => {
    const s = savedById.get(p.id);
    if (!s || !Array.isArray(s.reps)) return p;
    const savedStates = new Map(s.reps.map(r => [r.name, Array.isArray(r.states) ? r.states : []]));
    return {
      ...p,
      reps: p.reps.map(r => ({
        ...r,
        states: savedStates.has(r.name) ? [...savedStates.get(r.name)] : r.states,
      })),
    };
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

/** state code -> { rep, color } for the active view */
function assignmentMap() {
  const map = {};
  const v = activeView();
  if (!v) return map;
  v.reps.forEach(r => r.states.forEach(s => { map[s] = { rep: r.name, color: r.color }; }));
  return map;
}

function repByName(name) { return activeView()?.reps.find(r => r.name === name) || null; }

/** Assign a state to a rep (removing it from any other rep). Null rep = unassign. */
function assignState(code, repName) {
  const v = activeView();
  if (!v) return;
  v.reps.forEach(r => { r.states = r.states.filter(s => s !== code); });
  if (repName) {
    const r = v.reps.find(x => x.name === repName);
    if (r && !r.states.includes(code)) r.states.push(code);
  }
  scheduleSave();
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
            ${_views.map(x => `<option value="${x.id}"${x.id === _viewId ? ' selected' : ''}>${esc(x.manager)} — ${esc(x.market)}</option>`).join('')}
          </select>
          <div class="tc-view-meta">
            <span class="tc-view-role">${esc(v.role)}</span>
            <span class="tc-view-market">${esc(v.market)} Market</span>
          </div>
        </div>
        <div class="tc-toolbar-right">
          <button class="tc-btn" id="tcEditBtn">${_editMode ? '✓ Done editing' : '✎ Edit assignments'}</button>
          <button class="tc-btn tc-btn-ghost" id="tcResetBtn" title="Reset this view to the seeded preset">Reset view</button>
        </div>
      </div>

      <div class="tc-main">
        <div class="tc-map-wrap" id="tcMapWrap">
          ${_editMode ? `<div class="tc-edit-hint" id="tcEditHint"></div>` : ''}
          ${mapSvg()}
          ${territoryTiles()}
        </div>
        <div class="tc-legend" id="tcLegend">${legendHtml()}</div>
      </div>

      <div class="tc-tooltip" id="tcTooltip" hidden></div>
    </div>
  `;

  wire();
  updateEditHint();
}

// ── Map SVG (isometric extruded states) ──────────────────────────
function mapSvg() {
  const { w, h } = US_VIEWBOX;
  const amap = assignmentMap();
  const abbrs = Object.keys(US_PATHS);

  const dimmed = (code) => _selRep && amap[code]?.rep !== _selRep;

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
      const dim = _selRep && a?.rep !== _selRep;
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
  const counts = {};
  v.reps.forEach(r => { counts[r.name] = r.states.length; });
  return `
    <div class="tc-legend-title">${_editMode ? 'Pick a rep, then click states' : 'Reps'}</div>
    <div class="tc-legend-list">
      ${v.reps.map(r => `
        <div class="tc-legend-item${_selRep === r.name ? ' tc-active' : ''}" data-rep="${esc(r.name)}">
          <span class="tc-swatch" style="background:${r.color};border-bottom-color:${darken(r.color, 0.5)}"></span>
          <span class="tc-legend-text">
            <span class="tc-legend-name">${esc(r.name)}</span>
            ${r.sub ? `<span class="tc-legend-sub">${esc(r.sub)}</span>` : ''}
          </span>
          <span class="tc-legend-count">${counts[r.name]}</span>
        </div>`).join('')}
    </div>
    ${_editMode ? `<button class="tc-btn tc-btn-ghost tc-legend-clear" id="tcClearSel">Clear selection</button>` : ''}
  `;
}

// ── Wiring ────────────────────────────────────────────────────────
function wire() {
  document.getElementById('tcViewSelect').addEventListener('change', e => {
    _viewId = e.target.value;
    _selRep = null;
    renderShell();
  });

  document.getElementById('tcEditBtn').addEventListener('click', () => {
    _editMode = !_editMode;
    if (!_editMode) _selRep = null;
    renderShell();
  });

  document.getElementById('tcResetBtn').addEventListener('click', () => {
    const preset = TERRITORY_VIEWS.find(v => v.id === _viewId);
    if (!preset) return;
    const idx = _views.findIndex(v => v.id === _viewId);
    _views[idx] = { ...preset, reps: preset.reps.map(r => ({ ...r, states: [...r.states] })) };
    _selRep = null;
    scheduleSave();
    renderShell();
  });

  document.getElementById('tcClearSel')?.addEventListener('click', () => { _selRep = null; renderShell(); });

  // Legend clicks: spotlight (view mode) or select paint target (edit mode)
  document.getElementById('tcLegend').addEventListener('click', e => {
    const item = e.target.closest('.tc-legend-item');
    if (!item) return;
    const rep = item.dataset.rep;
    _selRep = _selRep === rep ? null : rep;
    renderShell();
  });

  const wrap = document.getElementById('tcMapWrap');

  // Click a state / territory
  wrap.addEventListener('click', e => {
    const el = e.target.closest('[data-abbr]');
    if (!el) return;
    const code = el.dataset.abbr;
    if (_editMode) {
      if (!_selRep) { flashHint('Pick a rep from the legend first'); return; }
      const amap = assignmentMap();
      // clicking a state already owned by the selected rep un-assigns it
      if (amap[code]?.rep === _selRep) assignState(code, null);
      else assignState(code, _selRep);
      renderShell();
    } else {
      const amap = assignmentMap();
      _selRep = amap[code] ? (amap[code].rep === _selRep ? null : amap[code].rep) : _selRep;
      renderShell();
    }
  });

  // Hover tooltip
  const tip = document.getElementById('tcTooltip');
  wrap.addEventListener('mousemove', e => {
    const el = e.target.closest('[data-abbr]');
    if (!el) { tip.hidden = true; return; }
    const code = el.dataset.abbr;
    const a = assignmentMap()[code];
    const name = STATE_NAMES[code] || TERRITORY_TILE_NAMES[code] || code;
    tip.innerHTML = `<strong>${esc(name)}</strong>${a ? ` · ${esc(a.rep)}` : ' · Unassigned'}`;
    const r = _container.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left + 14) + 'px';
    tip.style.top  = (e.clientY - r.top + 14) + 'px';
    tip.hidden = false;
  });
  wrap.addEventListener('mouseleave', () => { tip.hidden = true; });
}

function updateEditHint() {
  const hint = document.getElementById('tcEditHint');
  if (!hint) return;
  hint.textContent = _selRep
    ? `Assigning to ${_selRep} — click states to add, click an owned state to remove`
    : 'Edit mode — pick a rep from the legend, then click states';
}
function flashHint(msg) {
  const hint = document.getElementById('tcEditHint');
  if (!hint) return;
  hint.textContent = msg;
  hint.classList.add('tc-hint-flash');
  setTimeout(() => hint.classList.remove('tc-hint-flash'), 600);
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
