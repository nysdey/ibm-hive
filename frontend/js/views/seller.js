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
 *  - Territory Coverage — interactive isometric US map (see territory.js)
 */

import { renderTerritory, updateTerritoryCoverage, removeTerritoryCoverage } from './territory.js';
import { TERRITORY_VIEWS } from './territory-data.js';
import { addContactToHive } from './network.js';
import { showToast } from '../app.js';

// ── Team data ─────────────────────────────────────────────────────
const ORG_META = {
  name:    'IBM Infrastructure',
  segment: 'Select-T Activate',
};

// BTSS first — that's Sydney's team
const DEFAULT_MANAGER_GROUPS = [
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
  {
    id: 'btss-fss', manager: 'Cale Webster', title: 'BTSS Manager',
    product: null, market: 'FSS / Public', products: [], accentColor: '#8a3ffc',
    members: [
      { name:'Anjali James', territory:'WA, OR, ID, MT, ND, SD, MN, CA, AK, HI', region:'West / Northwest' },
      { name:'Ari Benoit', territory:'NV, UT, AZ, NM, CO, WY', region:'Mountain West' },
      { name:'Aditya Phadke', territory:'TX, LA', region:'Texas / Louisiana' },
      { name:'Prenav Ramesh', territory:'NE, IA, KS, MO, OK, AR, IN, MI', region:'Central' },
      { name:'Steven Gasinski', territory:'WI, IL', region:'Great Lakes' },
      { name:'Carey Slaker', territory:'NY, NJ', region:'New York / New Jersey' },
      { name:'Diamond Charlotin', territory:'DE', region:'Delaware' },
      { name:'Carlos Walker', territory:'WV, VA', region:'Mid-Atlantic' },
      { name:'Sherman Brewster', territory:'MS, AL, GA', region:'Southeast' },
      { name:'Manny Divedia', territory:'OH, PA', region:'Ohio / Pennsylvania' },
      { name:'Luther Payton', territory:'ME, NH, VT, MA, CT, RI', region:'New England' },
      { name:'Rob Slack', territory:'KY, TN, NC, SC, FL, PR', region:'Southeast / Florida' },
    ],
  },
  {
    id: 'tss-fss', manager: 'Aaron Carman', title: 'TSS Manager',
    product: null, market: 'FSS / Public', products: [], accentColor: '#8a3ffc',
    members: [
      { name:'Cam Webster', territory:'ME, NH, VT, MA', region:'New England' },
      { name:'Rob Battrick', territory:'WV, VA, KY, TN, NC, SC, MD, DC, DE', region:'Mid-Atlantic / Southeast' },
      { name:'Nick Hoang', territory:'NY, NJ, CT', region:'New York / New Jersey' },
      { name:'Rick Monroy', territory:'MS, AL, GA, FL, PR', region:'Southeast / Florida' },
      { name:'Amber Cowen', territory:'WA, OR, ID, MT, ND, SD, MN, WY, AK', region:'Northwest' },
      { name:'Andy Hall', territory:'WI, MI, IL, IN', region:'Great Lakes' },
      { name:'Herman Leonard', territory:'OH, PA', region:'Ohio / Pennsylvania' },
      { name:'Delisha Alexander', territory:'NE, IA, KS, MO, OK, AR', region:'Central' },
      { name:'Tim Zhou', territory:'CA, HI, GU, MP, AS, VI', region:'Pacific' },
      { name:'Joe Broadway', territory:'TX, LA', region:'Texas / Louisiana' },
      { name:'Noah Legagneur', territory:'NV, UT, CO, AZ, NM', region:'Mountain West' },
      { name:'Joer Bombase', territory:'RI', region:'Rhode Island' },
    ],
  },
  {
    id: 'btss-industrial', manager: 'Alan Kidd', title: 'BTSS Manager',
    product: null, market: 'Industrial', products: [], accentColor: '#4589ff',
    members: [
      { name:'Meredith McCurdy', territory:'MN, ND, SD, AK, ID, MT, OR, WA', region:'Northwest' },
      { name:'Thorston Thorpe', territory:'CA North', region:'Northern California' },
      { name:'Chad Benton', territory:'CA South, GU, HI, MP', region:'Pacific' },
      { name:'Anish Omprakash', territory:'TX, LA', region:'Texas / Louisiana' },
      { name:'Aiden Lundy', territory:'IL, WI, IN, MI', region:'Great Lakes' },
      { name:'Chris Camacho', territory:'KY, TN, NC, SC', region:'Southeast' },
      { name:'Harold Gill', territory:'AL, GA, MS', region:'Southeast' },
      { name:'Andy Tran', territory:'FL, PR, VI', region:'Florida / Caribbean' },
      { name:'Dana Clark', territory:'OH, PA', region:'Ohio / Pennsylvania' },
      { name:'Nana Kwame Afriyie Peasah', territory:'DC, DE, MD, WV, VA', region:'Mid-Atlantic' },
      { name:'Yonis Saleh', territory:'NJ, NY', region:'New York / New Jersey' },
      { name:'Matt Panora', territory:'CT, MA, ME, NH, RI, VT', region:'New England' },
    ],
  },
  {
    id: 'tss-industrial', manager: 'Michael Slade', title: 'TSS Manager',
    product: null, market: 'Industrial', products: [], accentColor: '#4589ff',
    members: [
      { name:'Barry Long', territory:'MN, ND, SD, AK, ID, MT, OR, WA', region:'Northwest' },
      { name:'Greg Harris', territory:'CA North', region:'Northern California' },
      { name:'Gary Motmans', territory:'CA South, GU, HI, MP', region:'Pacific' },
      { name:'Mark Arnold', territory:'TX, LA', region:'Texas / Louisiana' },
      { name:'Jon Poulos', territory:'IL, WI', region:'Illinois / Wisconsin' },
      { name:'Neal Echols', territory:'IN, MI', region:'Indiana / Michigan' },
      { name:'Robert Bailey', territory:'KY, TN, NC, SC', region:'Southeast' },
      { name:'Alycea Adams', territory:'AL, GA, MS', region:'Southeast' },
      { name:'Alfredo Salman', territory:'FL, PR, VI', region:'Florida / Caribbean' },
      { name:'Kelsey Zehnder', territory:'OH, PA', region:'Ohio / Pennsylvania' },
      { name:'Rezell Simmons', territory:'NJ, NY', region:'New York / New Jersey' },
      { name:'Eddie Finnell', territory:'CT, MA, ME, NH, RI, VT', region:'New England' },
    ],
  },
];

