/**
 * seller.js — Cell view: Structure (hex team grid) + Connections (network)
 *
 * Structure: renders Sydney's actual team as hexagons arranged in rows.
 * Connections: the existing network/connections view re-used inline.
 */
import { getPeople }  from '../api.js';
import { openPerson } from '../panel.js';

// Role → fill color for hex cells
const ROLE_COLOR = {
  exec:     '#7c3aed',
  director: '#9333ea',
  manager:  '#6c63ff',
  bss:      '#2563eb',
  bts:      '#0e7490',
  intern:   '#4d7bff',
  csm:      '#0f766e',
  sdr:      '#1d4ed8',
  partner:  '#7e22ce',
  other:    '#1a1a1a',
};

const ROLE_LABEL = {
  exec:'VP/Exec', director:'Director', manager:'Manager',
  bss:'TSS', bts:'BTSS', intern:'Intern', csm:'CSM',
  sdr:'SDR', partner:'Partner', other:'—',
};

// HEX SIZE for the Cell view (smaller than Org)
const HR = 46;
const HW = Math.round(Math.sqrt(3) * HR);

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 180 * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

let _activeTab = 'structure';

export async function renderSeller(container) {
  container.innerHTML = `
    <div class="cell-page">
      <div class="tab-bar" style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div class="tab active" data-tab="structure">Structure</div>
        <div class="tab" data-tab="connections">Connections</div>
      </div>
      <div id="cell-tab-structure" class="cell-tab-content" style="display:flex;flex:1;overflow-y:auto"></div>
      <div id="cell-tab-connections" class="cell-tab-content" style="display:none;flex:1;overflow-y:auto"></div>
    </div>
  `;

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.cell-tab-content').forEach(t => t.style.display = 'none');
      document.getElementById(`cell-tab-${tab.dataset.tab}`).style.display = 'flex';
      _activeTab = tab.dataset.tab;
    });
  });

  // Also listen for sidebar filter
  document.addEventListener('sidebar:filter', e => {
    const { value } = e.detail;
    if (value === 'structure') {
      container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'structure'));
      container.querySelectorAll('.cell-tab-content').forEach(t => t.style.display = 'none');
      document.getElementById('cell-tab-structure').style.display = 'flex';
    } else if (value === 'connections') {
      container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'connections'));
      container.querySelectorAll('.cell-tab-content').forEach(t => t.style.display = 'none');
      document.getElementById('cell-tab-connections').style.display = 'flex';
    }
  });

  const allPeople = await getPeople();
  renderStructure(allPeople);
  renderConnections(allPeople);
}

