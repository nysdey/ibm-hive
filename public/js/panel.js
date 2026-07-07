/**
 * panel.js — slide-over detail panel for people and accounts
 */
import { getPerson, getAccount, getNotes, addNote } from './api.js';

const overlay = document.getElementById('panelOverlay');
const dpClose  = document.getElementById('dpClose');

let _currentEntityType = null;
let _currentEntityId   = null;

// ── Close ──────────────────────────────────────────────────────
dpClose.addEventListener('click', close);
overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

export function close() {
  overlay.classList.remove('open');
  _currentEntityType = null;
  _currentEntityId   = null;
}

// ── Open person panel ──────────────────────────────────────────
export async function openPerson(id) {
  overlay.classList.add('open');
  renderLoading();

  const p = await getPerson(id);
  _currentEntityType = 'person';
  _currentEntityId   = id;

  setHeader(p.initials, p.color, p.first_name + ' ' + p.last_name, p.role, p.market + ' Market');

  setContact(p.email, p.slack, p.location);

  // Relationship tags
  const conn = p.connection;
  const tagMap = { close_ally:'Close Ally', partner:'Partner', cross_brand:'Cross-brand', client:'Client', peer:'Peer' };
  const tags = conn ? [tagMap[conn.relationship]] : [];
  if (p.role_type === 'exec')     tags.push('Executive');
  if (p.role_type === 'director') tags.push('Director');
  if (p.role_type === 'manager')  tags.push('Manager');
  if (p.is_current_user)          tags.push('You');

  setTags(tags);
  document.getElementById('dpMet').textContent = conn?.how_we_met || '—';

  const notes = await getNotes('person', id);
  renderNotes(notes);
  wireNoteForm();
}

// ── Open account panel ─────────────────────────────────────────
export async function openAccount(id) {
  overlay.classList.add('open');
  renderLoading();

  const a = await getAccount(id);
  _currentEntityType = 'account';
  _currentEntityId   = id;

  const stageColors = {
    'Closed Won': '#198038',
    'Negotiation': '#0f62fe',
    'Proposal': '#8a3ffc',
    'At Risk': '#da1e28',
    'Prospect': '#8d8d8d',
  };
  const col = stageColors[a.stage] || '#8d8d8d';

  setHeader(
    a.name.slice(0, 2).toUpperCase(),
    col,
    a.name,
    a.industry,
    a.stage,
    col
  );

  // For accounts, repurpose the contact section
  document.getElementById('dpEmail').textContent    = a.champion || '—';
  document.getElementById('dpEmail').removeAttribute('href');
  document.getElementById('dpSlack').textContent    = a.owner_name || '—';
  document.getElementById('dpLocation').textContent = a.value_usd
    ? '$' + (a.value_usd / 1000).toLocaleString() + 'K'
    : 'Prospect';

  // Collaborator tags
  const tags = [a.stage, a.industry];
  if (a.collaborators?.length) {
    a.collaborators.forEach(c => tags.push(c.first_name + ' ' + c.last_name + ' (' + c.role_on_acct + ')'));
  }
  setTags(tags);
  document.getElementById('dpMet').textContent = a.renewal_date || '—';

  renderNotes(a.notes || []);
  wireNoteForm();
}

// ── Helpers ────────────────────────────────────────────────────
function renderLoading() {
  document.getElementById('dpAvatar').textContent      = '…';
  document.getElementById('dpAvatar').style.background = '#8d8d8d';
  document.getElementById('dpName').textContent        = 'Loading…';
  document.getElementById('dpRole').textContent        = '';
  document.getElementById('dpMarket').textContent      = '';
  document.getElementById('dpNotesList').innerHTML     = '';
  document.getElementById('dpTags').innerHTML          = '';
}

function setHeader(initials, color, name, role, market, marketColor) {
  const av = document.getElementById('dpAvatar');
  av.textContent        = initials;
  av.style.background   = color;
  document.getElementById('dpName').textContent   = name;
  document.getElementById('dpRole').textContent   = role;
  const mkt = document.getElementById('dpMarket');
  mkt.textContent     = market;
  mkt.style.background = marketColor ? marketColor + '22' : '';
  mkt.style.color      = marketColor || '';
}

function setContact(email, slack, location) {
  const emailEl = document.getElementById('dpEmail');
  emailEl.textContent = email || '—';
  emailEl.href        = email ? 'mailto:' + email : '#';
  document.getElementById('dpSlack').textContent    = slack    || '—';
  document.getElementById('dpLocation').textContent = location || '—';
}

function setTags(tags) {
  document.getElementById('dpTags').innerHTML = tags
    .filter(Boolean)
    .map(t => `<span class="dp-tag">${t}</span>`)
    .join('');
}

function renderNotes(notes) {
  const list = document.getElementById('dpNotesList');
  if (!notes.length) {
    list.innerHTML = '<div class="dp-note-item" style="color:var(--muted)">No notes yet.</div>';
    return;
  }
  list.innerHTML = notes.map(n => `
    <div class="dp-note-item">
      ${n.body}
      <div class="dp-note-date">${new Date(n.created_at).toLocaleDateString()}</div>
    </div>
  `).join('');
}

function wireNoteForm() {
  const form  = document.getElementById('dpNoteForm');
  const input = document.getElementById('dpNoteInput');

  // Clone to remove old listeners
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async e => {
    e.preventDefault();
    const body = newForm.querySelector('#dpNoteInput').value.trim();
    if (!body) return;
    await addNote({ entity_type: _currentEntityType, entity_id: _currentEntityId, body });
    newForm.querySelector('#dpNoteInput').value = '';
    const notes = await getNotes(_currentEntityType, _currentEntityId);
    renderNotes(notes);
  });
}