const TEAM_KEY = 'ibm_hive_team_groups_v1';
const COVERAGE_SOURCE = {
  btss:'btss-comms', tss:'tss-comms', bts:'bts-storage',
  'btss-fss':'btss-fss', 'tss-fss':'tss-fss',
};
function cloneDefaults() { return JSON.parse(JSON.stringify(DEFAULT_MANAGER_GROUPS)); }
function loadTeamGroups() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEAM_KEY) || 'null');
    if (Array.isArray(saved) && saved.length) {
      const merged = saved.slice();
      DEFAULT_MANAGER_GROUPS.forEach(group => {
        if (!merged.some(existing => existing.id === group.id)) merged.push(JSON.parse(JSON.stringify(group)));
      });
      return merged;
    }
  } catch {}
  return cloneDefaults();
}
function saveTeamGroups() { localStorage.setItem(TEAM_KEY, JSON.stringify(MANAGER_GROUPS)); }
let MANAGER_GROUPS = loadTeamGroups();

const MANAGEMENT_MANAGERS = [
  { name:'Aaron Carman', role:'TSS Manager', groupId:'tss-fss', reports:['Amber Cowan','Camden Webster','Delisha Alexander','Herman Leonard','Joe Broadway','Joer Bombase','LB Butler','Nick Hoang','Rick Monroy','Robert Battrick','Ryan Keegan','Tim Zhou'] },
  { name:'Alan Kidd', role:'BTSS Manager', groupId:'btss-industrial', reports:['Anish Omprakash','Chad Benton','Christopher Murphy','Dana Clark','Frank Tringali','Jeff Burnett','Ken Williams','Matt Panora','Meredith McCurdy','Michael Moreno','Nana Kwame Afriyie Peasah','Thorston Thorpe','Yonis Saleh','Aiden Lundy'] },
  { name:'Cale Webster', role:'BTSS Manager', groupId:'btss-fss', reports:['Aditya Phadke','Anjali James','Ari Benoit','Cary Slaker','Diamond Charlotin','Jack Mathison','Marques Walker','Steven Gasinski','Sherman Brewster','Spencer Fenelon','Toby LaCoste'] },
  { name:'Chris Kennedy', role:'BTSS Manager', groupId:'btss', reports:['Annie Sanderson','Armada Veraepalli','Demetrius Bell Jr','Jacob Kim','John Haschke','John Tatum','Mark Hoffman','Mark James','Morgan McKeithan','Roshan Dave','Sydney Chin','Tyler Reinsmith'] },
  { name:'Michael Slade', role:'TSS Manager', groupId:'tss-industrial', reports:['Alfredo Salman','Barry Long','Eddie Finnell','Gary Motmans','Gavin Moore','Greg Harris','Joel Mwesigwa','John Poulos','Kelsey Zehnder','Mark Arnold','Neal Echols','Rezell Simmons','Robert Bailey Sr','Skylar Solga','Travis Jones'] },
  { name:'Rob Mason', role:'TSS Manager', groupId:'tss', reports:['Hayden King','Jackson France','Luke Chandler','Negusu Mulu','Patrick McBride','Rick Morse','Robert Brendle','Ross Holley','Ryan Hinegardner'] },
];

// The signed-in user and everyone above them in the reporting line. These cells
// are highlighted purple in the Management chart because you sit inside them:
// you → your manager → the market leader (Kathleen Macchio, the chart root).
const SELF_NAME = 'Sydney Chin';
const YOUR_CHAIN = (() => {
  const chain = new Set([SELF_NAME, 'Kathleen Macchio']);
  const manager = MANAGEMENT_MANAGERS.find(m => (m.reports || []).includes(SELF_NAME));
  if (manager) chain.add(manager.name);
  return chain;
})();

/**
 * BTSS ↔ TSS territory pairings.
 * Derived from overlapping state coverage.
 * label: short region name shown on the connecting line.
 */
