/**
 * app.js — boot, navigation, and view orchestration
 */
import { getPeople }       from './api.js';
import { renderOrg }       from './views/org.js';
import { renderSeller }    from './views/seller.js';
import { renderNetwork }   from './views/network.js';
import { renderAccounts }  from './views/accounts.js';
import { renderResources } from './views/resources.js';

// ── Per-view sidebar definitions ────────────────────────────────
const SIDEBAR_DEFS = {
  org: {
    sections: [
      {
        label: null,
        items: [
          { id: 'colonies', label: 'Colonies', expandable: true, children: [
            { id: 'data-ai',        label: 'Data & AI' },
            { id: 'automation',     label: 'Automation' },
            { id: 'sustainability', label: 'Sustainability' },
            { id: 'security',       label: 'Security' },
            { id: 'infrastructure', label: 'Infrastructure' },
            { id: 'hybrid-cloud',   label: 'Hybrid Cloud' },
          ]},
          { id: 'jobs', label: 'Job roles', expandable: true, children: [
            { id: 'bss',      label: 'BSS — Brand Sales Specialist' },
            { id: 'bts',      label: 'BTS — Brand Technical Sales' },
            { id: 'csm',      label: 'CSM — Customer Success' },
            { id: 'manager',  label: 'Manager' },
            { id: 'director', label: 'Director' },
            { id: 'exec',     label: 'VP / Executive' },
            { id: 'partner',  label: 'Partner' },
            { id: 'sdr',      label: 'SDR' },
            { id: 'intern',   label: 'Intern' },
          ]},
          { id: 'markets', label: 'Markets', expandable: true, children: [
            { id: 'enterprise', label: 'Enterprise' },
            { id: 'strategic',  label: 'Strategic' },
            { id: 'horizon',    label: 'Horizon' },
            { id: 'territory',  label: 'Territory' },
          ]},
        ],
      },
    ],
  },

  cell: {
    sections: [
      {
        label: 'My cell',
        items: [
          { id: 'structure',    label: 'Structure',    active: true },
          { id: 'connections',  label: 'Connections' },
        ],
      },
    ],
  },

  people: {
    sections: [
      {
        label: 'Directory',
        items: [
          { id: 'people-all',    label: 'All people',    active: true },
          { id: 'people-my-org', label: 'My org' },
          { id: 'people-colony', label: 'By colony' },
        ],
      },
    ],
  },

  accounts: {
    sections: [
      {
        label: 'Pipeline',
        items: [
          { id: 'acct-all',         label: 'All accounts', active: true },
          { id: 'acct-won',         label: 'Closed won' },
          { id: 'acct-negotiation', label: 'Negotiation' },
          { id: 'acct-proposal',    label: 'Proposal' },
          { id: 'acct-risk',        label: 'At risk' },
          { id: 'acct-prospect',    label: 'Prospects' },
        ],
      },
    ],
  },

  resources: {
    sections: [
      {
        label: 'Resources',
        items: [
          { id: 'all',         label: 'All',              active: true },
          { id: 'quick-start', label: 'Quick start' },
          { id: 'tools',       label: 'Go-to tools' },
          { id: 'products',    label: 'Focus products' },
          { id: 'plays',       label: 'Sales plays' },
          { id: 'motions',     label: 'Core motions' },
          { id: 'gtm',         label: 'GTM workflow' },
          { id: 'rhythm',      label: 'Operating rhythm' },
          { id: 'roles',       label: 'Role guide' },
          { id: 'team',        label: 'My team' },
        ],
      },
    ],
  },
};

