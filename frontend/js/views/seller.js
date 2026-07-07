/**
 * seller.js — Cell view
 *
 * The most important relationship on Sydney's team is NOT reporting structure.
 * It's the BTSS ↔ TSS pairing.
 *
 * Layout:
 *   - Two columns: BTSS | TSS
 *   - SVG lines connecting paired people
 *   - Managers at top, members below
 *   - Reporting lines (dashed) vs pairing lines (solid colored)
 *   - "You are here" glow on Sydney's node
 *   - Connections tab: personal CRM
 *
 * Team:
 *   BTSS Manager: Chris Kennedy
 *   BTSS: Sydney Chin, Mark Hoffman, Armada Veraepalli
 *   TSS Manager: Rob Hanes
 *   TSS: Ross Holley, Patrick McBride
 *   Pairs: Mark ↔ Ross, Armada ↔ Patrick
 */
import { getPeople }  from '../api.js';
import { getNetwork } from '../api.js';
import { openPerson } from '../panel.js';

const ROLE_COLOR = {
  manager: '#6c63ff', bts: '#4589ff', bss: '#0ea5e9',
  intern: '#60a5fa', other: '#525252',
};

const ROLE_LABEL = {
  manager:'Manager', bts:'BTSS', bss:'TSS', intern:'Intern', other:'—',
};

export async function renderSeller(container) {
  container.innerHTML = `
    <div class="cell-page">
      <div class="tab-bar" style="padding:0 24px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <div class="tab active" data-tab="structure">My Cell</div>
        <div class="tab" data-tab="connections">Connections</div>
      </div>
      <div id="cell-tab-structure" class="cell-tab-content" style="display:flex;flex:1;min-height:0;overflow-y:auto"></div>
      <div id="cell-tab-connections" class="cell-tab-content" style="display:none;flex:1;min-height:0;overflow-y:auto"></div>
    </div>
  `;

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.cell-tab-content').forEach(t => t.style.display = 'none');
      document.getElementById(`cell-tab-${tab.dataset.tab}`).style.display = 'flex';
    });
  });

  document.addEventListener('sidebar:filter', e => {
    const { value } = e.detail;
    if (value === 'structure' || value === 'connections') {
      container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === value));
      container.querySelectorAll('.cell-tab-content').forEach(t => t.style.display = 'none');
      document.getElementById(`cell-tab-${value}`).style.display = 'flex';
    }
  });

  const allPeople = await getPeople();
  renderStructure(allPeople);
  renderConnections(allPeople);
}

