/**
 * app.js — boot, authentication gate, navigation, and view orchestration
 */
import { renderOrg }    from './views/org.js';
import { renderSeller } from './views/seller.js';
import { renderNetwork} from './views/network.js';
import {
  getToken, setToken, clearToken,
  getMe, login, register, logout,
} from './api.js';

// ── Current signed-in user (module-level) ───────────────────────
let _user = null;
export function currentUser() { return _user; }

// ── Auth gate ────────────────────────────────────────────────────
// The app boots only once a valid session exists. On load we try the stored
// token; if it's missing/expired we show the login overlay.
async function startAuth() {
  const overlay = document.getElementById('authOverlay');

  if (getToken()) {
    try {
      const { user } = await getMe();
      _user = user;
      overlay.hidden = true;
      onAuthenticated();
      return;
    } catch {
      clearToken(); // token no longer valid
    }
  }
  showLogin();
}

function showLogin() {
  const overlay = document.getElementById('authOverlay');
  overlay.hidden = false;
  wireAuthForm();
  document.getElementById('authUsername').focus();
}

let _authMode = 'login'; // 'login' | 'register'
let _authWired = false;

function wireAuthForm() {
  if (_authWired) return;
  _authWired = true;

  const form        = document.getElementById('authForm');
  const switchBtn   = document.getElementById('authSwitchBtn');
  const errorEl     = document.getElementById('authError');

  const setMode = (mode) => {
    _authMode = mode;
    const isRegister = mode === 'register';
    document.getElementById('authTagline').textContent   = isRegister ? 'Create your hive' : 'Sign in to your hive';
    document.getElementById('authSubmit').textContent     = isRegister ? 'Create account' : 'Sign in';
    document.getElementById('authDisplayNameRow').hidden  = !isRegister;
    document.getElementById('authSwitchText').textContent = isRegister ? 'Already have an account?' : 'New here?';
    switchBtn.textContent = isRegister ? 'Sign in' : 'Create an account';
    document.getElementById('authPassword').setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
    errorEl.hidden = true;
  };

  switchBtn.addEventListener('click', () => setMode(_authMode === 'login' ? 'register' : 'login'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value;
    const displayName = document.getElementById('authDisplayName').value.trim();

    const submitBtn = document.getElementById('authSubmit');
    submitBtn.disabled = true;
    const label = submitBtn.textContent;
    submitBtn.textContent = '…';

    try {
      const res = _authMode === 'register'
        ? await register({ username, password, display_name: displayName })
        : await login({ username, password });
      setToken(res.token);
      _user = res.user;
      document.getElementById('authOverlay').hidden = true;
      form.reset();
      onAuthenticated();
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = label;
    }
  });
}

// ── Called once authenticated ────────────────────────────────────
let _booted = false;
function onAuthenticated() {
  const nameEl = document.getElementById('currentUserName');
  if (nameEl && _user) nameEl.textContent = _user.display_name || _user.username;

  // Populate the account dropdown with the real signed-in user.
  const dropName   = document.getElementById('dropdownUserName');
  const dropHandle = document.getElementById('dropdownUserHandle');
  if (dropName && _user)   dropName.textContent   = _user.display_name || _user.username;
  if (dropHandle && _user) dropHandle.textContent = '@' + _user.username;

  if (!_booted) {
    _booted = true;
    wireProfileDropdown();
    wireLogout();
    wireNav();
  }
  // Re-render the network view for the freshly signed-in user.
  rendered.delete('network');
  activateView('org');
}

function wireLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try { await logout(); } catch { /* ignore — clear locally regardless */ }
    clearToken();
    _user = null;
    // Reset views so the next user starts clean.
    rendered.clear();
    document.querySelectorAll('.main > .view').forEach(v => { v.innerHTML = ''; });
    document.getElementById('userDropdown')?.classList.remove('open');
    showLogin();
  });
}

// ── Account dropdown (open/close) ───────────────────────────────
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
function wireNav() {
  document.querySelectorAll('.topnav-link[data-view-link]').forEach(item => {
    item.addEventListener('click', () => activateView(item.dataset.viewLink));
  });

  // The product title is also a home control. Colonies is the app's default
  // landing page, so clicking the IBM Hive brand always returns there.
  document.getElementById('topnavBrand')?.addEventListener('click', () => {
    activateView('org');
  });
}

// ── Init ──────────────────────────────────────────────────────────
// Login is disabled for now — boot straight into the app as a local guest.
// Data saves to this browser's localStorage (the server still works if a token
// is ever set again, but no sign-in is required). The auth machinery above is
// kept intact so login can be re-enabled later by calling startAuth() instead.
function bootGuest() {
  _user = { id: 'local', username: 'local', display_name: 'Sydney Chin' };

  const overlay = document.getElementById('authOverlay');
  if (overlay) overlay.hidden = true;

  const nameEl = document.getElementById('currentUserName');
  if (nameEl) nameEl.textContent = _user.display_name;
  const dropName = document.getElementById('dropdownUserName');
  if (dropName) dropName.textContent = _user.display_name;
  const dropHandle = document.getElementById('dropdownUserHandle');
  if (dropHandle) dropHandle.textContent = 'Local (login disabled)';
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.style.display = 'none';

  wireProfileDropdown();
  wireNav();
  activateView('org');
}

bootGuest();