// ── Sidebar rendering ────────────────────────────────────────────
function renderSidebar(viewName) {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;

  const def = SIDEBAR_DEFS[viewName];
  if (!def) { sidebar.innerHTML = ''; return; }

  let html = '';
  def.sections.forEach(section => {
    if (section.label) {
      html += `<div class="sb-section-label">${section.label}</div>`;
    }
    section.items.forEach(item => {
      if (item.expandable && item.children) {
        html += `
          <div class="sb-group" data-group="${item.id}">
            <div class="sb-group-header" data-toggle="${item.id}">
              <span>${item.label}</span>
              <span class="sb-caret">›</span>
            </div>
            <div class="sb-group-body" id="sbg-${item.id}">
              <input class="sb-search" type="text" placeholder="Search…" data-group="${item.id}"/>
              ${item.children.map(c => `
                <div class="sb-child" data-filter="${item.id}" data-value="${c.id}">${c.label}</div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="sb-item${item.active ? ' active' : ''}" data-sb-item="${item.id}">${item.label}</div>
        `;
      }
    });
  });

  sidebar.innerHTML = html;

  // Wire expandable group toggles
  sidebar.querySelectorAll('.sb-group-header').forEach(header => {
    const id   = header.dataset.toggle;
    const body = document.getElementById(`sbg-${id}`);
    header.addEventListener('click', () => {
      const open = body.classList.toggle('open');
      header.querySelector('.sb-caret').textContent = open ? '⌄' : '›';
    });
  });

  // Wire search within groups
  sidebar.querySelectorAll('.sb-search').forEach(input => {
    input.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const group = e.target.dataset.group;
      sidebar.querySelectorAll(`.sb-child[data-filter="${group}"]`).forEach(child => {
        child.style.display = child.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  });

  // Wire filter items — broadcast to active view
  sidebar.querySelectorAll('.sb-child, .sb-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.querySelectorAll('.sb-child.active, .sb-item.active').forEach(a => a.classList.remove('active'));
      el.classList.add('active');
      document.dispatchEvent(new CustomEvent('sidebar:filter', {
        detail: { group: el.dataset.filter || el.dataset.sbItem, value: el.dataset.value || el.dataset.sbItem }
      }));
    });
  });
}

// ── Boot: populate current user in nav ───────────────────────────
async function boot() {
  try {
    const people = await getPeople();
    const me = people.find(p => p.is_current_user);
    if (me) {
      document.getElementById('currentUserName').textContent = me.first_name + ' ' + me.last_name;
    }
  } catch (e) {
    console.warn('Could not load user:', e.message);
  }
}

// ── Profile / account switcher dropdown ─────────────────────────
function wireProfileDropdown() {
  const userSection = document.getElementById('topnavUser');
  const dropdown    = document.getElementById('userDropdown');
  if (!userSection || !dropdown) return;

  userSection.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    if (!userSection.contains(e.target)) dropdown.classList.remove('open');
  });

  dropdown.querySelectorAll('.user-dropdown-item').forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation();
      dropdown.querySelectorAll('.user-dropdown-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const nameEl = document.getElementById('currentUserName');
      if (item.dataset.profile === 'sydney')       nameEl.textContent = 'Sydney Chin';
      else if (item.dataset.profile === 'manager') nameEl.textContent = 'Chris Kennedy';
      else if (item.dataset.profile === 'admin')   nameEl.textContent = 'Admin';
      dropdown.classList.remove('open');
    });
  });
}

// ── View registry ────────────────────────────────────────────────
const VIEW_RENDERERS = {
  org:       renderOrg,
  cell:      renderSeller,
  people:    renderNetwork,
  accounts:  renderAccounts,
  resources: renderResources,
};

const rendered = new Set();

async function activateView(viewName) {
  // Update top nav
  document.querySelectorAll('.topnav-link[data-view-link]').forEach(n => {
    n.classList.toggle('active', n.dataset.viewLink === viewName);
  });

  // Show the right view container
  document.querySelectorAll('.main > .view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${viewName}`);
  });

  // Render context-appropriate sidebar
  renderSidebar(viewName);

  // Render the view if not yet rendered
  const container = document.getElementById(`view-${viewName}`);
  if (!container) return;

  if (!rendered.has(viewName)) {
    rendered.add(viewName);
    try {
      await VIEW_RENDERERS[viewName]?.(container);
    } catch (err) {
      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">Error</div>
          <div class="page-sub">${err.message}</div>
        </div>
        <div class="content" style="color:var(--muted);font-size:13px">
          Make sure the server is running (<code>npm start</code>) and seeded (<code>npm run seed</code>).
        </div>
      `;
    }
  }
}

// ── Top nav link clicks ──────────────────────────────────────────
document.querySelectorAll('.topnav-link[data-view-link]').forEach(item => {
  item.addEventListener('click', () => activateView(item.dataset.viewLink));
});

// ── Init ──────────────────────────────────────────────────────────
boot();
wireProfileDropdown();
activateView('org');
