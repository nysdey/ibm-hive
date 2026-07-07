/**
 * app.js — boot, navigation, and view orchestration
 */
import { getPeople }    from './api.js';
import { renderOrg }    from './views/org.js';
import { renderSeller } from './views/seller.js';
import { renderNetwork} from './views/network.js';

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
  org:     renderOrg,
  cell:    renderSeller,
  network: renderNetwork,
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
