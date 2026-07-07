/**
 * network.js — My Network view
 */
import { getNetwork } from '../api.js';
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

export async function renderNetwork(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">My Network</div>
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
      </div>
      <div id="network-grid" class="network-grid"><div class="loading">Loading…</div></div>
    </div>
  `;

  const connections = await getNetwork();
  renderStats(connections);

  let filtered = connections;

  function redraw() {
    const search = document.getElementById('networkSearch')?.value.toLowerCase() || '';
    const filter = document.getElementById('networkFilter')?.value || '';
    filtered = connections.filter(c => {
      const name = (c.first_name + ' ' + c.last_name).toLowerCase();
      const matchSearch = !search || name.includes(search) || c.role.toLowerCase().includes(search);
      const matchFilter = !filter || c.relationship === filter;
      return matchSearch && matchFilter;
    });
    renderCards(filtered);
  }

  document.getElementById('networkSearch')?.addEventListener('input', redraw);
  document.getElementById('networkFilter')?.addEventListener('change', redraw);

  redraw();
}

function renderStats(connections) {
  const total     = connections.length;
  const allies    = connections.filter(c => c.relationship === 'close_ally').length;
  const crossBrand= connections.filter(c => c.relationship === 'cross_brand').length;
  const followup  = connections.filter(c => c.needs_followup).length;

  document.getElementById('network-stats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Connections</div></div>
    <div class="stat-card"><div class="stat-num">${allies}</div><div class="stat-label">Close Allies</div></div>
    <div class="stat-card"><div class="stat-num">${crossBrand}</div><div class="stat-label">Cross-Brand</div></div>
    <div class="stat-card"><div class="stat-num" style="color:#da1e28">${followup}</div><div class="stat-label">Need Follow-up</div></div>
  `;
}

function renderCards(connections) {
  const grid = document.getElementById('network-grid');
  if (!grid) return;

  if (!connections.length) {
    grid.innerHTML = '<div class="loading">No connections match.</div>';
    return;
  }

  grid.innerHTML = connections.map(c => `
    <div class="network-card" data-person-id="${c.person_id}">
      <div class="nc-top">
        <div class="nc-avatar" style="background:${c.color}">${c.initials}</div>
        <div>
          <div class="nc-name">${c.first_name} ${c.last_name}</div>
          <div class="nc-role">${c.role}</div>
        </div>
      </div>
      <span class="nc-tag ${TAG_CLASSES[c.relationship] || ''}">${TAG_LABELS[c.relationship] || c.relationship}</span>
      ${c.needs_followup ? '<div class="nc-followup">⚠ Follow-up needed</div>' : ''}
      ${c.notes ? `<div class="nc-note">${c.notes}</div>` : ''}
    </div>
  `).join('');

  grid.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}
