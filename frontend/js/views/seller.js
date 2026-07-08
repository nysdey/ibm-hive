/**
 * seller.js — My Team view
 *
 * IBM Infrastructure – Select-T Activate
 * Four manager groups: Adrian Meghoo (BTS), Rob Mason (TSS),
 * Chris Kennedy (BTSS), Darryl Pope (Manager)
 *
 * Two ways to look at the same roster:
 *  - List View  — grouped rows, name / region / territory
 *  - Hive View  — each group as a tessellated cluster of hexagons
 *                 (same hex styling as the Organization tab). Every
 *                 hex shows just a name; click one for the full detail
 *                 (territory, region, contact) in the side panel.
 */

// ── Team data ─────────────────────────────────────────────────────
const ORG_META = {
  name:    'IBM Infrastructure',
  segment: 'Select-T Activate',
};

const MANAGER_GROUPS = [
  {
    id:      'bts',
    manager: 'Adrian Meghoo',
    title:   'BTS Manager',
    product: 'Storage',
    market:  null,
    accentColor: '#a855f7',
    members: [
      { name: 'David Masefield',  territory: 'NY, PA, NJ, CT, MA, NH, VT, ME, RI',                                          region: 'Northeast'        },
      { name: 'Jeff Anderson',    territory: 'VA, WV, KY, TN, NC, SC, GA, AL, MS, FL',                                       region: 'Southeast'        },
      { name: 'Jeff Gillespie',   territory: 'ND, SD, NE, KS, OK, MN, IA, MO, WI, IL, IN, MI, OH, AR',                      region: 'Central / Midwest' },
      { name: 'Roy Peek',         territory: 'WA, OR, CA, NV, ID, MT, WY, UT, CO, AZ, NM, TX, LA, AK, HI',                  region: 'West & Southwest' },
    ],
  },
  {
    id:      'tss',
    manager: 'Rob Mason',
    title:   'TSS Manager',
    product: null,
    market:  'Comms / Distribution',
    accentColor: '#0ea5e9',
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
    id:      'btss',
    manager: 'Chris Kennedy',
    title:   'BTSS Manager',
    product: null,
    market:  'Comms / Distribution',
    accentColor: '#4589ff',
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
    ],
  },
  {
    id:      'mgr',
    manager: 'Darryl Pope',
    title:   'Manager',
    product: null,
    market:  null,
    accentColor: '#6c63ff',
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

function emailFor(name) {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.') + '@ibm.com';
}

const ROW_SIZE = 4;

// ── View state ──────────────────────────────────────────────────
let _activeView = 'list'; // 'list' | 'hive'

// ── Entry ─────────────────────────────────────────────────────────
export async function renderSeller(container) {
  container.innerHTML = `
    <div class="mt-page">
      <div class="mt-team-header">
        <div class="mt-team-org">${ORG_META.name}</div>
        <div class="mt-team-seg">${ORG_META.segment}</div>
      </div>
      <div class="tab-bar mt-view-tabs">
        <div class="tab active" data-mt-view="list">List View</div>
        <div class="tab" data-mt-view="hive">Hive View</div>
      </div>
      <div id="mtBody" class="mt-body-wrap"></div>
    </div>
  `;

  container.querySelectorAll('[data-mt-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('[data-mt-view]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _activeView = tab.dataset.mtView;
      renderBody();
    });
  });

  renderBody();
}

function renderBody() {
  const body = document.getElementById('mtBody');
  if (!body) return;
  body.innerHTML = _activeView === 'list' ? listViewHtml() : hiveViewHtml();
  if (_activeView === 'hive') wireHiveView();
}

// ═══════════════════════════════════════════════════════════════
// List View
// ═══════════════════════════════════════════════════════════════
function listViewHtml() {
  return `<div class="mt-team-body">${MANAGER_GROUPS.map(g => renderGroup(g)).join('')}</div>`;
}