const COMMS_PAIRINGS = [
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

function overlappingPairings(btssSourceId, tssSourceId) {
  const btss = TERRITORY_VIEWS.find(v => v.id === btssSourceId)?.reps || [];
  const tss = TERRITORY_VIEWS.find(v => v.id === tssSourceId)?.reps || [];
  return btss.flatMap(b => tss.map(t => {
    const shared = b.states.filter(state => t.states.includes(state));
    return shared.length ? { btss:b.name, tss:t.name, label:shared.join(' / ') } : null;
  }).filter(Boolean));
}

function industrialPairings() {
  const industrial = TERRITORY_VIEWS.find(v => v.id === 'ind')?.reps || [];
  return industrial.map(rep => {
    const match = rep.sub?.match(/^BTSS (.+?) · TSS (.+)$/);
    if (!match || match[1] === 'TBD' || match[2] === 'TBD') return null;
    return { btss:match[1], tss:match[2], label:rep.name };
  }).filter(Boolean);
}

const PAIRING_MARKETS = [
  { id:'comms', label:'Comms / Distribution', btssGroup:'btss', tssGroup:'tss', pairings:COMMS_PAIRINGS },
  { id:'fss', label:'FSS / Public', btssGroup:'btss-fss', tssGroup:'tss-fss', pairings:overlappingPairings('btss-fss','tss-fss') },
  { id:'industrial', label:'Industrial', btssGroup:'btss-industrial', tssGroup:'tss-industrial', pairings:industrialPairings() },
];

function emailFor(name) {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.') + '@ibm.com';
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
let _activeView = 'list'; // 'list' | 'management' | 'pairings'
let _showTerritories = false;
let _managementExpanded = null;
let _managementSelected = null;
let _managementZoom = 1;
let _managementPanelCollapsed = false;

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
          <button class="mt-view-btn${_activeView === 'list' ? ' active' : ''}" data-view="list">List</button>
          <button class="mt-view-btn${_activeView === 'management' ? ' active' : ''}" data-view="management">Management</button>
          <button class="mt-view-btn${_activeView === 'pairings' ? ' active' : ''}" data-view="pairings">Pairings</button>
          <button class="mt-view-btn${_activeView === 'territory' ? ' active' : ''}" data-view="territory">Territory Coverage</button>
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
  body.style.flexDirection = ''; // reset (list view mutates this when a detail panel opens)
  if (_activeView === 'list') {
    body.innerHTML = listViewHtml();
    wireListView(body);
  } else if (_activeView === 'management') {
    body.innerHTML = managementViewHtml(); wireManagementView();
  } else if (_activeView === 'pairings') {
    body.innerHTML = pairingsViewHtml(); wirePairingsView();
  } else {
    // Territory Coverage manages its own content (async load).
    renderTerritory(body);
  }
}

// ═══════════════════════════════════════════════════════════════
// List View
// ═══════════════════════════════════════════════════════════════
function listViewHtml() {
  const groups = MANAGER_GROUPS;
  return `<div class="mt-list-page">
    <div class="mt-list-toolbar">
      <div>
        <div class="mt-list-title">Team Directory</div>
        <div class="mt-list-subtitle">${MANAGER_GROUPS.length} manager profiles</div>
      </div>
      <div class="mt-list-controls">
        <button class="mt-toolbar-territory" id="mtToggleTerritories">${_showTerritories ? 'Hide territories' : 'Show territories'}</button>
      </div>
    </div>
    <div class="mt-team-body">${groups.map(g => renderGroup(g)).join('')}</div>
  </div>`;
}

function wireListView(body) {
  document.getElementById('mtToggleTerritories')?.addEventListener('click', () => { _showTerritories = !_showTerritories; renderBody(); });
  body.addEventListener('click', e => {
    if (!e.target.closest('.mt-team-menu-wrap')) body.querySelectorAll('.mt-team-menu.open').forEach(menu => menu.classList.remove('open'));
  });
  body.querySelectorAll('[data-team-menu]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const menu = btn.parentElement.querySelector('.mt-team-menu');
      body.querySelectorAll('.mt-team-menu.open').forEach(other => { if (other !== menu) other.classList.remove('open'); });
      menu?.classList.toggle('open');
    });
  });
  body.querySelectorAll('[data-edit-team]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openTeamModal(MANAGER_GROUPS.find(g => g.id === btn.dataset.editTeam));
    });
  });
  body.querySelectorAll('[data-add-to-team]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openMemberModal(null, MANAGER_GROUPS.find(g => g.id === btn.dataset.addToTeam));
    });
  });
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
    const metaLine = [m.region, _showTerritories ? m.territory : null].filter(Boolean).join(' — ');
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
          <div class="mt-group-identity">
            <div class="mt-group-name">${g.manager}</div>
            <div class="mt-group-title" style="color:${g.accentColor}">${g.title}</div>
          </div>
          <div class="mt-group-coverage">
            ${metaParts.length ? `<div class="mt-group-meta">${metaParts.map(esc).join(' · ')}</div>` : '<div class="mt-group-meta">No market assigned</div>'}
          </div>
        </div>
        <div class="mt-team-menu-wrap">
          <button class="mt-team-menu-trigger" data-team-menu="${g.id}" aria-label="Manage ${esc(g.manager)} team">⋮</button>
          <div class="mt-team-menu">
            <button data-edit-team="${g.id}">Edit team</button>
            <button data-add-to-team="${g.id}">Add bee</button>
          </div>
        </div>
      </div>
      <div class="mt-member-list">${memberRows}</div>
    </div>`;
}

function openTeamModal(group) {
  if (!group) return;
  openTeamEditor({
    title: 'Edit team',
    fields: `
      ${teamField('Manager', 'mtmManager', group.manager)}
      ${teamField('Manager role', 'mtmTitle', group.title)}
      ${teamField('Market', 'mtmMarket', group.market || '')}
      ${teamField('Primary product', 'mtmProduct', group.product || '')}
      ${teamField('Products', 'mtmProducts', (group.products || []).join(', '), 'Comma-separated')}`,
    saveLabel: 'Save team',
    onSave: overlay => {
      group.manager = overlay.querySelector('#mtmManager').value.trim() || group.manager;
      group.title = overlay.querySelector('#mtmTitle').value.trim() || group.title;
      group.market = overlay.querySelector('#mtmMarket').value.trim() || null;
      group.product = overlay.querySelector('#mtmProduct').value.trim() || null;
      group.products = overlay.querySelector('#mtmProducts').value.split(',').map(x => x.trim()).filter(Boolean);
      saveTeamGroups();
      renderBody();
    },
  });
}

function openMemberModal(member = null, preferredGroup = null) {
  const editing = !!member;
  const currentGroup = preferredGroup || MANAGER_GROUPS.find(g => g.members.includes(member)) || MANAGER_GROUPS[0];
  openTeamEditor({
    title: editing ? 'Edit bee' : 'Add bee',
    fields: `
      ${teamField('Name', 'mtmName', member?.name || '')}
      <label class="mt-editor-label">Team<select class="mt-editor-input" id="mtmTeam">
        ${MANAGER_GROUPS.map(g => `<option value="${g.id}"${g.id === currentGroup?.id ? ' selected' : ''}>${esc(g.manager)} · ${esc(g.title)}</option>`).join('')}
      </select></label>
      ${teamField('Territory coverage', 'mtmTerritory', member?.territory || '', 'States, region, or territory')}
      ${teamField('Region', 'mtmRegion', member?.region || '')}`,
    saveLabel: editing ? 'Save bee' : 'Add bee',
    deleteLabel: editing && member.name !== 'Sydney Chin' ? 'Delete bee' : null,
    onDelete: () => {
      const owner = MANAGER_GROUPS.find(g => g.members.includes(member));
      removeTerritoryCoverage(COVERAGE_SOURCE[owner?.id], member.name);
      if (owner) owner.members = owner.members.filter(m => m !== member);
      saveTeamGroups();
      renderBody();
    },
    onSave: overlay => {
      const name = overlay.querySelector('#mtmName').value.trim();
      if (!name) return false;
      const destination = MANAGER_GROUPS.find(g => g.id === overlay.querySelector('#mtmTeam').value);
      if (!destination) return false;
      const values = {
        name,
        territory: overlay.querySelector('#mtmTerritory').value.trim() || null,
        region: overlay.querySelector('#mtmRegion').value.trim() || null,
      };
      if (editing) {
        const oldGroup = MANAGER_GROUPS.find(g => g.members.includes(member));
        const oldName = member.name;
        removeTerritoryCoverage(COVERAGE_SOURCE[oldGroup?.id], oldName);
        Object.assign(member, values);
        if (oldGroup !== destination) {
          if (oldGroup) oldGroup.members = oldGroup.members.filter(m => m !== member);
          destination.members.push(member);
        }
        updateTerritoryCoverage(COVERAGE_SOURCE[destination.id], oldName, member);
      } else {
        destination.members.push(values);
        updateTerritoryCoverage(COVERAGE_SOURCE[destination.id], values.name, values);
      }
      saveTeamGroups();
      renderBody();
      return true;
    },
  });
}

function teamField(label, id, value, placeholder = '') {
  return `<label class="mt-editor-label">${label}<input class="mt-editor-input" id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}"></label>`;
}

