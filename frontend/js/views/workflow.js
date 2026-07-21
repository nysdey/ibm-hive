/**
 * workflow.js — Select Territory deal flow and RACI diagrams.
 */

const STAGES = ['Qualify', 'Design', 'Propose', 'Negotiate', 'Closing/Won', 'Adopt', 'Grow'];

const REVTECH_PHASES = [
  'Account & territory planning',
  'Campaign planning & delivery',
  'Lead generation & outreach',
  'Deal intelligence & progression',
  'Quote to order',
  'Customer success & expansion',
];

const REVTECH_LANES = [
  {
    label:'Core platforms', tone:'blue', tools:[
      { id:'rev-adobe', title:'Adobe', start:1, span:2, short:'Campaign activation', detail:'Plan, activate, and measure campaigns that create demand and feed qualified engagement signals into the sales motion.' },
      { id:'rev-salesforce', title:'Salesforce / ISC', start:2, span:3, short:'Leads, accounts, opportunities', detail:'Manage assigned accounts, route and qualify leads, track opportunities, document milestones and next steps, and maintain pipeline hygiene.' },
      { id:'rev-salesloft', title:'Salesloft', start:2, span:2, short:'Cadences and conversations', detail:'Run outbound cadences and capture client conversations from email and Teams for follow-up, coaching, and opportunity progression.' },
      { id:'rev-sap', title:'SAP CPQ', start:4, span:1, short:'Quote and order', detail:'Build accurate pricing and subscription proposals and progress low-complexity orders toward completion.' },
      { id:'rev-gainsight', title:'Gainsight', start:5, span:1, short:'Adoption and expansion', detail:'Monitor onboarding, usage, value realization, risk, renewal readiness, and expansion signals after the sale.' },
    ],
  },
  {
    label:'Intelligence & planning', tone:'purple', tools:[
      { id:'rev-revtech', title:'RevTech dashboards', start:0, span:4, short:'Prioritization and deal signals', detail:'Use propensity, intent, buying signals, lead scoring, routing, engagement trends, and opportunity health to decide where to focus each week.' },
      { id:'rev-quip', title:'Quip', start:0, span:1, short:'Territory plans', detail:'Maintain territory plans that map account whitespace, Focus Product alignment, key contacts, and Business Partner coverage.' },
      { id:'rev-data', title:'ZoomInfo + Sales Navigator', start:0, span:3, short:'Contact and account discovery', detail:'Find client contacts, enrich account context, and identify relevant stakeholders for targeted prospecting and discovery.' },
      { id:'rev-intent', title:'Demandbase + Marketo', start:1, span:2, short:'Intent and lead scoring', detail:'Interpret campaign response, account intent, inbound signals, and scoring to prioritize and route leads quickly.' },
      { id:'rev-people', title:'People.ai', start:3, span:3, short:'Forecast and activity intelligence', detail:'Capture activity signals, inspect deal progression, improve forecasting, and support AI-assisted coaching where available.' },
    ],
  },
  {
    label:'Technical execution', tone:'blue', tools:[
      { id:'rev-techzone', title:'TechZone', start:3, span:1, short:'Demos, trials, and proofs', detail:'Build and deliver demonstrations, trials, proofs of concept, and proofs of experience that validate technical fit.' },
      { id:'rev-seismic', title:'Seismic', start:2, span:2, short:'Sales kits and enablement', detail:'Find Focus Product sales kits, use cases, competitive guidance, demo material, and client-ready assets.' },
      { id:'rev-conversations', title:'Salesloft Conversations', start:2, span:2, short:'Discovery intelligence', detail:'Capture discovery conversations, document client requirements, and preserve technical and commercial context for next steps.' },
    ],
  },
  {
    label:'Partner execution', tone:'purple', tools:[
      { id:'rev-partner-plus', title:'Partner Plus', start:2, span:3, short:'Partner programs and incentives', detail:'Find Business Partner programs, incentives, enablement, and resources used to engage the right partner early.' },
      { id:'rev-ecosystem', title:'Ecosystem.io', start:3, span:2, short:'Value co-creation', detail:'Coordinate partner value creation, opportunity progression, and joint technical or commercial execution.' },
      { id:'rev-deal-share', title:'Auto Deal Share', start:2, span:3, short:'Partner deal collaboration', detail:'Share opportunities early, establish partner ownership, and maintain visibility as the Business Partner progresses the deal.' },
    ],
  },
];