// ── Structure: hex grid of Sydney's actual team ───────────────────
function renderStructure(allPeople) {
  const container = document.getElementById('cell-tab-structure');
  if (!container) return;

  const me      = allPeople.find(p => p.is_current_user) || allPeople[0];
  const manager = allPeople.find(p => p.id === me?.manager_id);

  // Find Sydney's actual named teammates by name
  const teamNames = [
    'Mark Hoffman', 'Armada Veraepalli', 'Ross Holley',
    'Patrick McBride', 'Rob Hanes',
  ];
  const teammates = allPeople.filter(p =>
    !p.is_current_user &&
    teamNames.includes(p.first_name + ' ' + p.last_name)
  );

  // Build rows:
  //  Row 0 (centered): manager
  //  Row 1 (centered): Rob Hanes + Chris Kennedy  (TSS Mgr + BTSS Mgr)  — but Chris is manager so skip
  //  Row 2: Mark Hoffman, Armada Veraepalli (BTSS peers)
  //  Row 3 (offset): Ross Holley, [You], Patrick McBride
  const robHanes   = teammates.find(p => p.last_name === 'Hanes');
  const markH      = teammates.find(p => p.last_name === 'Hoffman' && p.first_name === 'Mark');
  const armada     = teammates.find(p => p.first_name === 'Armada');
  const rossH      = teammates.find(p => p.last_name === 'Holley');
  const patrickM   = teammates.find(p => p.last_name === 'McBride');

  const rows = [
    manager          ? [manager]                              : [],
    robHanes         ? [robHanes]                             : [],
    [markH, armada].filter(Boolean),
    [rossH, me, patrickM].filter(Boolean),
  ].filter(r => r.length > 0);

  const rowsHtml = rows.map((row, ri) => {
    const cells = row.map(p => hexCell(p)).join('');
    return `<div class="cell-hex-row" style="${ri % 2 === 1 ? `margin-left:${HW/2 + 3}px` : ''}">${cells}</div>`;
  }).join('');

  // Relationship guide
  const guideRows = [
    { color: '#6c63ff', label: 'Manager (Chris Kennedy — BTSS Manager)' },
    { color: '#6c63ff', label: 'TSS Manager (Rob Hanes — TSS Manager)' },
    { color: '#0e7490', label: 'BTSS — Brand Technical Sales Specialist' },
    { color: '#2563eb', label: 'TSS — Territory Sales Specialist' },
    { color: '#4d7bff', label: 'You — BTSS Intern' },
  ];

  container.innerHTML = `
    <div style="flex:1;overflow-y:auto;padding:28px 32px">
      <div style="font-size:12px;color:#525252;margin-bottom:24px;line-height:1.6">
        Infrastructure Colony · US All Market · PowerVS · FlashSystems · Fusion
      </div>

      <div class="cell-hex-grid" style="padding:0 0 32px">
        ${rowsHtml}
      </div>

      <div style="margin-top:32px;border-top:1px solid rgba(255,255,255,0.07);padding-top:20px">
        <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.6px;color:#525252;margin-bottom:14px">Key relationships</div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead>
            <tr>
              <th style="text-align:left;color:#525252;font-weight:400;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.07)">BTSS</th>
              <th style="text-align:left;color:#525252;font-weight:400;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.07)">TSS counterpart</th>
              <th style="text-align:left;color:#525252;font-weight:400;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.07)">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#f4f4f4">Mark Hoffman</td>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#60a5fa">Ross Holley</td>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#525252">Paired coverage</td>
            </tr>
            <tr>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#f4f4f4">Armada Veraepalli</td>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#60a5fa">Patrick McBride</td>
              <td style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#525252">Paired coverage</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:9px 0;color:#525252">TSS Manager: Rob Hanes · BTSS Manager: Chris Kennedy</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Wire click → person panel
  container.querySelectorAll('[data-person-id]').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

function hexCell(person) {
  if (!person) return '';
  const isMe    = person.is_current_user;
  const color   = isMe ? '#1a2e5e' : (ROLE_COLOR[person.role_type] || ROLE_COLOR.other);
  const stroke  = isMe ? '#4d7bff' : 'rgba(255,255,255,0.18)';
  const sw      = isMe ? 1.5 : 0.8;
  const textCol = 'rgba(255,255,255,0.9)';
  const cx = HR + 2, cy = HR + 2;
  const size = HR * 2 + 4;

  const name  = person.first_name + ' ' + person.last_name;
  const role  = ROLE_LABEL[person.role_type] || '';
  const parts = name.split(' ');
  const line1 = parts[0];
  const line2 = parts.slice(1).join(' ');

  return `
    <div class="cell-hex-item" data-person-id="${person.id}" title="${name}">
      <svg class="cell-hex-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <polygon points="${hexPoints(cx, cy, HR - 1)}"
                 fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>
        ${isMe ? `<polygon points="${hexPoints(cx, cy, HR - 4)}" fill="none" stroke="rgba(77,123,255,0.5)" stroke-width="1"/>` : ''}
        <text x="${cx}" y="${cy - 7}" text-anchor="middle" dominant-baseline="middle"
              fill="${textCol}" font-size="9.5" font-weight="500"
              font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${line1}</text>
        <text x="${cx}" y="${cy + 5}" text-anchor="middle" dominant-baseline="middle"
              fill="${textCol}" font-size="9.5" font-weight="500"
              font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${line2}</text>
        <text x="${cx}" y="${cy + 17}" text-anchor="middle" dominant-baseline="middle"
              fill="rgba(255,255,255,0.38)" font-size="7.5"
              font-family="IBM Plex Sans, system-ui, sans-serif" pointer-events="none">${role}</text>
      </svg>
    </div>
  `;
}

// ── Connections: network cards ─────────────────────────────────────
async function renderConnections(allPeople) {
  const container = document.getElementById('cell-tab-connections');
  if (!container) return;

  try {
    const { getNetwork } = await import('../api.js');
    const conns = await getNetwork();

    const REL_LABELS = {
      close_ally: 'Close ally', partner: 'Partner', cross_brand: 'Cross-brand',
      client: 'Client', peer: 'Peer',
    };
    const REL_CSS = {
      close_ally: 'tag-close', partner: 'tag-partner', cross_brand: 'tag-cross',
      client: 'tag-client', peer: 'tag-peer',
    };

    if (!conns || conns.length === 0) {
      container.innerHTML = `<div class="content" style="color:var(--muted);font-size:13px">No connections yet. Add them from the People tab.</div>`;
      return;
    }

    const cards = conns.map(c => {
      const p = allPeople.find(x => x.id === c.person_id) || {};
      const name = p.first_name ? p.first_name + ' ' + p.last_name : '—';
      const tag  = REL_CSS[c.relationship] || 'tag-peer';
      const lbl  = REL_LABELS[c.relationship] || c.relationship;
      return `
        <div class="network-card" data-person-id="${c.person_id}">
          <div class="nc-top">
            <div class="nc-avatar" style="background:${p.color || '#333'}">${p.first_name ? p.first_name[0] : '?'}</div>
            <div>
              <div class="nc-name">${name}</div>
              <div class="nc-role">${p.role || '—'}</div>
            </div>
          </div>
          <div class="nc-tag ${tag}">${lbl}</div>
          ${c.notes ? `<div class="nc-note">${c.notes}</div>` : ''}
          ${c.needs_followup ? `<div class="nc-followup">⚑ Follow up</div>` : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="flex:1;overflow-y:auto">
        <div style="padding:20px 24px 8px;font-size:12px;color:#525252">${conns.length} connection${conns.length !== 1 ? 's' : ''}</div>
        <div class="network-grid" style="padding:0 24px 24px">${cards}</div>
      </div>
    `;

    container.querySelectorAll('[data-person-id]').forEach(el => {
      el.addEventListener('click', () => openPerson(el.dataset.personId));
    });

  } catch (err) {
    container.innerHTML = `<div class="content" style="color:var(--muted);font-size:13px">Could not load connections.</div>`;
  }
}