function openTeamEditor({ title, fields, saveLabel, deleteLabel, onSave, onDelete }) {
  document.getElementById('mtEditor')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'mtEditor';
  overlay.className = 'mt-editor-overlay';
  overlay.innerHTML = `<div class="mt-editor-modal">
    <div class="mt-editor-header"><div>${esc(title)}</div><button id="mtEditorClose">✕</button></div>
    <div class="mt-editor-body">${fields}</div>
    <div class="mt-editor-footer">
      ${deleteLabel ? `<button class="mt-editor-delete" id="mtEditorDelete">${esc(deleteLabel)}</button>` : ''}
      <span></span><button class="mt-editor-cancel" id="mtEditorCancel">Cancel</button>
      <button class="mt-editor-save" id="mtEditorSave">${esc(saveLabel)}</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelector('#mtEditorClose').addEventListener('click', close);
  overlay.querySelector('#mtEditorCancel').addEventListener('click', close);
  overlay.querySelector('#mtEditorDelete')?.addEventListener('click', () => { onDelete?.(); close(); });
  overlay.querySelector('#mtEditorSave').addEventListener('click', () => {
    if (onSave(overlay) !== false) close();
  });
}

// ═══════════════════════════════════════════════════════════════
// Management View
// ═══════════════════════════════════════════════════════════════
const MGMT_R = 74;
const MGMT_STEP_X = 176;
const MGMT_STEP_Y = 182;

function managementViewHtml() {
  return `
    <div class="mt-management-layout${_managementPanelCollapsed ? ' detail-collapsed' : ''}" id="mtManagementLayout">
      <div class="mt-management-area" id="mtManagementArea">
        <div class="mt-management-controls">
          <button id="mtManagementZoomIn" title="Zoom in">+</button>
          <button id="mtManagementZoomReset" title="Reset zoom">⊙</button>
          <button id="mtManagementZoomOut" title="Zoom out">−</button>
        </div>
        <div class="mt-management-canvas" id="mtManagementCanvas"></div>
      </div>
      <button class="mt-management-detail-toggle" id="mtManagementDetailToggle" title="Toggle detail panel">${_managementPanelCollapsed ? '❬' : '❭'}</button>
      <aside class="mt-management-detail" id="mtManagementDetail"></aside>
    </div>`;
}

function managementId(name) {
  return `mgmt-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function managementGroup(manager) {
  return MANAGER_GROUPS.find(group => group.id === manager.groupId);
}

function normalizedPersonName(name) {
  const aliases = {
    'amber cowan':'amber cowen', 'camden webster':'cam webster', 'robert battrick':'rob battrick',
    'cary slaker':'carey slaker', 'ryan hinegardner':'ryan hlinegarder', 'john poulos':'jon poulos',
    'robert bailey sr':'robert bailey',
  };
  const normalized = name.toLowerCase();
  return aliases[normalized] || normalized;
}

function managementMemberDetails(manager, name) {
  const group = managementGroup(manager);
  const target = normalizedPersonName(name);
  const member = group?.members.find(person => normalizedPersonName(person.name) === target);
  return {
    name,
    role:manager.role.replace(/ Manager$/, ''),
    manager:manager.name,
    market:group?.market || 'Select T Activate Infrastructure',
    products:group?.products || [],
    territory:member?.territory || null,
    region:member?.region || null,
    groupId:manager.groupId,
  };
}

function managementHexPoints(cx, cy, radius = MGMT_R) {
  return Array.from({ length:6 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 3;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

function managementTextLines(text, maxLength = 16) {
  const words = String(text).split(/\s+/);
  const lines = [];
  words.forEach(word => {
    const current = lines[lines.length - 1];
    if (!current || `${current} ${word}`.length > maxLength) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  });
  return lines.slice(0, 3);
}

function managementNodeSvg(node) {
  const selected = _managementSelected === node.id;
  const inYourChain = YOUR_CHAIN.has(node.name);
  const stroke = inYourChain ? '#a56eff' : selected ? '#4589ff' : 'rgba(255,255,255,.72)';
  const width = inYourChain || selected ? 3 : 1.5;
  const nameLines = managementTextLines(node.name, 17);
  const roleLines = managementTextLines(node.role, 21).slice(0, 3);
  const nameStart = node.cy - 20 - (nameLines.length - 1) * 8;
  const roleStart = node.cy + 23;
  return `<g class="mt-management-node" data-management-id="${node.id}" style="cursor:pointer">
    <polygon points="${managementHexPoints(node.cx,node.cy)}" fill="#292929" stroke="${stroke}" stroke-width="${width}"/>
    ${nameLines.map((line,index) => `<text x="${node.cx}" y="${nameStart + index * 17}" text-anchor="middle" fill="#fff" font-size="12.5" font-weight="600" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(line)}</text>`).join('')}
    ${roleLines.map((line,index) => `<text x="${node.cx}" y="${roleStart + index * 14}" text-anchor="middle" fill="#fff" font-size="10.5" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(line)}</text>`).join('')}
  </g>`;
}

function centerManagementNode(nodeId, centerVertically = false) {
  requestAnimationFrame(() => {
    const area = document.getElementById('mtManagementArea');
    const node = document.querySelector(`[data-management-id="${nodeId}"]`);
    if (!area || !node) return;
    const areaRect = area.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    area.scrollLeft += nodeRect.left + nodeRect.width / 2 - (areaRect.left + areaRect.width / 2);
    if (centerVertically) area.scrollTop = 0;
  });
}

function renderManagementChart() {
  const canvas = document.getElementById('mtManagementCanvas');
  if (!canvas) return;
  const expandedManager = MANAGEMENT_MANAGERS.find(manager => managementId(manager.name) === _managementExpanded);
  const widths = MANAGEMENT_MANAGERS.map(manager => {
    if (manager !== expandedManager || !manager.reports?.length) return MGMT_STEP_X;
    return Math.max(MGMT_STEP_X, Math.min(6, manager.reports.length) * MGMT_STEP_X);
  });
  const totalWidth = widths.reduce((sum,width) => sum + width,0) + 32 * (widths.length - 1);
  const svgWidth = Math.max(1100,totalWidth + 180);
  const rootX = svgWidth / 2;
  const rootY = 105;
  let cursor = (svgWidth - totalWidth) / 2;
  const managerNodes = MANAGEMENT_MANAGERS.map((manager,index) => {
    const cx = cursor + widths[index] / 2;
    cursor += widths[index] + 32;
    return { ...manager, id:managementId(manager.name), cx, cy:315, type:'manager' };
  });
  const reportNodes = [];
  if (expandedManager) {
    const anchor = managerNodes.find(node => node.id === _managementExpanded);
    const reports = expandedManager.reports || [];
    const cols = Math.min(6,reports.length);
    const rows = Math.ceil(reports.length / cols);
    reports.forEach((name,index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const rowCount = Math.min(cols,reports.length - row * cols);
      const rowWidth = (rowCount - 1) * MGMT_STEP_X;
      const offset = row % 2 ? MGMT_STEP_X / 2 : 0;
      reportNodes.push({
        ...managementMemberDetails(expandedManager,name),
        id:`${anchor.id}-${managementId(name)}`,
        cx:anchor.cx - rowWidth / 2 + col * MGMT_STEP_X + offset,
        cy:535 + row * MGMT_STEP_Y,
        type:'report',
      });
    });
  }
  const root = { id:'mgmt-kathleen', name:'Kathleen Macchio', role:'Select T Activate Infrastructure Market Leader', cx:rootX, cy:rootY, type:'leader' };
  const allNodes = [root,...managerNodes,...reportNodes];
  const managerLines = managerNodes.map(node => `<line x1="${rootX}" y1="${rootY + MGMT_R}" x2="${node.cx}" y2="${node.cy - MGMT_R}"/>`).join('');
  const reportAnchor = expandedManager ? managerNodes.find(node => node.id === _managementExpanded) : null;
  const reportLines = reportAnchor ? reportNodes.map(node => `<line x1="${reportAnchor.cx}" y1="${reportAnchor.cy + MGMT_R}" x2="${node.cx}" y2="${node.cy - MGMT_R}"/>`).join('') : '';
  const svgHeight = reportNodes.length ? Math.max(...reportNodes.map(node => node.cy)) + MGMT_R + 90 : 450;
  canvas.innerHTML = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <g class="mt-management-lines">${managerLines}${reportLines}</g>
    <g>${allNodes.map(managementNodeSvg).join('')}</g>
  </svg>`;
  canvas.style.transform = `scale(${_managementZoom})`;
  canvas.querySelectorAll('[data-management-id]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();
      const node = allNodes.find(item => item.id === element.dataset.managementId);
      if (!node) return;
      _managementSelected = node.id;
      if (node.type === 'manager' && node.reports?.length) {
        _managementExpanded = _managementExpanded === node.id ? null : node.id;
      }
      renderManagementChart();
      centerManagementNode(node.id);
      showManagementDetail(node);
    });
  });
}

function showManagementSummary() {
  const panel = document.getElementById('mtManagementDetail');
  if (!panel) return;
  panel.innerHTML = `<div class="mt-dp-content">
    <div class="mt-dp-role">Management</div>
    <div class="mt-dp-name">Infrastructure Leadership</div>
    <div class="mt-dp-row"><div class="mt-dp-label">Market leader</div><div class="mt-dp-value">Kathleen Macchio</div></div>
    <div class="mt-dp-row"><div class="mt-dp-label">Organization</div><div class="mt-dp-value">Select T Activate Infrastructure</div></div>
    <div class="mt-dp-row"><div class="mt-dp-label">How to explore</div><div class="mt-dp-value">Select a manager to reveal their direct reports. Select any person to view their role and coverage.</div></div>
  </div>`;
}

function showManagementDetail(node) {
  const panel = document.getElementById('mtManagementDetail');
  if (!panel) return;
  if (_managementPanelCollapsed) {
    _managementPanelCollapsed = false;
    document.getElementById('mtManagementLayout')?.classList.remove('detail-collapsed');
    const toggle = document.getElementById('mtManagementDetailToggle');
    if (toggle) toggle.textContent = '❭';
  }
  const manager = node.type === 'manager' ? node : MANAGEMENT_MANAGERS.find(item => item.name === node.manager);
  const group = manager ? managementGroup(manager) : null;
  const email = emailFor(node.name);
  panel.innerHTML = `<div class="mt-dp-content">
    <div class="mt-dp-role">${esc(node.type === 'leader' ? 'Market Leader' : node.type === 'manager' ? 'Manager' : 'Bee Profile')}</div>
    <div class="mt-dp-name">${esc(node.name)}${node.name === 'Sydney Chin' ? ' <span class="mt-dp-you-badge">You</span>' : ''}</div>
    ${mtRow('Role',esc(node.role))}
    ${node.manager ? mtRow('Manager',esc(node.manager)) : ''}
    ${group?.market || node.market ? mtRow('Market',esc(group?.market || node.market)) : ''}
    ${node.region ? mtRow('Region',esc(node.region)) : ''}
    ${node.territory ? mtRow('Territory',esc(node.territory)) : ''}
    ${group?.products?.length ? mtRow('Products',group.products.map(esc).join(', ')) : ''}
    ${mtRow('Email',`<a class="mt-dp-link" href="mailto:${email}">${email}</a>`)}
    ${node.type === 'manager' && node.reports?.length ? mtRow('Direct reports',String(node.reports.length)) : ''}
  </div>`;
}

function wireManagementView() {
  _managementExpanded = null;
  _managementSelected = null;
  _managementZoom = 1;
  renderManagementChart();
  centerManagementNode('mgmt-kathleen',true);
  showManagementSummary();
  document.getElementById('mtManagementDetailToggle')?.addEventListener('click',() => {
    _managementPanelCollapsed = !_managementPanelCollapsed;
    document.getElementById('mtManagementLayout')?.classList.toggle('detail-collapsed',_managementPanelCollapsed);
    document.getElementById('mtManagementDetailToggle').textContent = _managementPanelCollapsed ? '❬' : '❭';
  });
  const area = document.getElementById('mtManagementArea');
  area?.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    _managementZoom = Math.min(2.4,Math.max(.35,_managementZoom * Math.exp(-event.deltaY * .01)));
    const canvas = document.getElementById('mtManagementCanvas');
    if (canvas) canvas.style.transform = `scale(${_managementZoom})`;
  },{ passive:false });
  document.getElementById('mtManagementZoomIn')?.addEventListener('click',() => { _managementZoom = Math.min(2.4,_managementZoom + .15); renderManagementChart(); });
  document.getElementById('mtManagementZoomOut')?.addEventListener('click',() => { _managementZoom = Math.max(.35,_managementZoom - .15); renderManagementChart(); });
  document.getElementById('mtManagementZoomReset')?.addEventListener('click',() => { _managementZoom = 1; renderManagementChart(); });
}

// Legacy hive renderer retained for saved data compatibility; the user-facing
// tab is now the Management view above.
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
  const { color, key } = opts;
  return `
    <div class="mth-hex-wrap" data-member-key="${key}"
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
  const rows = honeycombRows(g.members);
  const memberRowsHtml = rows.map((row, rowIndex) => `
    <div class="mth-hex-row${rowIndex > 0 && row.length === rows[rowIndex - 1].length && rowIndex % 2 === 1 ? ' mth-row-offset' : ''}" style="justify-content:center">
      ${row.map(m => {
        const key = `${g.id}:${g.members.indexOf(m)}`;
        return hexHtml(m.name, { color: hexColor(m.name), key });
      }).join('')}
    </div>`).join('');

  const meta = [g.product, g.market]
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
      <div class="mth-cluster-hexes">
        ${memberRowsHtml}
      </div>
    </div>`;
}

/** Compact point-up honeycomb rows: alternate widths where possible so each
 * row nests into the shoulders of the rows above and below it. */
function honeycombRows(members) {
  if (members.length <= 4) {
    const top = Math.ceil(members.length / 2);
    return [members.slice(0, top), members.slice(top)].filter(row => row.length);
  }
  const rowCount = Math.ceil(members.length / 4);
  const base = Math.floor(members.length / rowCount);
  let extra = members.length % rowCount;
  const sizes = Array(rowCount).fill(base);
  // Wider rows sit in the alternating inset positions. This gives the large
  // Chris and Rob clusters balanced 3–4–3… silhouettes instead of a heavy top.
  for (let i = 1; i < rowCount && extra > 0; i += 2) { sizes[i]++; extra--; }
  for (let i = 0; i < rowCount && extra > 0; i += 2) { sizes[i]++; extra--; }
  let offset = 0;
  return sizes.map(size => {
    const row = members.slice(offset, offset + size);
    offset += size;
    return row;
  });
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
  const slackHandle = '@' + member.name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.');
  const market = g.market || 'Not assigned';
  const sells = [...new Set([g.product, ...(g.products || [])].filter(Boolean))].join(', ') || 'Not assigned';
  const noteKey = `${g.id}:${member.name}`;
  const allNotes = loadNotes();
  const notes  = allNotes[noteKey] || [];

  panel.innerHTML = `
    <div class="mt-dp-close" id="mtDpCloseBtn">✕</div>
    <div class="mt-dp-menu-wrap">
      <button class="mt-team-menu-trigger mt-dp-menu-trigger" id="mtDpMenu" aria-label="Manage ${esc(member.name)}">⋮</button>
      <div class="mt-team-menu mt-dp-menu" id="mtDpMenuItems">
        <button id="mtDpEditBee">${isManager ? 'Edit team' : 'Edit bee'}</button>
        ${!isManager && !isYou ? '<button id="mtDpDeleteBee">Delete bee</button>' : ''}
      </div>
    </div>
    <div class="mt-dp-content">
      <div class="mt-dp-name">${esc(member.name)}${isYou ? ' <span class="mt-dp-you-badge">You</span>' : ''}</div>
      <div class="mt-dp-role" style="color:${g.accentColor}">${isManager ? g.title : `Reports to ${g.manager}`}</div>

      ${mtRow('Market', market)}
      ${mtRow('Sells', sells)}
      ${member.region ? mtRow('Region', member.region) : ''}
      ${member.territory ? mtRow('Territory', member.territory) : ''}
      ${mtRow('Email', `<a class="mt-dp-link" href="mailto:${email}">${email}</a>`)}
      ${mtRow('Slack', `<a class="mt-dp-link" href="https://slack.com/app_redirect?channel=${encodeURIComponent(email)}" target="_blank" rel="noopener">${esc(slackHandle)}</a>`)}

      ${isYou ? '' : `<button class="mt-dp-combs-btn" id="mtDpAddCombs">+ Add to My Combs</button>`}

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

  document.getElementById('mtDpAddCombs')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const res = await addContactToHive({
      name: member.name,
      role: isManager ? g.title : g.title.replace(/ Manager$/, ''),
      company: 'IBM',
      email,
      location: member.territory || member.region || '',
      relationship: isManager ? 'Manager' : 'Peer',
      note: `From My Team · ${g.market || g.product || 'IBM Infrastructure'}`,
    });
    btn.classList.add('added');
    btn.textContent = res.added ? '✓ Added to My Combs' : '✓ Already in My Combs';
    showToast(res.added ? `Added ${member.name} to My Combs` : `${member.name} is already in My Combs`);
  });

  document.getElementById('mtDpMenu')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('mtDpMenuItems')?.classList.toggle('open');
  });
  document.getElementById('mtDpEditBee')?.addEventListener('click', () => {
    onClose();
    if (isManager) openTeamModal(g); else openMemberModal(member, g);
  });
  document.getElementById('mtDpDeleteBee')?.addEventListener('click', () => {
    removeTerritoryCoverage(COVERAGE_SOURCE[g.id], member.name);
    g.members = g.members.filter(m => m !== member);
    saveTeamGroups();
    onClose();
    renderBody();
  });

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
  const relationshipCount = PAIRING_MARKETS.reduce((sum, market) => sum + market.pairings.length, 0);
  return `
    <div class="mt-pairings-page">
      <div class="mt-pairings-toolbar">
        <div>
          <div class="mt-pairings-title">BTSS / TSS Pairings</div>
          <div class="mt-pairings-subtitle">3 markets · ${relationshipCount} territory relationships</div>
        </div>
      </div>
      <div class="mt-pairings-canvas" id="mtPairingsCanvas"></div>
    </div>`;
}