const LANES = [
  {
    id:'sdr', label:'Sales development', sub:'SDR', tone:'blue', tasks:[
      { id:'sdr-prospect', title:'Inbound and outbound prospecting', start:0, span:1, detail:'Use RevTech insights to create and qualify pipeline across assigned accounts.' },
      { id:'sdr-discovery', title:'Discovery and lead qualification', start:0.85, span:1.05, detail:'Run initial discovery, validate the client need, and qualify the opportunity.' },
      { id:'sdr-handoff', title:'Route lead to the right partner', start:1.75, span:0.85, detail:'Use the Ideal Partner Profile to engage the right Business Partner early.' },
    ],
  },
  {
    id:'sales', label:'Sales', sub:'BTSS, TSS, BSS', tone:'blue', tasks:[
      { id:'sales-outbound', title:'Account outreach', start:0, span:1.1, detail:'Conduct targeted outbound activity across assigned accounts.' },
      { id:'sales-progress', title:'Proposal and negotiation support', start:2.05, span:2.15, detail:'Shape the value proposition, maintain client alignment, and help progress the commercial motion.' },
    ],
  },
  {
    id:'tech', label:'Technical sales', sub:'BTSS, BTS, architect, CE', tone:'purple', tasks:[
      { id:'tech-design', title:'Solution design and validation', start:1.05, span:1.35, detail:'Run deep discovery, architecture, demonstrations, proofs of concept, and technical validation.' },
      { id:'tech-proposal', title:'Technical proposal support', start:2.2, span:2.1, detail:'Ensure the proposed solution addresses client requirements and remains technically viable through negotiation.' },
    ],
  },
  {
    id:'bp', label:'Business Partners', sub:'BP', tone:'purple', tasks:[
      { id:'bp-qualify', title:'Qualify and register deal', start:0.05, span:1.75, detail:'Run partner-led discovery, qualify the lead, and register the opportunity.' },
      { id:'bp-design', title:'Design solution', start:1.8, span:1.05, detail:'Translate discovery into a partner-led solution design with IBM support where needed.' },
      { id:'bp-propose', title:'Build ROI and proposal', start:2.85, span:1.05, detail:'Quantify value, create the business case, and develop the proposal.' },
      { id:'bp-contract', title:'Contract, order, and invoice', start:3.9, span:1.25, detail:'Negotiate terms and complete contracting, ordering, and invoicing.' },
      { id:'bp-adopt', title:'Implement and drive adoption', start:5.15, span:1.75, detail:'Deploy the solution, support adoption, and identify expansion opportunities.' },
    ],
  },
  {
    id:'csm', label:'Customer success', sub:'CSM', tone:'blue', tasks:[
      { id:'csm-adoption', title:'Onboard, deploy, and grow usage', start:5, span:2, detail:'Coordinate onboarding, deployment, integration, testing, adoption, value realization, renewal, and expansion.' },
    ],
  },
  {
    id:'ecosystem', label:'Ecosystem', sub:'TPS, PTS', tone:'gray', tasks:[
      { id:'eco-gtm', title:'Joint go-to-market support', start:0, span:1.1, detail:'Support partner campaigns, co-marketing, and joint pipeline generation.' },
      { id:'eco-enable', title:'Partner technical enablement', start:1.05, span:1.5, detail:'Build partner competency and add PTS capacity when required.' },
      { id:'eco-accelerate', title:'Monitor and accelerate the deal', start:2.55, span:2.65, detail:'Pool resources and provide sales or technical expertise to sustain deal momentum.' },
      { id:'eco-deploy', title:'Ensure managed deployment', start:5.2, span:1.7, detail:'Ensure deployment is part of the Business Partner management process.' },
    ],
  },
];

const RACI_ROLES = [
  { id:'sdr', label:'Sales development', sub:'SDR' },
  { id:'sales', label:'Sales roles', sub:'TSS, BSS' },
  { id:'tech', label:'Technical sales', sub:'BTSS, BTS, architect' },
  { id:'csm', label:'Customer success', sub:'CSM' },
  { id:'bp', label:'Business Partners', sub:'BP' },
];

