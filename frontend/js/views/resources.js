/**
 * resources.js — Resources view populated from the BTSS Select Territory Runbook.
 *
 * Sections (sidebar-filterable):
 *  1. Quick start — Day One top 5 + key tools + success metrics
 *  2. Go-to tools — Salesforce, Salesloft, Seismic, TechZone, etc.
 *  3. Focus products — what we sell + 2026 Seismic links
 *  4. Sales plays — GTM play index aligned to focus products
 *  5. Core motions — 5 BTSS execution motions
 *  6. GTM workflow — 6 phases of the deal cycle
 *  7. Operating rhythm — time allocation + weekly rituals
 *  8. Role guide — BTSS vs BSS vs BTS vs TSS + KPIs
 *  9. My team — Infrastructure team structure
 */

const SECTIONS = ['all', 'quick-start', 'tools', 'products', 'plays', 'motions', 'gtm', 'rhythm', 'roles', 'team'];

export async function renderResources(container) {
  container.innerHTML = `
    <div class="res-page" id="resPage">
      <div class="res-header">
        <div class="res-header-title">Resources</div>
        <div class="res-header-sub">BTSS · Infrastructure Colony · Select Territory · US All Market</div>
      </div>
      <div class="res-body" id="resBody">
        ${renderAll()}
      </div>
    </div>
  `;

  // Sidebar filter wiring
  document.addEventListener('sidebar:filter', e => {
    const { value } = e.detail;
    if (!SECTIONS.includes(value)) return;
    const body = document.getElementById('resBody');
    if (!body) return;
    body.innerHTML = value === 'all' ? renderAll() : renderSection(value);
  });
}

function renderAll() {
  return [
    renderSection('quick-start'),
    renderSection('tools'),
    renderSection('products'),
    renderSection('plays'),
    renderSection('motions'),
    renderSection('gtm'),
    renderSection('rhythm'),
    renderSection('roles'),
    renderSection('team'),
  ].join('');
}

function renderSection(id) {
  switch (id) {
    case 'quick-start': return quickStart();
    case 'tools':       return goToTools();
    case 'products':    return focusProducts();
    case 'plays':       return salesPlays();
    case 'motions':     return coreMotions();
    case 'gtm':         return gtmWorkflow();
    case 'rhythm':      return operatingRhythm();
    case 'roles':       return roleGuide();
    case 'team':        return myTeam();
    default:            return '';
  }
}

// ── helpers ──────────────────────────────────────────────────────
function section(title, body) {
  return `<div class="res-section"><div class="res-section-title">${title}</div>${body}</div>`;
}
function cards(items) {
  return `<div class="res-card-grid">${items.map(i => `
    <div class="res-card${i.href ? '" onclick="window.open(\''+i.href+'\',\'_blank\')"' : '"'}>
      <div class="res-card-name">${i.name}</div>
      <div class="res-card-desc">${i.desc}</div>
      ${i.href ? `<a class="res-card-link" href="${i.href}" target="_blank">${i.linkLabel || i.href} ↗</a>` : ''}
    </div>`).join('')}</div>`;
}
function pills(items, color) {
  return `<div class="res-product-list">${items.map(t =>
    `<span class="res-product-pill"${color ? ` style="color:${color};border-color:${color}33;background:${color}11"` : ''}>${t}</span>`
  ).join('')}</div>`;
}
function infoBox(text) {
  return `<div style="font-size:12px;color:#525252;line-height:1.7;margin-top:12px">${text}</div>`;
}
function checkList(items) {
  return `<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">
    ${items.map(i => `<li style="display:flex;gap:10px;font-size:13px;color:#c6c6c6">
      <span style="color:#4d7bff;flex-shrink:0">✓</span><span>${i}</span></li>`).join('')}
  </ul>`;
}
function motionCard(num, title, desc, actions, tools) {
  return `<div class="res-motion-card">
    <div class="res-motion-num">${num}</div>
    <div class="res-motion-content">
      <div class="res-motion-title">${title}</div>
      <div class="res-motion-desc">${desc}</div>
      <ul class="res-motion-actions">${actions.map(a => `<li>${a}</li>`).join('')}</ul>
      <div class="res-motion-tools">
        <span style="color:#525252;font-size:10px;text-transform:uppercase;letter-spacing:.4px">Tools: </span>
        <span style="color:#525252;font-size:11px">${tools}</span>
      </div>
    </div>
  </div>`;
}
function phaseRow(num, title, bullets) {
  return `<div class="res-phase">
    <div class="res-phase-num">Phase ${num}</div>
    <div>
      <div class="res-phase-title">${title}</div>
      <ul class="res-phase-bullets">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div>
  </div>`;
}

