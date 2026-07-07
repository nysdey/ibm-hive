/**
 * app.js — boot, navigation, and view orchestration
 */
import { getPeople }      from './api.js';
import { renderSeller }   from './views/seller.js';
import { renderNetwork }  from './views/network.js';
import { renderAccounts } from './views/accounts.js';
import { renderExec }     from './views/exec.js';

// ── Boot: populate current user in nav ────────────────────────
async function boot() {
  try {
    const people = await getPeople();
    const me = people.find(p => p.is_current_user);
    if (me) {
      document.getElementById('currentUserName').textContent = me.first_name + ' ' + me.last_name;
      document.getElementById('currentUserAvatar').textContent = me.initials;
    }
  } catch (e) {
    console.warn('Could not load user from API:', e.message);
  }
}

// ── View registry ─────────────────────────────────────────────
const VIEW_RENDERERS = {
  seller:   renderSeller,
  network:  renderNetwork,
  accounts: renderAccounts,
  exec:     renderExec,
};

const rendered = new Set();

async function activateView(viewName) {
  // Update sidebar
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === viewName);
  });

  // Show the right view container
  document.querySelectorAll('.main > .view').forEach(v => {
    v.classList.toggle('active', v.id === `view-${viewName}`);
  });

  // Render the view if not already rendered
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
          <div class="page-sub">Could not load view: ${err.message}</div>
        </div>
        <div class="content" style="color:var(--muted);font-size:13px">
          Make sure the server is running (<code>npm start</code>) and the database is seeded (<code>npm run seed</code>).
        </div>
      `;
    }
  }
}

// ── Sidebar nav clicks ────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => activateView(item.dataset.view));
});

// ── Init ──────────────────────────────────────────────────────
boot();
activateView('seller');