const RACI = [
  ['Qualify','Cover IBM-led inbound and outbound',['R','R','—','—','—']],
  ['Qualify','Cover partner-led inbound and outbound',['—','—','—','—','R']],
  ['Qualify','Conduct initial discovery call',['R','R','I','—','R']],
  ['Qualify','Qualify lead',['R','R','—','—','R']],
  ['Qualify','Run deep discovery and validate pain points',['I','I','R','—','R']],
  ['Design','Deliver technical fit and gap analysis',['—','I','R','—','R']],
  ['Design','Tailor product demonstrations',['—','I','R','—','R']],
  ['Design','Run proof of concept and technical validation',['—','I','R','—','R']],
  ['Propose','Create ROI and business case',['—','R','—','—','R']],
  ['Propose','Develop commercial proposal',['—','R','—','—','R']],
  ['Negotiate','Conduct pricing negotiation',['—','R','—','—','R']],
  ['Closing','Process order and invoicing',['—','I','—','—','R']],
  ['Closing','Manage deployment handoff',['—','R','—','I','R']],
  ['Won','Configure, integrate, migrate, and test',['—','—','—','R','R']],
  ['Post-sales','Monitor usage and value realization',['—','I','—','R','R']],
  ['Post-sales','Identify upsell opportunities',['—','I','—','R','R']],
  ['Post-sales','Manage renewal and customer satisfaction',['—','I','—','I','R']],
];

let _view = 'flow';
let _stage = null;
let _raciRole = null;
let _detailCollapsed = false;

export async function renderWorkflow(container) {
  _view = 'flow';
  _stage = null;
  _raciRole = null;
  _detailCollapsed = false;
  container.innerHTML = `
    <div class="wf-page">
      <header class="wf-header">
        <div>
          <div class="wf-title">Select Territory Workflow</div>
          <div class="wf-subtitle">Deal orchestration, ownership, and collaboration across the client lifecycle</div>
        </div>
        <div class="wf-view-switch">
          <button data-wf-view="flow" class="active">Deal flow</button>
          <button data-wf-view="revtech">RevTech</button>
          <button data-wf-view="raci">RACI</button>
        </div>
      </header>
      <div class="wf-layout">
        <div class="wf-canvas" id="wfCanvas"></div>
        <button class="wf-detail-toggle" id="wfDetailToggle" title="Toggle detail panel">›</button>
        <aside class="wf-detail" id="wfDetail"></aside>
      </div>
    </div>`;

  container.querySelectorAll('[data-wf-view]').forEach(button => {
    button.addEventListener('click', () => {
      _view = button.dataset.wfView;
      _stage = null;
      _raciRole = null;
      container.querySelectorAll('[data-wf-view]').forEach(item => item.classList.toggle('active', item === button));
      renderBody();
    });
  });
  document.getElementById('wfDetailToggle')?.addEventListener('click', () => {
    _detailCollapsed = !_detailCollapsed;
    applyDetailState();
  });

  renderBody();
}

function applyDetailState() {
  const layout = document.querySelector('.wf-layout');
  const toggle = document.getElementById('wfDetailToggle');
  layout?.classList.toggle('detail-collapsed', _detailCollapsed);
  if (toggle) toggle.textContent = _detailCollapsed ? '‹' : '›';
}

function ensureDetailOpen() {
  if (!_detailCollapsed) return;
  _detailCollapsed = false;
  applyDetailState();
}

function layoutLaneTasks(tasks) {
  const slotEnds = [];
  return tasks.map(task => {
    let slot = slotEnds.findIndex(end => task.start >= end + 0.04);
    if (slot === -1) slot = slotEnds.length;
    slotEnds[slot] = task.start + task.span;
    return { ...task, slot, slotCount:slotEnds.length };
  });
}

function renderBody() {
  if (_view === 'raci') renderRaci();
  else if (_view === 'revtech') renderRevtech();
  else renderFlow();
}

