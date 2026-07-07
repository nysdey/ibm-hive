/**
 * seller.js — Management Hierarchy + My Cell views
 */
import { getPeople, getPerson } from '../api.js';
import { openPerson } from '../panel.js';

const ROLE_COLORS = {
  exec:     'var(--c-exec)',
  director: 'var(--c-director)',
  manager:  'var(--c-manager)',
  ae:       'var(--c-peer)',
  tse:      'var(--c-tech)',
  csm:      'var(--c-csm)',
  sdr:      'var(--c-sdr)',
  partner:  'var(--c-partner)',
  other:    'var(--c-other)',
};

// Role taxonomy — which function each role complements (mirrors the
// Sales / Technical / Ecosystem hex-map role architecture)
const ROLE_CATEGORY = {
  exec:     'cat-sales',
  director: 'cat-sales',
  manager:  'cat-sales',
  ae:       'cat-sales',
  sdr:      'cat-sales',
  tse:      'cat-tech',
  csm:      'cat-tech',
  partner:  'cat-support',
  other:    'cat-support',
};

export async function renderSeller(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Job View</div>
      <div class="page-sub">Your management chain and the complementary roles in your cell</div>
    </div>
    <div class="tab-bar">
      <div class="tab active" data-tab="hier">Management Hierarchy</div>
      <div class="tab" data-tab="cell">My Cell</div>
    </div>
    <div class="content">
      <div id="seller-tab-hier" class="seller-tab active"></div>
      <div id="seller-tab-cell" class="seller-tab" style="display:none"></div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.seller-tab').forEach(t => t.style.display = 'none');
      document.getElementById(`seller-tab-${tab.dataset.tab}`).style.display = 'block';
    });
  });

  // Load data
  const [me, allEnterprise] = await Promise.all([
    getPeople({ role_type: 'ae' }).then(p => p.find(x => x.is_current_user) || p[0]),
    getPeople({ market: 'Enterprise' }),
  ]);

  await Promise.all([
    renderHierarchy(me, allEnterprise),
    renderCell(me, allEnterprise),
  ]);
}

async function renderHierarchy(me, people) {
  const container = document.getElementById('seller-tab-hier');

  // Build levels: chain up from current user to root
  const byId = {};
  people.forEach(p => { byId[p.id] = p; });

  const chain = [me];
  let cur = me;
  while (cur.manager_id && byId[cur.manager_id]) {
    cur = byId[cur.manager_id];
    chain.unshift(cur);
  }

  // Direct peers (same manager)
  const peers = people.filter(p =>
    p.manager_id === me.manager_id && !p.is_current_user
  );

  const legend = `
    <div class="role-legend">
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-exec)"></div>VP / Exec</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-director)"></div>Director</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-manager)"></div>Manager</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-you)"></div>You</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-peer)"></div>Peer</div>
    </div>
  `;

  // Render chain (above current user and above the "Your Manager" card, which is rendered separately below)
  const chainHtml = chain.slice(0, -2).map(p => `
    <div class="org-level">
      ${orgCard(p, '')}
    </div>
    <div class="org-connector"><div class="org-connector-line"></div></div>
  `).join('');

  // Render my manager (last in chain before me)
  const manager = chain.length > 1 ? chain[chain.length - 2] : null;

  // Peer row including "you"
  const peerRow = `
    <div class="org-level" style="gap:12px">
      ${peers.slice(0, 2).map(p => orgCard(p, 'peer')).join('')}
      ${orgCard(me, 'you')}
      ${peers.slice(2).map(p => orgCard(p, 'peer')).join('')}
    </div>
  `;

  container.innerHTML = legend + `
    <div class="org-tree">
      ${chainHtml}
      <div class="org-level">${orgCard(chain[chain.length - (chain.length > 1 ? 2 : 1)], 'highlight')}</div>
      <div class="org-connector"><div class="org-connector-line"></div></div>
      ${peerRow}
    </div>
  `;

  // Wire clicks
  container.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

async function renderCell(me, people) {
  const container = document.getElementById('seller-tab-cell');

  const cellMembers = people.filter(p =>
    p.manager_id === me.manager_id || p.id === me.manager_id
  );

  const legend = `
    <div class="role-legend">
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-manager)"></div>Manager</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-you)"></div>You</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-peer)"></div>Peer AE</div>
      <div class="rl-item"><div class="rl-dot" style="background:var(--c-tech)"></div>Technical</div>
    </div>
  `;

  // Build rows: manager on top, then grid of peers
  const manager = people.find(p => p.id === me.manager_id);
  const others  = cellMembers.filter(p => p.id !== me.manager_id);
  const withMe  = [me, ...others];

  // Chunk into rows of 3
  const rows = [];
  if (manager) rows.push([manager]);
  for (let i = 0; i < withMe.length; i += 3) {
    rows.push(withMe.slice(i, i + 3));
  }

  const hexRows = rows.map(row => `
    <div class="hex-row">
      ${row.map(p => `
        <div class="hex-wrap" data-person-id="${p.id}">
          <div class="hex ${ROLE_CATEGORY[p.role_type] || ''}" style="background:${p.is_current_user ? 'var(--c-you)' : ROLE_COLORS[p.role_type] || 'var(--c-other)'}">
            <div class="hex-name">${p.first_name} ${p.last_name.charAt(0)}.</div>
            <div class="hex-role">${p.role_type.toUpperCase()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  const catLegend = `
    <div class="cat-legend">
      <div class="cat-legend-item"><div class="cat-legend-marker cat-sales"></div>Sales Roles</div>
      <div class="cat-legend-item"><div class="cat-legend-marker cat-tech"></div>Technical Roles</div>
      <div class="cat-legend-item"><div class="cat-legend-marker cat-support"></div>Ecosystem Roles</div>
    </div>
  `;

  container.innerHTML = legend + `<div class="hive-container">${hexRows}</div>` + catLegend;

  container.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

// ── Helper: single org card ────────────────────────────────────
function orgCard(person, variant) {
  const color = person.is_current_user ? 'var(--c-you)' : ROLE_COLORS[person.role_type] || 'var(--c-other)';
  const badge = {
    you:       `<div class="org-badge" style="background:rgba(77,123,255,0.16);color:var(--c-you)">You</div>`,
    highlight: `<div class="org-badge">Your Manager</div>`,
    peer:      `<div class="org-badge">Peer</div>`,
    '':        `<div class="org-badge">${capitalize(person.role_type)}</div>`,
  }[variant] ?? `<div class="org-badge">${capitalize(person.role_type)}</div>`;

  return `
    <div class="org-card ${variant}" data-person-id="${person.id}">
      <div class="org-avatar" style="background:${color}">${person.initials}</div>
      <div class="org-info">
        <div class="org-name">${person.first_name} ${person.last_name}</div>
        <div class="org-role">${person.role}</div>
        ${badge}
      </div>
    </div>
  `;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
