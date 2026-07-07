/**
 * network.js — Connections view (personal CRM), full create/edit/delete
 */
import { getNetwork, getPeople, addConnection, updateConnection, deleteConnection } from '../api.js';
import { openPerson } from '../panel.js';

const TAG_LABELS = {
  close_ally:  'Close Ally',
  partner:     'Partner',
  cross_brand: 'Cross-brand',
  client:      'Client',
  peer:        'Peer',
};

const TAG_CLASSES = {
  close_ally:  'tag-close',
  partner:     'tag-partner',
  cross_brand: 'tag-cross',
  client:      'tag-client',
  peer:        'tag-peer',
};

let connections = [];
let allPeople   = [];
let editingId   = null; // null = create mode, otherwise connection id being edited

// ── Modal elements (shared markup lives in public/index.html) ─────
const modalOverlay  = document.getElementById('modalOverlay');
const modalTitle    = document.getElementById('modalTitle');
const modalClose    = document.getElementById('modalClose');
const cfForm        = document.getElementById('connectionForm');
const cfPersonRow   = document.getElementById('cfPersonRow');
const cfPerson      = document.getElementById('cfPerson');
const cfRelationship= document.getElementById('cfRelationship');
const cfHowWeMet    = document.getElementById('cfHowWeMet');
const cfNotes       = document.getElementById('cfNotes');
const cfFollowup    = document.getElementById('cfFollowup');
const cfDelete      = document.getElementById('cfDelete');
const cfCancel      = document.getElementById('cfCancel');

export async function renderNetwork(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Connections</div>
      <div class="page-sub">Personal connections within IBM — relationships, context, open notes</div>
    </div>
    <div class="content">
      <div id="network-stats" class="stat-row"></div>
      <div class="toolbar">
        <input class="search-box" id="networkSearch" type="text" placeholder="Search connections…"/>
        <select class="sort-select" id="networkFilter">
          <option value="">All Relationships</option>
          <option value="close_ally">Close Ally</option>
          <option value="partner">Partner</option>
          <option value="cross_brand">Cross-brand</option>
          <option value="client">Client</option>
          <option value="peer">Peer</option>
        </select>
        <div style="flex:1"></div>
        <button class="btn-primary" id="addConnectionBtn">+ Add Connection</button>
      </div>
      <div id="network-grid" class="network-grid"><div class="loading">Loading…</div></div>
    </div>
  `;

  [connections, allPeople] = await Promise.all([getNetwork(), getPeople()]);
  renderStats(connections);

  function redraw() {
    const search = document.getElementById('networkSearch')?.value.toLowerCase() || '';
    const filter = document.getElementById('networkFilter')?.value || '';
    const filtered = connections.filter(c => {
      const name = (c.first_name + ' ' + c.last_name).toLowerCase();
      const matchSearch = !search || name.includes(search) || c.role.toLowerCase().includes(search);
      const matchFilter = !filter || c.relationship === filter;
      return matchSearch && matchFilter;
    });
    renderCards(filtered);
  }

  document.getElementById('networkSearch')?.addEventListener('input', redraw);
  document.getElementById('networkFilter')?.addEventListener('change', redraw);
  document.getElementById('addConnectionBtn')?.addEventListener('click', () => openModal('create'));

  redraw();
  wireModal();
}

function renderStats(list) {
  const total     = list.length;
  const allies    = list.filter(c => c.relationship === 'close_ally').length;
  const crossBrand= list.filter(c => c.relationship === 'cross_brand').length;
  const followup  = list.filter(c => c.needs_followup).length;

  document.getElementById('network-stats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Connections</div></div>
    <div class="stat-card"><div class="stat-num">${allies}</div><div class="stat-label">Close Allies</div></div>
    <div class="stat-card"><div class="stat-num">${crossBrand}</div><div class="stat-label">Cross-Brand</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent-magenta)">${followup}</div><div class="stat-label">Need Follow-up</div></div>
  `;
}