function wirePairingsView() {
  const canvas = document.getElementById('mtPairingsCanvas');
  if (!canvas) return;

  const markets = PAIRING_MARKETS.slice().sort((a, b) => a.label.localeCompare(b.label));

  function renderPairingMarket(market) {
    const pairings = market.pairings.map(pair => ({
      ...pair, market:market.label, btssGroup:market.btssGroup, tssGroup:market.tssGroup,
    }));

    const nodeKey = (groupId, name) => `${groupId}|${name}`;
    const uniqueNodes = (side) => {
      const seen = new Map();
      pairings.forEach(pair => {
        const groupId = side === 'btss' ? pair.btssGroup : pair.tssGroup;
        const name = pair[side];
        const key = nodeKey(groupId, name);
        if (!seen.has(key)) seen.set(key, { key, groupId, name });
      });
      return [...seen.values()];
    };
    const btssNodes = uniqueNodes('btss');
    const tssNodes  = uniqueNodes('tss');

  // Layout constants
  const CARD_W    = 190;
  const CARD_H    = 64;
  const CARD_GAP  = 14;
  const COL_PAD   = 24;
  const TOP_PAD   = 24;
  const LABEL_H   = 24;   // space above first card for column header

  const leftCount  = btssNodes.length;
  const rightCount = tssNodes.length;
  const maxCount   = Math.max(leftCount, rightCount);

  const svgH = TOP_PAD + LABEL_H + maxCount * (CARD_H + CARD_GAP) + 32;
  const svgW = COL_PAD * 2 + CARD_W * 2 + 96;

  const leftX  = COL_PAD;
  const rightX = svgW - COL_PAD - CARD_W;
  const midX   = leftX + CARD_W;
  const midXR  = rightX;

  // Y position for each name's card center
  function cardCY(i) {
    return TOP_PAD + LABEL_H + i * (CARD_H + CARD_GAP) + CARD_H / 2;
  }

  const btssY = Object.fromEntries(btssNodes.map((node, i) => [node.key, cardCY(i)]));
  const tssY  = Object.fromEntries(tssNodes.map((node, i) => [node.key, cardCY(i)]));

  // Build SVG
  let lines = '';
  pairings.forEach(p => {
    const y1 = btssY[nodeKey(p.btssGroup, p.btss)];
    const y2 = tssY[nodeKey(p.tssGroup, p.tss)];
    const lmx = midX + (midXR - midX) / 2;
    const lmy = (y1 + y2) / 2;
    lines += `
      <path d="M ${midX} ${y1} C ${lmx} ${y1}, ${lmx} ${y2}, ${midXR} ${y2}"
        stroke="rgba(255,255,255,0.55)" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  });

  // Column headers
  const headers = `
    <text x="${leftX + CARD_W / 2}" y="${TOP_PAD + 18}" text-anchor="middle"
      fill="#4589ff" font-size="12" font-weight="600" font-family="IBM Plex Sans,system-ui,sans-serif">BTSS</text>
    <text x="${rightX + CARD_W / 2}" y="${TOP_PAD + 18}" text-anchor="middle"
      fill="#4589ff" font-size="12" font-weight="600" font-family="IBM Plex Sans,system-ui,sans-serif">TSS</text>`;

  // BTSS cards
  let btssCards = '';
  btssNodes.forEach((node, i) => {
    const cy = cardCY(i);
    const y  = cy - CARD_H / 2;
    const group = MANAGER_GROUPS.find(g => g.id === node.groupId);
    const member = group?.members.find(m => m.name === node.name);
    const isYou  = node.name === 'Sydney Chin';
    const terr   = member?.territory || '';
    const cardSub = terr;
    const cardSubShort = cardSub.length > 28 ? cardSub.slice(0, 27) + '…' : cardSub;
    btssCards += `
      <g class="mt-pair-card" data-key="${node.groupId}:${group?.members.indexOf(member) ?? -1}" style="cursor:pointer">
        <rect x="${leftX}" y="${y}" width="${CARD_W}" height="${CARD_H}"
          rx="0" fill="#161616" stroke="rgba(255,255,255,0.7)" stroke-width="${isYou ? 2 : 1}"/>
        <text x="${leftX + 10}" y="${y + 23}" fill="${isYou ? '#a855f7' : '#f4f4f4'}"
          font-size="12.5" font-weight="${isYou ? 600 : 400}" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(node.name)}${isYou ? ' ★' : ''}</text>
        <text x="${leftX + 10}" y="${y + 44}" fill="rgba(255,255,255,0.62)"
          font-size="11" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(cardSubShort || '—')}</text>
      </g>`;
  });

  // TSS cards
  let tssCards = '';
  tssNodes.forEach((node, i) => {
    const cy = cardCY(i);
    const y  = cy - CARD_H / 2;
    const group = MANAGER_GROUPS.find(g => g.id === node.groupId);
    const member = group?.members.find(m => m.name === node.name);
    const terr   = member?.territory || '';
    const cardSub = terr;
    const cardSubShort = cardSub.length > 28 ? cardSub.slice(0, 27) + '…' : cardSub;
    tssCards += `
      <g class="mt-pair-card" data-key="${node.groupId}:${group?.members.indexOf(member) ?? -1}" style="cursor:pointer">
        <rect x="${rightX}" y="${y}" width="${CARD_W}" height="${CARD_H}"
          rx="0" fill="#161616" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        <text x="${rightX + 10}" y="${y + 23}" fill="#f4f4f4"
          font-size="12.5" font-weight="400" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(node.name)}</text>
        <text x="${rightX + 10}" y="${y + 44}" fill="rgba(255,255,255,0.62)"
          font-size="11" font-family="IBM Plex Sans,system-ui,sans-serif">${esc(cardSubShort || '—')}</text>
      </g>`;
  });

    return `
      <section class="mt-pairing-market-section" data-pairing-market="${market.id}">
        <div class="mt-pairing-market-heading">
          <span>${esc(market.label)}</span>
          <span>${pairings.length} pairings</span>
        </div>
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMin meet"
          xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-width:${svgW}px;height:auto;margin:0 auto;">
          <g>${lines}</g>
          ${headers}
          <g>${btssCards}</g>
          <g>${tssCards}</g>
        </svg>
      </section>`;
  }

  canvas.innerHTML = markets.map(renderPairingMarket).join('');

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