function renderGroup(g) {
  const meta = [g.product ? `Product: ${g.product}` : null, g.market ? `Market: ${g.market}` : null]
    .filter(Boolean).join(' · ');

  const memberRows = g.members.map(m => {
    const isSydney = m.name === 'Sydney Chin';
    return `
      <div class="mt-member-row${isSydney ? ' mt-member-me' : ''}">
        <span class="mt-member-name">${m.name}${isSydney ? ' <span class="mt-member-you">you</span>' : ''}</span>
        ${m.region ? `<span class="mt-member-region">${m.region}</span>` : ''}
        ${m.territory ? `<span class="mt-member-territory">${m.territory}</span>` : ''}
      </div>`;
  }).join('');

  return `
    <div class="mt-group" data-group-id="${g.id}">
      <div class="mt-group-header" style="border-left-color:${g.accentColor}">
        <div class="mt-group-manager">
          <span class="mt-group-name">${g.manager}</span>
          <span class="mt-group-title" style="color:${g.accentColor}">${g.title}</span>
        </div>
        ${meta ? `<div class="mt-group-meta">${meta}</div>` : ''}
        <div class="mt-group-count">${g.members.length} ${g.members.length === 1 ? 'report' : 'reports'}</div>
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
      <div class="mt-detail-panel" id="mtDetail">${emptyDetailHtml()}</div>
    </div>
  `;
}

function emptyDetailHtml() {
  return `
    <div class="mt-detail-empty">
      Click a hex to see that person's role, territory, and contact info.
    </div>`;
}

function hexHtml(name, opts) {
  const { color, isManager, key } = opts;
  return `
    <div class="mth-hex-wrap${isManager ? ' mth-hex-manager' : ''}" data-member-key="${key}"
         style="background:${color}">
      <div class="mth-hex">
        <div class="mth-hex-name">${name}</div>
      </div>
    </div>`;
}

// Border color follows the Organization tab's convention exactly:
// white by default, purple only for "you", regardless of tier — hierarchy
// is conveyed by border weight and text size/weight, not by hue.
function hexColor(name) {
  return name === 'Sydney Chin' ? '#a855f7' : 'rgba(255,255,255,0.7)';
}

function renderCluster(g) {
  // The manager sits alone above the comb — it doesn't need to tessellate
  // with anything, so it lives outside the interlocking hex-row grid.
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

  return `
    <div class="mth-cluster">
      <div class="mth-cluster-label" style="color:${g.accentColor}">
        ${g.manager} · ${g.title}${meta ? ` <span class="mth-cluster-meta">— ${meta}</span>` : ''}
      </div>
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

function showMemberDetail(key) {
  const panel = document.getElementById('mtDetail');
  if (!panel) return;

  const [groupId, rest] = key.split(':');
  const g = MANAGER_GROUPS.find(x => x.id === groupId);
  if (!g) return;

  const isManager = rest === 'manager';
  const member = isManager ? { name: g.manager, territory: null, region: null } : g.members[Number(rest)];
  const isYou = member.name === 'Sydney Chin';
  const email = emailFor(member.name);

  panel.innerHTML = `
    <div class="mt-dp-content">
      <div class="mt-dp-name">${member.name}${isYou ? ' <span class="odp-you-badge" style="margin-left:6px">You</span>' : ''}</div>
      <div class="mt-dp-role" style="color:${g.accentColor}">${isManager ? g.title : `Reports to ${g.manager}`}</div>

      ${!isManager ? mtRow('Team', `${g.manager} — ${g.title}`) : ''}
      ${member.region ? mtRow('Region', member.region) : ''}
      ${member.territory ? mtRow('Territory', member.territory) : ''}
      ${mtRow('Email', `<a class="mt-dp-link" href="mailto:${email}">${email}</a>`)}
    </div>`;
}

function mtRow(label, value) {
  return `
    <div class="mt-dp-row">
      <div class="mt-dp-label">${label}</div>
      <div class="mt-dp-value">${value}</div>
    </div>`;
}