function renderFlow() {
  const canvas = document.getElementById('wfCanvas');
  if (!canvas) return;
  canvas.innerHTML = `
    <div class="wf-flow">
      <div class="wf-flow-boundaries">
        <span class="wf-boundary wf-boundary-start">Demand enters here</span>
        <span class="wf-boundary wf-boundary-end">Renewal &amp; new opportunity</span>
      </div>
      <div class="wf-stage-row">
        <div class="wf-stage-corner">Role</div>
        ${STAGES.map((stage, index) => `<button class="wf-stage${_stage === index ? ' active' : ''}" data-stage="${index}">${stage}</button>`).join('')}
      </div>
      ${LANES.map(lane => {
        const placed = layoutLaneTasks(lane.tasks);
        const slotCount = Math.max(1, ...placed.map(task => task.slot + 1));
        const laneHeight = 24 + slotCount * 88;
        return `
        <div class="wf-lane" style="min-height:${laneHeight}px">
          <div class="wf-lane-label"><strong>${lane.label}</strong><span>${lane.sub}</span></div>
          <div class="wf-lane-track" style="min-height:${laneHeight}px">
            <div class="wf-lane-line"></div>
            ${placed.map(task => {
              const dim = _stage !== null && !taskTouchesStage(task, _stage);
              return `<button class="wf-task wf-tone-${lane.tone}${dim ? ' dim' : ''}" data-task="${task.id}"
                style="left:${(task.start / STAGES.length) * 100}%;width:calc(${(task.span / STAGES.length) * 100}% - 4px);top:${10 + task.slot * 88}px">${task.title}</button>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;

  canvas.querySelectorAll('[data-stage]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.stage);
      _stage = _stage === index ? null : index;
      renderFlow();
      showFlowSummary();
    });
  });
  canvas.querySelectorAll('[data-task]').forEach(button => {
    button.addEventListener('click', () => {
      const task = LANES.flatMap(lane => lane.tasks.map(item => ({ ...item, lane }))).find(item => item.id === button.dataset.task);
      if (task) showTask(task);
    });
  });
  showFlowSummary();
}

function renderRevtech() {
  const canvas = document.getElementById('wfCanvas');
  if (!canvas) return;
  canvas.innerHTML = `
    <div class="wf-revtech">
      <div class="wf-revtech-intro">Select a tool to see what it supports and when to use it.</div>
      <div class="wf-revtech-phase-row">
        <div class="wf-stage-corner">Tool layer</div>
        ${REVTECH_PHASES.map((phase, index) => `<div class="wf-revtech-phase"><span>${index + 1}</span>${phase}</div>`).join('')}
      </div>
      ${REVTECH_LANES.map(lane => {
        const placed = layoutLaneTasks(lane.tools);
        const slotCount = Math.max(1, ...placed.map(tool => tool.slot + 1));
        const laneHeight = 18 + slotCount * 72;
        return `<section class="wf-revtech-lane" style="min-height:${laneHeight}px">
          <div class="wf-lane-label"><strong>${lane.label}</strong></div>
          <div class="wf-revtech-track" style="min-height:${laneHeight}px">
            ${placed.map(tool => `<button class="wf-revtech-tool wf-tone-${lane.tone}" data-revtech-tool="${tool.id}"
              style="left:${(tool.start / REVTECH_PHASES.length) * 100}%;width:calc(${(tool.span / REVTECH_PHASES.length) * 100}% - 8px);top:${8 + tool.slot * 72}px">
              <strong>${tool.title}</strong><span>${tool.short}</span>
            </button>`).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>`;

  canvas.querySelectorAll('[data-revtech-tool]').forEach(button => {
    button.addEventListener('click', () => {
      const tool = REVTECH_LANES.flatMap(lane => lane.tools.map(item => ({ ...item, lane })))
        .find(item => item.id === button.dataset.revtechTool);
      if (tool) showRevtechTool(tool);
    });
  });
  showRevtechSummary();
}

function showRevtechSummary() {
  const panel = document.getElementById('wfDetail');
  if (!panel) return;
  panel.innerHTML = `
    <div class="wf-detail-type">RevTech</div>
    <div class="wf-detail-title">Tool stack by motion</div>
    <p>The stack begins with territory planning and demand creation, supports qualification and technical progression, moves through quoting, and ends with adoption and expansion.</p>
    <div class="wf-detail-section">BTSS operating principle</div>
    <p>Use insights to prioritize, keep Salesforce and ISC current, prove technical fit quickly, and engage Business Partners early.</p>`;
}

function showRevtechTool(tool) {
  ensureDetailOpen();
  const phases = REVTECH_PHASES.filter((_, index) => index >= tool.start && index < tool.start + tool.span);
  const panel = document.getElementById('wfDetail');
  if (!panel) return;
  panel.innerHTML = `
    <div class="wf-detail-type">${tool.lane.label}</div>
    <div class="wf-detail-title">${tool.title}</div>
    <div class="wf-detail-meta">${tool.short}</div>
    <p>${tool.detail}</p>
    <div class="wf-detail-section">Used during</div>
    <div class="wf-detail-tags">${phases.map(phase => `<span>${phase}</span>`).join('')}</div>`;
}

function taskTouchesStage(task, stage) {
  return stage >= Math.floor(task.start) && stage < Math.ceil(task.start + task.span);
}

function showFlowSummary() {
  const panel = document.getElementById('wfDetail');
  if (!panel) return;
  const stage = _stage === null ? null : STAGES[_stage];
  panel.innerHTML = `
    <div class="wf-detail-type">Deal flow</div>
    <div class="wf-detail-title">${stage || 'Workflow summary'}</div>
    <p>${stage ? `Tasks contributing to the ${stage} stage are emphasized in the diagram.` : 'Select a stage to focus the workflow, or select a task to see its owner and purpose.'}</p>
    <div class="wf-detail-section">Lifecycle priorities</div>
    <ul>
      <li>Qualify demand and engage the right partner early.</li>
      <li>Shape and validate the solution with technical sales.</li>
      <li>Maintain momentum through proposal and negotiation.</li>
      <li>Drive adoption, value realization, renewal, and growth.</li>
    </ul>`;
}

function showTask(task) {
  ensureDetailOpen();
  const panel = document.getElementById('wfDetail');
  panel.innerHTML = `
    <div class="wf-detail-type">Workflow task</div>
    <div class="wf-detail-title">${task.title}</div>
    <div class="wf-detail-meta">${task.lane.label} · ${task.lane.sub}</div>
    <p>${task.detail}</p>
    <div class="wf-detail-section">Stages</div>
    <div class="wf-detail-tags">${STAGES.filter((_, index) => taskTouchesStage(task, index)).map(stage => `<span>${stage}</span>`).join('')}</div>`;
}

function renderRaci() {
  const canvas = document.getElementById('wfCanvas');
  if (!canvas) return;
  let lastStage = '';
  canvas.innerHTML = `
    <div class="wf-raci-wrap">
      <div class="wf-raci-legend"><span><i class="responsible"></i>Responsible</span><span><i class="involved"></i>Involved</span><span><i></i>Not engaged</span></div>
      <table class="wf-raci">
        <thead><tr><th>Stage</th><th>Job to be done</th>${RACI_ROLES.map(role => `<th><button data-raci-role="${role.id}" class="${_raciRole === role.id ? 'active' : ''}">${role.label}<small>${role.sub}</small></button></th>`).join('')}</tr></thead>
        <tbody>${RACI.map((row, rowIndex) => {
          const showStage = row[0] !== lastStage;
          lastStage = row[0];
          return `<tr><td>${showStage ? row[0] : ''}</td><td>${row[1]}</td>${row[2].map((value, colIndex) => `<td class="${_raciRole && _raciRole !== RACI_ROLES[colIndex].id ? 'dim' : ''}"><button class="wf-raci-cell state-${value === 'R' ? 'responsible' : value === 'I' ? 'involved' : 'none'}" data-raci-cell="${rowIndex}:${colIndex}">${value}</button></td>`).join('')}</tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;

  canvas.querySelectorAll('[data-raci-role]').forEach(button => {
    button.addEventListener('click', () => {
      _raciRole = _raciRole === button.dataset.raciRole ? null : button.dataset.raciRole;
      renderRaci();
      showRaciSummary();
    });
  });
  canvas.querySelectorAll('[data-raci-cell]').forEach(button => {
    button.addEventListener('click', () => {
      const [rowIndex, colIndex] = button.dataset.raciCell.split(':').map(Number);
      showRaciCell(rowIndex, colIndex);
    });
  });
  showRaciSummary();
}

function showRaciSummary() {
  const panel = document.getElementById('wfDetail');
  const role = RACI_ROLES.find(item => item.id === _raciRole);
  panel.innerHTML = `
    <div class="wf-detail-type">RACI</div>
    <div class="wf-detail-title">${role ? role.label : 'Responsibility matrix'}</div>
    <p>${role ? `The matrix is focused on ${role.label}. Select a responsibility cell for details.` : 'Compare who is responsible, involved, or not engaged for each job across the lifecycle.'}</p>
    <div class="wf-detail-section">Key</div>
    <div class="wf-key-row"><span class="responsible">R</span>Responsible for the outcome</div>
    <div class="wf-key-row"><span class="involved">I</span>Actively involved or consulted</div>
    <div class="wf-key-row"><span>—</span>Not normally engaged</div>`;
}

function showRaciCell(rowIndex, colIndex) {
  ensureDetailOpen();
  const [stage, job, values] = RACI[rowIndex];
  const role = RACI_ROLES[colIndex];
  const value = values[colIndex];
  const meaning = value === 'R' ? 'Responsible' : value === 'I' ? 'Involved' : 'Not normally engaged';
  const panel = document.getElementById('wfDetail');
  panel.innerHTML = `
    <div class="wf-detail-type">${stage}</div>
    <div class="wf-detail-title">${job}</div>
    <div class="wf-detail-meta">${role.label} · ${role.sub}</div>
    <div class="wf-raci-status state-${value === 'R' ? 'responsible' : value === 'I' ? 'involved' : 'none'}">${meaning}</div>`;
}