function renderCards(list) {
  const grid = document.getElementById('network-grid');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '<div class="loading">No connections match.</div>';
    return;
  }

  grid.innerHTML = list.map(c => `
    <div class="network-card" data-person-id="${c.person_id}">
      <div class="nc-top">
        <div class="nc-avatar" style="background:${c.color}">${c.initials}</div>
        <div>
          <div class="nc-name">${c.first_name} ${c.last_name}</div>
          <div class="nc-role">${c.role}</div>
        </div>
        <div class="nc-actions">
          <div class="nc-icon-btn" data-edit-id="${c.id}" title="Edit">✎</div>
          <div class="nc-icon-btn danger" data-delete-id="${c.id}" title="Delete">🗑</div>
        </div>
      </div>
      <span class="nc-tag ${TAG_CLASSES[c.relationship] || ''}">${TAG_LABELS[c.relationship] || c.relationship}</span>
      ${c.needs_followup ? '<div class="nc-followup">⚠ Follow-up needed</div>' : ''}
      ${c.notes ? `<div class="nc-note">${c.notes}</div>` : ''}
    </div>
  `).join('');

  grid.querySelectorAll('.network-card').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
  grid.querySelectorAll('[data-edit-id]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const conn = connections.find(c => String(c.id) === el.dataset.editId);
      if (conn) openModal('edit', conn);
    });
  });
  grid.querySelectorAll('[data-delete-id]').forEach(el => {
    el.addEventListener('click', async e => {
      e.stopPropagation();
      const conn = connections.find(c => String(c.id) === el.dataset.deleteId);
      if (!conn) return;
      if (!confirm(`Remove ${conn.first_name} ${conn.last_name} from your connections?`)) return;
      await deleteConnection(conn.id);
      connections = await getNetwork();
      renderStats(connections);
      renderCards(connections);
    });
  });
}

// ── Modal (create / edit) ──────────────────────────────────────────
function openModal(mode, conn) {
  editingId = mode === 'edit' ? conn.id : null;
  modalTitle.textContent = mode === 'edit' ? 'Edit Connection' : 'Add Connection';
  cfDelete.style.display = mode === 'edit' ? 'inline-block' : 'none';

  if (mode === 'create') {
    const connectedIds = new Set(connections.map(c => String(c.person_id)));
    const candidates = allPeople.filter(p => !p.is_current_user && !connectedIds.has(String(p.id)));
    cfPerson.innerHTML = candidates
      .map(p => `<option value="${p.id}">${p.first_name} ${p.last_name} — ${p.role}</option>`)
      .join('');
    cfPersonRow.style.display = '';
    cfRelationship.value = 'peer';
    cfHowWeMet.value = '';
    cfNotes.value = '';
    cfFollowup.checked = false;
  } else {
    cfPersonRow.style.display = 'none';
    cfRelationship.value = conn.relationship;
    cfHowWeMet.value = conn.how_we_met || '';
    cfNotes.value = conn.notes || '';
    cfFollowup.checked = !!conn.needs_followup;
  }

  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  editingId = null;
}

function wireModal() {
  modalClose.onclick  = closeModal;
  cfCancel.onclick    = closeModal;
  modalOverlay.onclick = e => { if (e.target === modalOverlay) closeModal(); };

  cfDelete.onclick = async () => {
    if (!editingId) return;
    const conn = connections.find(c => c.id === editingId);
    if (!confirm(`Remove ${conn?.first_name || 'this person'} from your connections?`)) return;
    await deleteConnection(editingId);
    closeModal();
    connections = await getNetwork();
    renderStats(connections);
    renderCards(connections);
  };

  cfForm.onsubmit = async e => {
    e.preventDefault();
    const body = {
      relationship: cfRelationship.value,
      how_we_met: cfHowWeMet.value.trim() || null,
      notes: cfNotes.value.trim() || null,
      needs_followup: cfFollowup.checked,
    };

    if (editingId) {
      await updateConnection(editingId, body);
    } else {
      if (!cfPerson.value) return;
      await addConnection({ person_id: cfPerson.value, ...body });
    }

    closeModal();
    connections = await getNetwork();
    renderStats(connections);
    renderCards(connections);
  };
}
