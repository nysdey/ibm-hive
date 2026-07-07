/**
 * accounts.js — Account Hive view
 */
import { getAccounts } from '../api.js';
import { openAccount } from '../panel.js';

const STAGE_COLORS = {
  'Closed Won':  'var(--stage-won)',
  'Negotiation': 'var(--stage-negotiation)',
  'Proposal':    'var(--stage-proposal)',
  'At Risk':     'var(--stage-risk)',
  'Prospect':    'var(--stage-prospect)',
};

const STAGES = ['Closed Won', 'Negotiation', 'Proposal', 'At Risk', 'Prospect'];

export async function renderAccounts(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Account Hive</div>
      <div class="page-sub">All your accounts in one comb — color coded by pipeline stage</div>
    </div>
    <div class="content">
      <div id="acct-stats" class="stat-row"></div>
      <div class="accounts-toolbar">
        <button class="acct-filter active" data-stage="">All</button>
        ${STAGES.map(s => `<button class="acct-filter" data-stage="${s}">${s}</button>`).join('')}
        <div class="acct-legend">
          ${Object.entries(STAGE_COLORS).map(([stage, color]) => `
            <div class="legend-item">
              <div class="legend-dot" style="background:${color}"></div>${stage}
            </div>
          `).join('')}
        </div>
      </div>
      <div id="acct-hive" class="hive-container" style="flex-direction:column;align-items:flex-start">
        <div class="loading">Loading…</div>
      </div>
    </div>
  `;

  const accounts = await getAccounts();
  renderStats(accounts);

  let activeStage = '';

  function redraw() {
    renderHive(accounts, activeStage);
  }

  container.querySelectorAll('.acct-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.acct-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStage = btn.dataset.stage;
      redraw();
    });
  });

  redraw();
}

function renderStats(accounts) {
  const el = document.getElementById('acct-stats');
  if (!el) return;

  const total     = accounts.length;
  const closedWon = accounts.filter(a => a.stage === 'Closed Won').reduce((s,a) => s + (a.value_usd||0), 0);
  const pipeline  = accounts.filter(a => ['Negotiation','Proposal'].includes(a.stage)).reduce((s,a) => s + (a.value_usd||0), 0);
  const atRisk    = accounts.filter(a => a.stage === 'At Risk').reduce((s,a) => s + (a.value_usd||0), 0);

  el.innerHTML = `
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Accounts</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--stage-won)">${fmt(closedWon)}</div><div class="stat-label">Closed Won</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--accent-blue)">${fmt(pipeline)}</div><div class="stat-label">Active Pipeline</div></div>
    <div class="stat-card"><div class="stat-num" style="color:var(--stage-risk)">${fmt(atRisk)}</div><div class="stat-label">At Risk</div></div>
  `;
}

function renderHive(accounts, activeStage) {
  const hive = document.getElementById('acct-hive');
  if (!hive) return;

  // Chunk accounts into rows of 4–5 (offset every other)
  const ROW_SIZE = 4;
  const rows = [];
  for (let i = 0; i < accounts.length; i += ROW_SIZE) {
    rows.push(accounts.slice(i, i + ROW_SIZE));
  }

  hive.innerHTML = rows.map((row, ri) => `
    <div class="hex-row acct-row" style="${ri % 2 === 1 ? 'margin-left:44px' : ''}">
      ${row.map(a => {
        const color   = STAGE_COLORS[a.stage] || 'var(--stage-prospect)';
        const dimmed  = activeStage && a.stage !== activeStage;
        const valStr  = a.value_usd ? '$' + (a.value_usd / 1000).toFixed(0) + 'K' : '—';
        return `
          <div class="acct-hex" data-acct-id="${a.id}"
               style="background:${color};opacity:${dimmed ? 0.2 : 1};pointer-events:${dimmed ? 'none' : 'auto'}">
            <div class="acct-name">${a.short_name || a.name}</div>
            <div class="acct-val">${valStr}</div>
            <div class="acct-stage">${a.stage}</div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  hive.querySelectorAll('[data-acct-id]').forEach(el => {
    el.addEventListener('click', () => openAccount(el.dataset.acctId));
  });
}

function fmt(n) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n;
}