// ── 1. Quick Start ────────────────────────────────────────────────
function quickStart() {
  return section('Quick start — Day One', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,0.06);margin-bottom:20px">
      <div style="background:#0d0d0d;padding:18px 20px">
        <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:12px">Top 5 actions</div>
        <ol style="margin:0;padding-left:18px;color:#c6c6c6;font-size:13px;line-height:1.8">
          <li><strong style="color:#f4f4f4">Get to know your territory</strong> — access assigned accounts in Salesforce, prioritize using RevTech propensity scores.</li>
          <li><strong style="color:#f4f4f4">Draft your territory plan</strong> — use the provided template; identify whitespace, key contacts, and Business Partner coverage.</li>
          <li><strong style="color:#f4f4f4">Engage core roles &amp; Business Partners</strong> — align with SDRs, TSS/BSS &amp; Tech SMEs on lead flow, technical validation, and deals.</li>
          <li><strong style="color:#f4f4f4">Activate your sales motions</strong> — leverage product sales kits. Deliver fast, high-impact demos, trials &amp; POCs. Use Salesloft for outbound cadences.</li>
          <li><strong style="color:#f4f4f4">Track and progress opportunities</strong> — connect SalesLoft Conversations to capture client calls for AI automation; log all activities in Salesforce.</li>
        </ol>
      </div>
      <div style="background:#0d0d0d;padding:18px 20px">
        <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:12px">Success metrics</div>
        ${checkList([
          'Pipeline created and progressed (weekly)',
          'Win rate and deal velocity',
          'BP engagement and co-sell volume',
          'Data hygiene &amp; RevTech adoption',
          'SaaS signings and YoY revenue growth',
          'Deal volume, average deal size',
          'Client satisfaction and NPS improvement',
        ])}
        <div style="margin-top:16px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:8px">Who to contact</div>
        <div style="font-size:12px;color:#525252;line-height:1.9">First Line Manager (FLM) · SDR · TSS · Tech SME · Business Partners · Enablement</div>
      </div>
    </div>
    <div style="padding:14px 16px;background:rgba(77,123,255,0.07);border-left:2px solid #4d7bff;font-size:12px;color:#a8a8a8;line-height:1.7">
      <strong style="color:#4d7bff">Pro tips:</strong> Always share opportunities early with BPs — force multiplier!
      Use RevTech daily for prioritization. Keep your territory plan updated — review with your FLM monthly.
    </div>
  `);
}

// ── 2. Go-to Tools ────────────────────────────────────────────────
function goToTools() {
  return section('Go-to tools', cards([
    { name:'Salesforce (ISC)',      href:'https://ibm.salesforce.com',           linkLabel:'ibm.salesforce.com',  desc:'Account management, opportunity tracking, data hygiene. Log all activities and milestone updates here daily.' },
    { name:'Salesloft',             href:'https://salesloft.com',                linkLabel:'salesloft.com',       desc:'Outbound cadences and conversation capture. Connect to email and Teams to capture client conversations for AI automation.' },
    { name:'Seismic (IBM)',         href:'https://ibm.seismic.com',              linkLabel:'ibm.seismic.com',     desc:'Sales content management. Find decks, battle cards, sales kits, and product pages for all Focus Products.' },
    { name:'TechZone',              href:'https://techzone.ibm.com',             linkLabel:'techzone.ibm.com',    desc:'Demo and POC environment provisioning. Use for demos, trials, POVs/POXs, and technical fit validation.' },
    { name:'ZoomInfo / Sales Nav',  href:'https://www.zoominfo.com',             linkLabel:'zoominfo.com',        desc:'Contact discovery and buyer intent signals. Pair with RevTech dashboards for account prioritization.' },
    { name:'Partner Plus',          href:'https://www.ibm.com/partnerplus',      linkLabel:'ibm.com/partnerplus', desc:'BP programs, incentives, deal registration, and partner enablement assets.' },
    { name:'IBM w3 Intranet',       href:'https://w3.ibm.com',                   linkLabel:'w3.ibm.com',          desc:"IBM's internal hub for HR, benefits, tools, and announcements." },
    { name:'IBM Box',               href:'https://ibm.box.com',                  linkLabel:'ibm.box.com',         desc:'Cloud file storage for shared decks, proposals, and account documents.' },
    { name:'2026 Sales Plays',      href:'https://ibm.biz/sales-plays',          linkLabel:'ibm.biz/sales-plays', desc:'Official IBM GTM sales play index aligned to all Focus Products for 2026.' },
    { name:'Hybrid Cloud Sales Play', href:'https://ibm.seismic.com',            linkLabel:'ibm.seismic.com',     desc:'IBM-internal Seismic portal with Hybrid Cloud go-to-market plays and competitive positioning.' },
    { name:'Infrastructure Expert Labs', href:'https://www.ibm.com/partnerplus', linkLabel:'ibm.com/expertlabs', desc:'Technical advisory, architecture workshops, and implementation services for Power, Storage, and Fusion.' },
    { name:'Ecosystem.io',          href:'https://ecosystem.ibm.com',            linkLabel:'ecosystem.ibm.com',   desc:'Value co-creation platform with Business Partners. Use for joint opportunity tracking and GTM alignment.' },
  ]));
}

// ── 3. Focus Products ─────────────────────────────────────────────
function focusProducts() {
  return section('Focus products — Infrastructure', `
    ${pills(['IBM PowerVS','IBM FlashSystem','IBM Fusion','IBM z16','IBM LinuxONE','IBM Spectrum', 'Red Hat OpenShift'], '#a855f7')}
    ${infoBox('Infrastructure BTSSs cover <strong style="color:#a8a8a8">1–12 Focus and Key Core Products</strong> within the Infrastructure specialty. We sell to <strong style="color:#a8a8a8">300+ Select Activate accounts</strong> across all US markets, blending deep technical expertise with commercial sales execution.')}
    <div style="margin-top:20px">
      <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:12px">2026 Seismic links by product</div>
      <table class="res-team-table">
        <thead><tr><th>Brand</th><th>Product</th><th>Key Seismic resources</th></tr></thead>
        <tbody>
          <tr><td style="color:#a855f7">Infra</td><td style="color:#f4f4f4">Power VS</td><td style="color:#525252">Sales kit</td></tr>
          <tr><td style="color:#a855f7">Infra</td><td style="color:#f4f4f4">Fusion</td><td style="color:#525252">Sales kit, solution brief</td></tr>
          <tr><td style="color:#a855f7">Infra</td><td style="color:#f4f4f4">FlashSystem</td><td style="color:#525252">Product page, FAQs, demo</td></tr>
          <tr><td style="color:#0f62fe">Data</td><td style="color:#f4f4f4">watsonx Orchestrate</td><td style="color:#525252">Sales kit, product page</td></tr>
          <tr><td style="color:#0f62fe">Data</td><td style="color:#f4f4f4">watsonx.data</td><td style="color:#525252">Sales kit, product page, demos</td></tr>
          <tr><td style="color:#0f62fe">Data</td><td style="color:#f4f4f4">watsonx.governance</td><td style="color:#525252">Sales kit, demo</td></tr>
          <tr><td style="color:#0f62fe">Data</td><td style="color:#f4f4f4">Guardium</td><td style="color:#525252">Sales kit, packaging overview</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">Terraform</td><td style="color:#525252">Sales kit, product page, pitch deck</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">Instana</td><td style="color:#525252">Sales kit, solution brief, battlecard</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">Concert</td><td style="color:#525252">Sales kit, demo, client engagement best practices</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">webMethods / Hybrid Integration</td><td style="color:#525252">Sales kit, intro video, seller presentation</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">Maximo</td><td style="color:#525252">Sales kit, prospecting playbook, demo</td></tr>
          <tr><td style="color:#6c63ff">Auto</td><td style="color:#f4f4f4">Vault / Verify / NS1</td><td style="color:#525252">Sales kit, product page, pitch deck / product playbook / solution brief</td></tr>
        </tbody>
      </table>
    </div>
  `);
}

// ── 4. Sales Plays ────────────────────────────────────────────────
function salesPlays() {
  const plays = [
    { theme:'Boost Productivity with AI Agents',   play:'Extend existing workloads consistently to the cloud without complexity',    products:'Power VS' },
    { theme:'Unlock Innovation with Hybrid Cloud', play:'Secure, data-centric AI infrastructure',                                   products:'Red Hat OpenShift, Red Hat AI, Fusion' },
    { theme:'Unlock Innovation with Hybrid Cloud', play:'Seamlessly modernize and move apps with data across hybrid cloud',          products:'Fusion' },
    { theme:'Unlock Innovation with Hybrid Cloud', play:'AI-driven cyber and operational resilience',                               products:'FlashSystem' },
    { theme:'Unlock Innovation with Hybrid Cloud', play:'Modernize core applications and data for AI and business continuity',      products:'Power 11, Red Hat Portfolio' },
    { theme:'Unlock Innovation with Hybrid Cloud', play:'Deliver AI at speed and scale for mission-critical workloads',             products:'IBM Z' },
    { theme:'Automate Technology and Operations',  play:'Automate IT Resiliency',                                                   products:'Concert' },
    { theme:'Automate Technology and Operations',  play:'Observability simplified: Zero config, full context, instant answers',     products:'Instana' },
    { theme:'Automate Technology and Operations',  play:'Streamline Asset and Facility Operations',                                 products:'Maximo' },
    { theme:'Automate Technology and Operations',  play:'Accelerate Seamless Hybrid Cloud Automation',                              products:'Terraform + Vault + Red Hat OpenShift + Ansible' },
    { theme:'Maximize the Value of Enterprise Data', play:'Deliver AI-ready Data with Real-time Context, for Reliable AI',         products:'watsonx.data' },
    { theme:'Maximize the Value of Enterprise Data', play:'Discover, Govern, and Protect Data at the Speed of AI',                 products:'watsonx.data intelligence' },
  ];
  return section('2026 Sales plays', `
    <div style="margin-bottom:12px;font-size:12px;color:#525252;line-height:1.6">
      Full index at <a href="https://ibm.biz/sales-plays" target="_blank" style="color:#4d7bff">ibm.biz/sales-plays ↗</a>.
      Infra-relevant plays highlighted.
    </div>
    <table class="res-team-table">
      <thead><tr><th>Theme</th><th>Play</th><th>Lead-with products</th></tr></thead>
      <tbody>${plays.map(p => `
        <tr>
          <td style="color:#6c63ff;white-space:nowrap;font-size:11px">${p.theme}</td>
          <td style="color:#c6c6c6">${p.play}</td>
          <td><span class="res-role-pill" style="white-space:nowrap">${p.products}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  `);
}

// ── 5. Core Motions ───────────────────────────────────────────────
function coreMotions() {
  return section('BTSS core motions', `
    <div style="display:flex;flex-direction:column;gap:12px">
      ${motionCard(1, 'Territory Prioritization & Technical Prospecting',
        'Activate demand and identify high-value opportunities through data-driven technical discovery.',
        [
          'Use RevTech insights (buying signals, intent, scoring) to determine weekly outreach focus.',
          'Conduct outbound technical discovery across assigned accounts to surface needs.',
          'Build and maintain territory plans that map whitespace, product alignment, and BP coverage.',
          'Work with SDRs to refine technical qualification and improve warm-transfer conversions.',
        ],
        'RevTech dashboards, ISC, ZoomInfo/Sales Navigator, SalesLoft, Quip territory plans'
      )}
      ${motionCard(2, 'Technical Sales Execution & Opportunity Progression',
        'The heart of the BTSS role — combining technical expertise with sales execution to progress and accelerate deals.',
        [
          'Lead technical discovery, validate technical requirements, and shape solution architecture.',
          'Deliver high-impact demos, trials, POVs/POXs that prove value quickly.',
          'Provide competitive insight and differentiation to strengthen value positioning.',
          'Maintain progression momentum: define next steps, confirm stakeholder alignment, document milestones.',
          'Own end-to-end progression for Focus &amp; Key Core Products in partnership with Business Partners.',
        ],
        'TechZone, Seismic, CPQ (SAP quoting), Ecosystem.io, SalesLoft Conversations'
      )}
      ${motionCard(3, 'Lead Management & Marketing Alignment',
        'Ensure technical leads and inbound signals are evaluated and qualified with speed and rigor.',
        [
          'Review inbound technical leads daily; apply routing criteria to determine BTSS or BP ownership.',
          'Collaborate with SDRs on signal interpretation, qualification improvements, and lead triage.',
          'Use lead scoring, routing logic, and RevTech qualification insights to improve conversion.',
          'Provide technical feedback to marketing on campaign effectiveness and ICP refinement.',
        ],
        'ISC lead scoring, Marketo Sales Insights, DemandBase intent'
      )}
      ${motionCard(4, 'Business Partner Enablement & Deal Collaboration',
        'Business Partners are the primary scale engine in Select Territory. Enable and guide them through technical validation.',
        [
          'Identify the right BP using the Ideal Partner Profile (IPP) and engage early.',
          'Provide partners with technical context, demo assets, use cases, and architectural guidance.',
          'Support technical requirements for BP-led opportunities (validation, sizing, solution design).',
          'Track BP progression and step in when technical depth or acceleration is needed.',
          'Enable partners on key Focus &amp; Key Core Products to improve coverage and win rates.',
        ],
        'Partner Plus, BP dashboards, Ecosystem.io, Auto Deal Share'
      )}
      ${motionCard(5, 'Technology Enablement & Data Hygiene',
        'Rely on clean data and AI-supported insights to scale across a large book of accounts.',
        [
          'Use RevTech insights to guide weekly prioritization and opportunity inspection.',
          'Keep ISC updated with technical notes, milestones, next steps, and BP ownership.',
          'Ensure data consistency across ISC, routing logic, and RevTech scoring.',
          'Adopt new AI tools for coaching, activity capture, and technical fit modeling.',
        ],
        'ISC, RevTech, TechZone, People.ai, AI coaching modules'
      )}
    </div>
  `);
}

// ── 6. GTM Workflow ───────────────────────────────────────────────
function gtmWorkflow() {
  return section('GTM workflow — 6 phases', `
    <div style="display:flex;flex-direction:column;gap:0">
      ${phaseRow(1, 'Demand Creation', [
        'SDRs drive top-of-funnel demand through inbound/outbound outreach, qualification, and routing.',
        'BTSS/TSS deliver scaled technical motions for Focus/Key Core (BTSS) &amp; Non-Focus (TSS) products.',
        'TPS enables partners by aligning them to priority plays and supporting scalable demand.',
        '<em>Key principle:</em> SDR-led demand entry can originate from IBM or partners.',
      ])}
      ${phaseRow(2, 'Opportunity Qualification & Progression', [
        'BTSS leads opportunity discovery, qualification, &amp; progression for Focus &amp; Key Core products.',
        'TSS manages Non-Focus Products to ensure full portfolio coverage.',
        'PTS engages the right Business Partner early; BTS/PTS provides technical validation and PoXs.',
        '<em>Key principle:</em> Sales leads progression; TPS accelerates through technical validation.',
      ])}
      ${phaseRow(3, 'Working with Partners Through Progression', [
        'TPS &amp; PTS collaborate on execution, including GTM alignment &amp; performance management.',
        'BTS/PTS handles technical execution — solution design, demos, trials, and consumption readiness.',
        '<em>Key principle:</em> TPS ensures partner performance and supports scalable partner execution.',
      ])}
      ${phaseRow(4, 'Transaction Completion & Portfolio Coverage', [
        'BTSS closes Focus Product transactions; TSS closes Non-Focus Product transactions.',
        'TPS ensures compliance with deal execution and marketplace motions.',
        'BTS/PTS confirms technical readiness and solution integrity before close.',
        '<em>Key principle:</em> Transactions are IBM-led and partner-enabled; clean execution matters.',
      ])}
      ${phaseRow(5, 'Adoption', [
        'CSM drives scaled onboarding and adoption using AI-driven signals &amp; automation with partners.',
        'PTS supports partner on deployment; TPS ensures partner accountability for adoption.',
        '<em>Key principle:</em> CSMs ensure clients get value from their investment.',
      ])}
      ${phaseRow(6, 'Retention and Expansion', [
        'CSM responds to risk signals ensuring strong renewal rates.',
        'When expansion or cross-sell signals appear, CSM routes insights to BTSS/TSS for new opportunities.',
        '<em>Key principle:</em> CSMs fuel growth by converting adoption signals into pipeline.',
      ])}
    </div>
  `);
}

// ── 7. Operating Rhythm ───────────────────────────────────────────
function operatingRhythm() {
  const areas = [
    { name:'Sales & Technical Execution',        pct:'50%', freq:'Weekly / Monthly',   actions:['Run structured discovery calls to validate needs and position Focus products.','Create short value-based pitches tailored to account needs.','Design POCs/POXs, demos, and trials to demonstrate solution value.','Progress in-flight deals by coordinating with BPs and technical resources.','Conduct win/loss reviews for recently closed deals.'] },
    { name:'Territory Prospecting & Collaboration', pct:'15%', freq:'Weekly / Monthly',actions:['Review assigned accounts using RevTech insights to determine weekly outreach focus.','Conduct proactive outbound engagement (calls, emails, digital touchpoints).','Meet with SDR weekly to review warm transfers and refine qualification approaches.','Update territory coverage plans based on buying signals and BP motions.'] },
    { name:'BP & Ecosystem Engagement',           pct:'15%', freq:'Weekly / Monthly',  actions:['Build relationships with BPs in the same territory, industry, and brand.','Conduct meetings with BPs to hand off opportunities and align on next steps.','Track BP progression of opportunities and follow up to remove blockers.','Share account insights, product messaging updates, and digital sales assets.'] },
    { name:'Marketing & Lead Management',         pct:'10%', freq:'Daily / Weekly',    actions:['Review inbound leads and signals from SDRs and marketing each morning.','Apply scoring and routing logic to determine when to bring in a BP.','Conduct structured lead-quality reviews with SDRs to improve conversion rates.'] },
    { name:'Technology Enablement',               pct:'10%', freq:'Daily / Weekly',    actions:['Use RevTech dashboards to monitor territory buying signals and opportunity health.','Consistently log deal progression in ISC and maintain data hygiene.','Test new digital engagement sequences and measure response rates.','Join enablement sessions on new AI-powered features and scoring models.'] },
  ];
  return section('Operating rhythm — time allocation', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,0.06);margin-bottom:20px">
      ${areas.map(a => `
        <div style="background:#0d0d0d;padding:16px 18px">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px">
            <span style="font-size:20px;font-weight:300;color:#4d7bff">${a.pct}</span>
            <span style="font-size:12px;font-weight:500;color:#c6c6c6">${a.name}</span>
          </div>
          <div style="font-size:10px;color:#525252;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">${a.freq}</div>
          <ul style="margin:0;padding-left:14px;color:#525252;font-size:11px;line-height:1.75">
            ${a.actions.map(x => `<li>${x}</li>`).join('')}
          </ul>
        </div>`).join('')}
    </div>
    <div style="padding:14px 16px;background:rgba(77,123,255,0.07);border-left:2px solid #4d7bff;font-size:12px;color:#a8a8a8;line-height:1.7">
      <strong style="color:#4d7bff">Mantra:</strong> Lead with speed, execute with discipline, grow through volume.
      The system is the job — high-velocity pipeline creation, progressed qualified opportunities, and expanding revenue.
    </div>
  `);
}

// ── 8. Role Guide ─────────────────────────────────────────────────
function roleGuide() {
  return section('Role guide — Select Territory', `
    <table class="res-team-table" style="margin-bottom:20px">
      <thead><tr><th></th><th style="color:#0f62fe">BSS</th><th style="color:#24a148">BTS</th><th style="color:#a855f7">BTSS</th><th style="color:#6c63ff">TSS</th></tr></thead>
      <tbody>
        <tr><td style="color:#525252">Sub-segment</td><td>Growth &amp; Activate</td><td>Growth &amp; Activate</td><td><strong style="color:#a855f7">Activate</strong></td><td>Growth &amp; Activate</td></tr>
        <tr><td style="color:#525252">Product coverage</td><td>1–5 Focus Products</td><td>1–5 Focus Products</td><td><strong style="color:#a855f7">1–12 Focus + Key Core</strong></td><td>Entire portfolio (1 of 3 brands)</td></tr>
        <tr><td style="color:#525252">Client coverage</td><td>~50 high-potential</td><td>~100 high-potential</td><td><strong style="color:#a855f7">300+ accounts</strong></td><td>200+ accounts</td></tr>
        <tr><td style="color:#525252">Function</td><td>Sales</td><td>Tech</td><td><strong style="color:#a855f7">Sales &amp; tech sales</strong></td><td>Sales</td></tr>
        <tr><td style="color:#525252">Deployment</td><td>Field</td><td>Field / Center</td><td>Center</td><td>Center</td></tr>
        <tr><td style="color:#525252">Geo</td><td>AM &amp; EMEA only</td><td>AM &amp; EMEA only</td><td>All geos</td><td>All geos</td></tr>
      </tbody>
    </table>
    <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:12px">KPIs you may be evaluated on</div>
    ${checkList([
      'Annualized Revenue and Signings (perpetual, subscription, and SaaS licenses)',
      'Deal volume (number of deals and average deal size)',
      'Deal velocity (average lead-to-conversion time)',
      'SaaS signings',
      'YoY or QoQ revenue growth in assigned portfolio',
      'Win rate',
      'Client satisfaction and NPS improvement',
    ])}
    <div style="margin-top:20px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:#525252;margin-bottom:12px">Role interaction frequency</div>
    <table class="res-team-table">
      <thead><tr><th>Role</th><th>Frequency</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td style="color:#f4f4f4">FLM</td><td><span class="res-role-pill">Regular</span></td><td style="color:#525252">Report directly; periodic touchpoints with TSS FLMs to ensure coordination on shared accounts.</td></tr>
        <tr><td style="color:#f4f4f4">SDR</td><td><span class="res-role-pill">Regular</span></td><td style="color:#525252">Warm transfers of leads; refine technical qualification and improve conversion.</td></tr>
        <tr><td style="color:#f4f4f4">TPS</td><td><span class="res-role-pill">Ad hoc</span></td><td style="color:#525252">Joint support for deal progression (proposal terms, negotiation, closing) on strategic deals.</td></tr>
        <tr><td style="color:#f4f4f4">PTS</td><td><span class="res-role-pill">Ad hoc</span></td><td style="color:#525252">Technical insight on products/solutions for strategic deals or stalled progression.</td></tr>
        <tr><td style="color:#f4f4f4">TSS</td><td><span class="res-role-pill">Ad hoc</span></td><td style="color:#525252">Coordinate general portfolio sales; weekly joint portfolio review calls on shared accounts.</td></tr>
        <tr><td style="color:#f4f4f4">Tech SMEs</td><td><span class="res-role-pill">Ad hoc</span></td><td style="color:#525252">Technical demos, fit validation, POCs/POXs.</td></tr>
        <tr><td style="color:#f4f4f4">CSM</td><td><span class="res-role-pill">Ad hoc</span></td><td style="color:#525252">Post-close context handoff; re-engage for expansion (up-sell and cross-sell) opportunities.</td></tr>
      </tbody>
    </table>
  `);
}

// ── 9. My Team ────────────────────────────────────────────────────
function myTeam() {
  return section('My team', `
    <table class="res-team-table" style="margin-bottom:20px">
      <thead><tr><th>Name</th><th>Role</th><th>Function</th><th>Counterpart</th></tr></thead>
      <tbody>
        <tr><td><strong style="color:#f4f4f4">Chris Kennedy</strong></td><td><span class="res-role-pill">Manager</span></td><td style="color:#525252">BTSS Manager</td><td style="color:#525252">—</td></tr>
        <tr><td><strong style="color:#f4f4f4">Rob Hanes</strong></td><td><span class="res-role-pill">Manager</span></td><td style="color:#525252">TSS Manager</td><td style="color:#525252">—</td></tr>
        <tr><td><strong style="color:#f4f4f4">Mark Hoffman</strong></td><td><span class="res-role-pill">BTSS</span></td><td style="color:#525252">Brand Technical Sales Specialist</td><td style="color:#60a5fa">Ross Holley (TSS)</td></tr>
        <tr><td><strong style="color:#f4f4f4">Armada Veraepalli</strong></td><td><span class="res-role-pill">BTSS</span></td><td style="color:#525252">Brand Technical Sales Specialist</td><td style="color:#60a5fa">Patrick McBride (TSS)</td></tr>
        <tr><td><strong style="color:#f4f4f4">Ross Holley</strong></td><td><span class="res-role-pill">TSS</span></td><td style="color:#525252">Territory Sales Specialist</td><td style="color:#a78bfa">Mark Hoffman (BTSS)</td></tr>
        <tr><td><strong style="color:#f4f4f4">Patrick McBride</strong></td><td><span class="res-role-pill">TSS</span></td><td style="color:#525252">Territory Sales Specialist</td><td style="color:#a78bfa">Armada Veraepalli (BTSS)</td></tr>
        <tr><td><strong style="color:#4d7bff">Sydney Chin (you)</strong></td><td><span class="res-role-pill">Intern</span></td><td style="color:#525252">BTSS Intern</td><td style="color:#525252">—</td></tr>
      </tbody>
    </table>
    ${infoBox('We sell <strong style="color:#a8a8a8">IBM Infrastructure</strong> to <strong style="color:#a8a8a8">all US enterprise accounts</strong> — focusing on hybrid cloud workloads using IBM Power, Storage, and Fusion platforms. BTSS provides deep technical sales expertise to complement TSS commercial coverage.')}
  `);
}