// ── Structure: BTSS↔TSS pairing diagram ──────────────────────────
function renderStructure(allPeople) {
  const pane = document.getElementById('cell-tab-structure');
  if (!pane) return;

  const me = allPeople.find(p => p.is_current_user) || allPeople[0];

  // Resolve team members by name (static team for Sydney)
  const find = (fn, ln) => allPeople.find(p => p.first_name === fn && p.last_name === ln);
  const chrisK  = find('Chris', 'Kennedy');
  const robH    = find('Rob', 'Hanes');
  const markH   = find('Mark', 'Hoffman');
  const armada  = find('Armada', 'Veraepalli');
  const rossH   = find('Ross', 'Holley');
  const patrickM= find('Patrick', 'McBride');

  // Fallback to manager from data
  const mgr = chrisK || allPeople.find(p => p.id === me?.manager_id);

  // BTSS column (left): Chris Kennedy (mgr), Sydney, Mark, Armada
  const btssCol = [chrisK, me, markH, armada].filter(Boolean);
  // TSS column (right): Rob Hanes (mgr), Ross, Patrick
  const tssCol  = [robH, rossH, patrickM].filter(Boolean);

  // Pairings: [btss, tss]
  const pairs = [
    [markH, rossH],
    [armada, patrickM],
  ];

  // Node layout constants
  const NODE_W = 140, NODE_H = 64, V_GAP = 20, H_GAP = 200;
  const BTSS_X = 60, TSS_X = BTSS_X + NODE_W + H_GAP;
  const START_Y = 120;

  // Compute Y positions for each person
  const yPos = {};
  btssCol.forEach((p, i) => { if (p) yPos[p.id] = START_Y + i * (NODE_H + V_GAP); });
  tssCol.forEach((p, i)  => { if (p) yPos[p.id] = START_Y + i * (NODE_H + V_GAP); });

  const totalH = Math.max(btssCol.length, tssCol.length) * (NODE_H + V_GAP) + START_Y + 60;
  const SVG_W  = TSS_X + NODE_W + 60;

  // Build SVG
  let svgHtml = `<svg width="${SVG_W}" height="${totalH}" viewBox="0 0 ${SVG_W} ${totalH}"
    xmlns="http://www.w3.org/2000/svg" style="overflow:visible">`;

  // Column labels
  svgHtml += `
    <text x="${BTSS_X + NODE_W/2}" y="30" text-anchor="middle"
      fill="#6c63ff" font-size="11" font-weight="600" letter-spacing="1"
      font-family="IBM Plex Sans, system-ui, sans-serif">BTSS</text>
    <text x="${BTSS_X + NODE_W/2}" y="46" text-anchor="middle"
      fill="#525252" font-size="10"
      font-family="IBM Plex Sans, system-ui, sans-serif">Brand Technical Sales</text>
    <text x="${TSS_X + NODE_W/2}" y="30" text-anchor="middle"
      fill="#0ea5e9" font-size="11" font-weight="600" letter-spacing="1"
      font-family="IBM Plex Sans, system-ui, sans-serif">TSS</text>
    <text x="${TSS_X + NODE_W/2}" y="46" text-anchor="middle"
      fill="#525252" font-size="10"
      font-family="IBM Plex Sans, system-ui, sans-serif">Territory Sales</text>`;

  // Column divider
  const midX = (BTSS_X + NODE_W + TSS_X) / 2;
  svgHtml += `<line x1="${midX}" y1="60" x2="${midX}" y2="${totalH - 40}"
    stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4,4"/>`;

  // Manager ↔ Manager reporting line (dashed)
  if (chrisK && robH && yPos[chrisK.id] !== undefined && yPos[robH.id] !== undefined) {
    const y1 = yPos[chrisK.id] + NODE_H / 2;
    const y2 = yPos[robH.id]   + NODE_H / 2;
    svgHtml += `<line
      x1="${BTSS_X + NODE_W}" y1="${y1}"
      x2="${TSS_X}" y2="${y2}"
      stroke="#6c63ff" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.5"/>
    <text x="${midX}" y="${(y1 + y2)/2 - 6}" text-anchor="middle"
      fill="#444" font-size="9" font-family="IBM Plex Sans, system-ui, sans-serif">reporting</text>`;
  }

  // Pairing lines (solid, colored, labeled)
  pairs.forEach(([btss, tss], i) => {
    if (!btss || !tss || yPos[btss.id] === undefined || yPos[tss.id] === undefined) return;
    const y1 = yPos[btss.id] + NODE_H / 2;
    const y2 = yPos[tss.id]  + NODE_H / 2;
    const cx1 = BTSS_X + NODE_W;
    const cx2 = TSS_X;
    // Bezier curve for elegance
    svgHtml += `<path
      d="M ${cx1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${cx2} ${y2}"
      stroke="#0ea5e9" stroke-width="2" fill="none" opacity="0.7"/>
    <circle cx="${midX}" cy="${(y1+y2)/2}" r="3" fill="#0ea5e9" opacity="0.7"/>
    <text x="${midX + 6}" y="${(y1+y2)/2 + 4}" text-anchor="middle"
      fill="#0ea5e9" font-size="9" opacity="0.8"
      font-family="IBM Plex Sans, system-ui, sans-serif">paired</text>`;
  });

  // Draw nodes
  [...btssCol.map(p => ({p, x: BTSS_X})), ...tssCol.map(p => ({p, x: TSS_X}))].forEach(({p, x}) => {
    if (!p || yPos[p.id] === undefined) return;
    const y = yPos[p.id];
    const isMe_ = p.is_current_user;
    const isMgr = p.role_type === 'manager';
    const col   = isMgr ? '#6c63ff' : (x === BTSS_X ? '#4589ff' : '#0ea5e9');
    const fill  = isMe_ ? '#0d1f4c' : (isMgr ? '#1a183a' : '#161b2e');
    const stroke = isMe_ ? '#4589ff' : col;
    const sw = isMe_ ? 2 : 1;

    svgHtml += `
      <g class="cell-node" data-person-id="${p.id}" style="cursor:pointer">
        <rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="6"
          fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        ${isMe_ ? `<rect x="${x-2}" y="${y-2}" width="${NODE_W+4}" height="${NODE_H+4}" rx="8"
          fill="none" stroke="#4589ff" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>` : ''}
        <text x="${x + NODE_W/2}" y="${y + 22}" text-anchor="middle"
          fill="${isMe_ ? '#a0c4ff' : '#e0e0e0'}" font-size="12" font-weight="500"
          font-family="IBM Plex Sans, system-ui, sans-serif">${p.first_name} ${p.last_name}</text>
        <text x="${x + NODE_W/2}" y="${y + 38}" text-anchor="middle"
          fill="${col}" font-size="10"
          font-family="IBM Plex Sans, system-ui, sans-serif">${p.role || ROLE_LABEL[p.role_type] || '—'}</text>
        ${isMe_ ? `<text x="${x + NODE_W/2}" y="${y + 54}" text-anchor="middle"
          fill="#4589ff" font-size="9" font-weight="600" letter-spacing="1"
          font-family="IBM Plex Sans, system-ui, sans-serif">YOU</text>` : ''}
      </g>`;
  });

  svgHtml += `</svg>`;

  // Products supported
  const products = ['IBM PowerVS', 'IBM FlashSystem', 'IBM Fusion', 'IBM z16', 'IBM LinuxONE'];

  pane.innerHTML = `
    <div class="cell-structure-wrap">
      <div class="cell-structure-header">
        <div class="cell-header-breadcrumb">
          <span class="cell-bc">Horizon Colony</span>
          <span class="cell-bc-sep">›</span>
          <span class="cell-bc">Infrastructure Org</span>
          <span class="cell-bc-sep">›</span>
          <span class="cell-bc cell-bc-active">My Cell</span>
        </div>
        <div class="cell-header-sub">
          BTSS Manager: Chris Kennedy · TSS Manager: Rob Hanes
        </div>
      </div>

      <div class="cell-diagram-wrap">
        ${svgHtml}
      </div>

      <div class="cell-legend">
        <span class="cell-leg-item"><span class="cell-leg-line cell-leg-solid"></span> BTSS↔TSS pair</span>
        <span class="cell-leg-item"><span class="cell-leg-line cell-leg-dashed"></span> Reporting structure</span>
        <span class="cell-leg-item"><span class="cell-leg-dot" style="background:#4589ff"></span> You</span>
        <span class="cell-leg-item"><span class="cell-leg-dot" style="background:#6c63ff"></span> BTSS Manager</span>
        <span class="cell-leg-item"><span class="cell-leg-dot" style="background:#0ea5e9"></span> TSS</span>
      </div>

      <div class="cell-products">
        <div class="cell-products-label">Products this team supports</div>
        <div class="cell-products-list">
          ${products.map(pr => `<span class="cell-product-tag">${pr}</span>`).join('')}
        </div>
      </div>

      <div class="cell-pairs-table">
        <div class="cell-pairs-title">Coverage pairs</div>
        <table class="cell-table">
          <thead>
            <tr>
              <th>BTSS</th>
              <th>TSS Partner</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${markH ? markH.first_name + ' ' + markH.last_name : 'Mark Hoffman'}</td>
              <td style="color:#0ea5e9">${rossH ? rossH.first_name + ' ' + rossH.last_name : 'Ross Holley'}</td>
              <td>Paired coverage · PowerVS + FlashSystem</td>
            </tr>
            <tr>
              <td>${armada ? armada.first_name + ' ' + armada.last_name : 'Armada Veraepalli'}</td>
              <td style="color:#0ea5e9">${patrickM ? patrickM.first_name + ' ' + patrickM.last_name : 'Patrick McBride'}</td>
              <td>Paired coverage · Fusion + z16</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Wire clicks → panel
  pane.querySelectorAll('.cell-node').forEach(el => {
    el.addEventListener('click', () => openPerson(el.dataset.personId));
  });
}

// ── Connections tab ───────────────────────────────────────────────
async function renderConnections(allPeople) {
  const pane = document.getElementById('cell-tab-connections');
  if (!pane) return;

  const REL_LABELS = {
    close_ally:'Close ally', partner:'Partner', cross_brand:'Cross-brand',
    client:'Client', peer:'Peer',
  };
  const REL_CSS = {
    close_ally:'tag-close', partner:'tag-partner', cross_brand:'tag-cross',
    client:'tag-client', peer:'tag-peer',
  };

  try {
    const conns = await getNetwork();
    if (!conns?.length) {
      pane.innerHTML = `<div style="padding:32px 24px;color:var(--muted);font-size:14px">No connections yet.</div>`;
      return;
    }

    const cards = conns.map(c => {
      const p   = allPeople.find(x => x.id === c.person_id) || {};
      const name = p.first_name ? `${p.first_name} ${p.last_name}` : '—';
      return `
        <div class="network-card" data-person-id="${c.person_id}">
          <div class="nc-top">
            <div class="nc-avatar" style="background:${p.color||'#333'}"></div>
            <div>
              <div class="nc-name">${name}</div>
              <div class="nc-role">${p.role || '—'}</div>
            </div>
          </div>
          <div class="nc-tag ${REL_CSS[c.relationship]||'tag-peer'}">${REL_LABELS[c.relationship]||c.relationship}</div>
          ${c.notes ? `<div class="nc-note">${c.notes}</div>` : ''}
          ${c.needs_followup ? `<div class="nc-followup">⚑ Follow up</div>` : ''}
        </div>`;
    }).join('');

    pane.innerHTML = `
      <div style="flex:1;overflow-y:auto">
        <div style="padding:16px 24px 8px;font-size:13px;color:var(--muted)">${conns.length} connection${conns.length!==1?'s':''}</div>
        <div class="network-grid" style="padding:0 24px 24px">${cards}</div>
      </div>`;

    pane.querySelectorAll('[data-person-id]').forEach(el => {
      el.addEventListener('click', () => openPerson(el.dataset.personId));
    });
  } catch (err) {
    pane.innerHTML = `<div style="padding:32px 24px;color:var(--muted)">Could not load connections.</div>`;
  }
}
