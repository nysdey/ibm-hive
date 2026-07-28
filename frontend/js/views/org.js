/**
 * org.js — Organization tab: expanding honeycomb
 *
 * Purpose: "Where does my role fit in IBM?"
 *
 * Role-centric only. No employee names.
 * Layout: hive fills left side, permanent detail panel on right.
 * Selecting a role highlights its worksWith peers in the hive.
 */

// ─────────────────────────────────────────────────────────────────
// Data — role-centric, no people names
// youAreHere = true on the user's actual segment + function
// User: BTSS in Select Territory
// ─────────────────────────────────────────────────────────────────

const SEGMENTS = [
  {
    id: 'enterprise',
    label: 'Enterprise',
    sub: 'Client Segment',
    clientCount: '143 Clients',
    desc: 'IBM\'s top accounts with joint coverage between Technology and Consulting. Clients qualify based on significant investment across both Technology and Consulting. Highest-touch account model with dedicated Client Engineering squads. Examples: JPMorgan Chase, ExxonMobil, General Motors, Boeing.',
    functions: [
      {
        id: 'cse-e', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption post-sale. Provides deep hands-on enablement to ensure clients realize value from IBM technology.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'CSE Lead → VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion',
        segment: 'Enterprise',
      },
      {
        id: 'atl-e', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Provides overall technical leadership across an Enterprise account. Owns the technical architecture strategy and ensures IBM solutions align to the client\'s roadmap.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'VP → IBM Sales Leader',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Enterprise',
      },
      {
        id: 'ce-e', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad that rapidly builds pilots, proofs, and production-ready solutions alongside clients.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → VP',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Enterprise',
      },
      {
        id: 'ae-e', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary commercial relationship owner for Enterprise accounts. Coordinates all IBM resources and owns the overall commercial outcome.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'VP → IBM Sales Leader',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership from Prospect to Renewal',
        segment: 'Enterprise',
      },
    ],
  },
  {
    id: 'strategic',
    label: 'Strategic',
    sub: 'Client Segment',
    clientCount: '446 Clients',
    desc: 'Clients that have made strategic bets or have a sizeable footprint with IBM in Technology. Dedicated coverage with director-level oversight. Examples: Fidelity Investments, Anthem, Lockheed Martin, FedEx.',
    functions: [
      {
        id: 'cse-s', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption and expansion across strategic accounts. Deep technical enablement post-close.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'Director → VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion → Renewal',
        segment: 'Strategic',
      },
      {
        id: 'atl-s', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Overall technical leadership for strategic accounts. Owns the technical relationship and architecture decisions.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'Director → VP',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Strategic',
      },
      {
        id: 'ce-s', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad. Rapidly builds pilots and proofs for strategic accounts.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → Director',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Strategic',
      },
      {
        id: 'ae-s', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary relationship owner for strategic accounts. Coordinates full IBM coverage team and owns commercial outcome.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'Director → VP',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership',
        segment: 'Strategic',
      },
    ],
  },
  {
    id: 'horizon',
    label: 'Select Horizon',
    sub: 'Client Segment',
    clientCount: '1,589 Clients',
    desc: 'Current IBM clients with potential for future growth and expansion. With dedicated support, Horizon accounts become the next Strategic Clients. Higher-touch than Territory. Examples: Regional banks, mid-size manufacturers, healthcare systems.',
    hierarchy: [
      {
        id:'horizon-sales-roles', label:'Sales', kind:'Role Group',
        children:[{
          id:'horizon-tsl-flm', label:'TSL FLM', sub:'Technology Sales Leader First-Line Manager', kind:'Role',
          children:[{
            id:'horizon-tsl', label:'TSL', sub:'Technology Sales Leader', kind:'Role',
            children:[{ id:'horizon-bss', label:'BSS', sub:'Brand Sales Specialist', kind:'Role' }],
          }],
        }],
      },
      {
        id:'horizon-technical-roles', label:'Technical', kind:'Role Group',
        children:[
          {
            id:'horizon-atl-flm', label:'ATL FLM', sub:'Account Technical Leader First-Line Manager', kind:'Role',
            children:[{
              id:'horizon-atl', label:'ATL', sub:'Account Technical Leader', kind:'Role',
              children:[{ id:'horizon-cse', label:'CSE', sub:'Customer Success Engineer', kind:'Role' }],
            }],
          },
          { id:'horizon-ce', label:'CE', sub:'Client Engineering', kind:'Role' },
          { id:'horizon-sme', label:'SME', sub:'Subject Matter Expert', kind:'Role' },
        ],
      },
    ],
    crossLinks:[['horizon-tsl','horizon-atl']],
    functions: [
      {
        id: 'ae-h', abbr: 'AE', label: 'Account Executive',
        purpose: 'Primary client relationship owner. Coordinates all IBM resources and owns the overall commercial outcome for Horizon accounts.',
        worksWith: ['ATL', 'CSE', 'Client Engineering'],
        reportsThrough: 'Colony VP',
        ownsAccounts: true,
        salesMotion: 'Full-cycle account ownership from Prospect to Renewal',
        segment: 'Select Horizon',
        category: 'Sales Roles',
      },
      {
        id: 'cse-h', abbr: 'CSE', label: 'Customer Success Engineer',
        purpose: 'Drive technical adoption in Horizon accounts. Partners with ATL to identify expansion opportunities and ensure value realization.',
        worksWith: ['ATL', 'Client Engineering', 'AE'],
        reportsThrough: 'CSE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Expansion',
        segment: 'Select Horizon',
        category: 'Sales Roles',
      },
      {
        id: 'atl-h', abbr: 'ATL', label: 'Account Technical Leader',
        purpose: 'Provides overall technical leadership for Horizon accounts. Owns the technical strategy and solution alignment.',
        worksWith: ['CSE', 'Client Engineering', 'AE'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Discovery → Architecture → Ongoing advisory',
        segment: 'Select Horizon',
        category: 'Technical Roles',
      },
      {
        id: 'ce-h', abbr: 'CE', label: 'Client Engineering',
        purpose: 'Cross-functional technical squad that rapidly builds pilots and proofs. Engaged post-discovery to accelerate technical evaluation.',
        worksWith: ['ATL', 'CSE', 'AE'],
        reportsThrough: 'CE Lead → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Technical Evaluation → PoC → Production readiness',
        segment: 'Select Horizon',
        category: 'Technical Roles',
      },
    ],
  },
  {
    id: 'territory',
    label: 'Select Territory',
    sub: 'Client Segment',
    clientCount: '420k Clients',
    desc: 'Digital-first, scaled sales model. Clients buy primarily Technology or Consulting, often through Ecosystem partners. Divided into Select Territory Growth (1,796 clients) and Select Territory Activate. Examples: Small and mid-size businesses, startups, SMB retail, local government.',
    youAreHere: true,
    hierarchy: [
      {
        id:'select-t-growth', label:'Select T Growth', sub:'Client Sub-Segment', clientCount:'1,800 Clients', kind:'Client Motion',
        desc:'Higher-potential Select Territory clients receiving a more focused growth motion and coordinated coverage.',
      },
      {
        id:'select-t-activate', label:'Select T Activate', sub:'Client Sub-Segment', clientCount:'418,200 Clients', kind:'Client Motion', youAreHere:true,
        desc:'Scaled, digital-first coverage for the broad Select Territory client base.',
        children:[
          {
            id:'activate-data', label:'Data', sub:'Brand', kind:'Brand',
            desc:'Data and AI offerings organized around productivity, trusted data, governance, analytics, and planning.',
            children:[
              {
                id:'specialty-ai-productivity', label:'AI-Powered Productivity', sub:'Specialty', kind:'Specialty',
                desc:'AI products that help employees and business teams automate work, build assistants, and apply trusted generative AI.',
                products:'watsonx.ai, watsonx Orchestrate, IBM Granite, watsonx Code Assistant, IBM AI assistants',
              },
              {
                id:'specialty-data-trust', label:'Data Trust & Planning', sub:'Specialty', kind:'Specialty',
                desc:'Products for trusted data foundations, governance, analytics, integration, and enterprise planning.',
                products:'watsonx.data, watsonx.governance, Cloud Pak for Data, DataStage, Knowledge Catalog, Cognos Analytics, Planning Analytics',
              },
            ],
          },
          {
            id:'activate-automation', label:'Automation', sub:'Brand', kind:'Brand',
            desc:'Automation software spanning application delivery, integration, identity, observability, and operational optimization.',
            children:[
              {
                id:'specialty-devops', label:'DevOps', sub:'Specialty', kind:'Specialty',
                desc:'Products for application delivery, observability, cost management, and software lifecycle optimization.',
                products:'Instana, Turbonomic, Apptio, Cloudability, Concert, UrbanCode',
              },
              {
                id:'specialty-integration', label:'Integration', sub:'Specialty', kind:'Specialty',
                desc:'Connect applications, APIs, events, files, and data across hybrid environments.',
                products:'webMethods, API Connect, IBM MQ, Event Automation, App Connect, Sterling',
              },
              {
                id:'specialty-secure-access', label:'Secure Access & Identity', sub:'Specialty', kind:'Specialty',
                desc:'Identity, access, authentication, and privileged-access capabilities for employees and consumers.',
                products:'IBM Security Verify, Verify Governance, Verify Privilege, MaaS360',
              },
              {
                id:'specialty-assistant-ops', label:'Assistant & Op Optimization', sub:'Specialty', kind:'Specialty',
                desc:'AI assistants and operational automation that improve decisions, workflows, asset performance, and service delivery.',
                products:'watsonx Orchestrate, Maximo Application Suite, Business Automation Workflow, Operational Decision Manager, Process Mining',
              },
            ],
          },
          {
            id:'activate-infrastructure', label:'Infrastructure', sub:'Brand', kind:'Brand', youAreHere:true,
            desc:'Infrastructure offerings for modernization, hybrid cloud, resilient data, enterprise compute, and AI-ready platforms.',
            children:[
              {
                id:'specialty-infra-modernization', label:'Infrastructure Modernization', sub:'Specialty', kind:'Specialty', youAreHere:true,
                desc:'Modernize servers, storage, data resilience, and hybrid infrastructure. Your BTSS focus is PowerVS, FlashSystem, and Fusion.',
                products:'PowerVS, FlashSystem, IBM Fusion, IBM Power, Storage Defender, Storage Insights, IBM Z, LinuxONE',
                children:[
                  {
                    id:'infra-sales-roles', label:'Sales', kind:'Role Group', youAreHere:true,
                    children:[
                      { id:'infra-sdr', label:'SDR', sub:'Sales Development Representative', kind:'Role', desc:'Generates and qualifies infrastructure pipeline, then hands opportunities into the territory coverage team.' },
                      { id:'infra-csm', label:'CSM', sub:'Customer Success Manager', kind:'Role', desc:'Guides adoption, value realization, renewal readiness, and growth after a solution is purchased.' },
                      {
                        id:'infra-markets', label:'Markets', sub:'Market Coverage', kind:'Market', youAreHere:true, desc:'Aligns infrastructure coverage and opportunity execution to the applicable client market.',
                        children:[
                          { id:'market-commercial', label:'Commercial & Distribution', kind:'Market', youAreHere:true, children:[
                            { id:'market-commercial-btss', label:'BTSS', sub:'Brand Technical Sales Specialist', kind:'Role', youAreHere:true, desc:'Hybrid sales and technical role covering 1-12 Focus and Key Core products across approximately 300+ Select Activate accounts.' },
                            { id:'market-commercial-tss', label:'TSS', sub:'Territory Sales Specialist', kind:'Role', desc:'Sales role covering the broader portfolio within one brand across approximately 200+ Select Territory accounts.' },
                          ]},
                          { id:'market-fss', label:'FSS / Public', kind:'Market', children:[
                            { id:'market-fss-btss', label:'BTSS', sub:'Brand Technical Sales Specialist', kind:'Role', desc:'Hybrid sales and technical role covering 1-12 Focus and Key Core products across approximately 300+ Select Activate accounts.' },
                            { id:'market-fss-tss', label:'TSS', sub:'Territory Sales Specialist', kind:'Role', desc:'Sales role covering the broader portfolio within one brand across approximately 200+ Select Territory accounts.' },
                          ]},
                          { id:'market-industrial', label:'Industrial', kind:'Market', children:[
                            { id:'market-industrial-btss', label:'BTSS', sub:'Brand Technical Sales Specialist', kind:'Role', desc:'Hybrid sales and technical role covering 1-12 Focus and Key Core products across approximately 300+ Select Activate accounts.' },
                            { id:'market-industrial-tss', label:'TSS', sub:'Territory Sales Specialist', kind:'Role', desc:'Sales role covering the broader portfolio within one brand across approximately 200+ Select Territory accounts.' },
                          ]},
                        ],
                      },
                    ],
                  },
                  {
                    id:'infra-technical-roles', label:'Technical', kind:'Role Group',
                    children:[
                      { id:'infra-sme', label:'SME', sub:'Technical Specialist', kind:'Role', desc:'Provides deep product or architecture expertise for complex infrastructure opportunities.' },
                      { id:'infra-ce', label:'CE', sub:'Client Engineering', kind:'Role', desc:'Builds and validates client solutions through co-creation, pilots, and proofs.' },
                      {
                        id:'infra-bts', label:'BTS', sub:'Brand Technical Specialist', kind:'Role',
                        desc:'Technical role covering 1-5 Focus Products across approximately 100 high-potential accounts, leading technical discovery, demos, trials, POCs, and solution validation.',
                        children:[
                          { id:'infra-power-cloud-bts', label:'Power/Cloud BTS', sub:'Power and Cloud Brand Technical Specialist', kind:'Role', desc:'Covers PowerVS and related Power and hybrid-cloud technical motions.' },
                          { id:'infra-storage-bts', label:'Storage BTS', sub:'Storage Brand Technical Specialist', kind:'Role', desc:'Covers FlashSystem, Fusion, and related storage modernization motions.' },
                        ],
                      },
                    ],
                  },
                  {
                    id:'infra-ecosystem-roles', label:'Ecosystem', kind:'Role Group',
                    children:[
                      { id:'infra-tps', label:'TPS', sub:'Technology Partner Specialist', kind:'Role', desc:'Drives partner strategy, enablement, and co-sell execution for infrastructure.' },
                      { id:'infra-pts', label:'PTS', sub:'Partner Technical Specialist', kind:'Role', desc:'Provides technical enablement, demos, and solution support for Business Partners.' },
                      { id:'infra-distributors', label:'Distributors', kind:'Ecosystem', desc:'Channel distributors that support partner coverage, enablement, fulfillment, and scale.', children:[
                        { id:'infra-bp', label:'BPs', sub:'Business Partners', kind:'Ecosystem', desc:'Partner organizations that source, influence, resell, and implement IBM infrastructure solutions.' },
                      ]},
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    crossLinks:[
      ['market-commercial-btss','market-commercial-tss'],
      ['market-fss-btss','market-fss-tss'],
      ['market-industrial-btss','market-industrial-tss'],
    ],
    functions: [
      {
        id: 'btss-t', abbr: 'BTSS', label: 'Brand Technical Sales Specialist',
        purpose: 'Technical discovery, demos, POCs, solution validation, and deal progression for 1–12 specialized IBM products. Paired with TSS for joint coverage across a territory.',
        worksWith: ['TSS', 'SDR', 'Business Partners', 'Tech SME', 'CSM'],
        reportsThrough: 'BTSS Manager → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Technical Discovery → Demo → POC → Solution Validation → Deal Progression',
        segment: 'Select Territory',
        youAreHere: true,
        products: 'Focused on 1–12 products within a specialty (e.g. PowerVS, FlashSystem, Fusion, z16, LinuxONE)',
        category: 'Sales Roles',
      },
      {
        id: 'tss-t', abbr: 'TSS', label: 'Territory Sales Specialist',
        purpose: 'Cross-brand sales across a defined territory. Paired with BTSS for joint technical and commercial coverage. Owns territory quota.',
        worksWith: ['BTSS', 'SDR', 'Business Partners'],
        reportsThrough: 'TSS Manager → Colony VP',
        ownsAccounts: true,
        salesMotion: 'Prospecting → Discovery → Paired close with BTSS',
        segment: 'Select Territory',
        category: 'Sales Roles',
      },
      {
        id: 'sdr-t', abbr: 'SDR', label: 'Sales Development Rep',
        purpose: 'Pipeline generation through outbound prospecting. Qualifies leads and books discovery calls for TSS and BTSS.',
        worksWith: ['TSS', 'BTSS'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Outbound → Qualification → Handoff to TSS/BTSS',
        segment: 'Select Territory',
        category: 'Sales Roles',
      },
      {
        id: 'csm-t', abbr: 'CSM', label: 'Customer Success Manager',
        purpose: 'Drive post-sale adoption and value realization. Monitor account health, flag renewal risk, and coordinate expansion motions.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Post-Close → Adoption → Renewal → Expansion',
        segment: 'Select Territory',
        category: 'Technical Roles',
      },
      {
        id: 'sme-t', abbr: 'Tech SME', label: 'Technical Subject Matter Expert',
        purpose: 'Deep specialist on a specific technology domain. Engaged for complex technical questions that require beyond-BTSS expertise.',
        worksWith: ['BTSS', 'TSS', 'Client Engineering'],
        reportsThrough: 'Technical Leader → Colony VP',
        ownsAccounts: false,
        salesMotion: 'Engaged on-demand at any technical escalation point',
        segment: 'Select Territory',
        category: 'Technical Roles',
      },
      {
        id: 'tps-t', abbr: 'TPS', label: 'Technology Partner Specialist',
        purpose: 'Manage and enable Business Partner relationships for a technology domain. Drive partner-sourced pipeline and co-sell execution.',
        worksWith: ['BTSS', 'TSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner enablement → Co-sell → Channel close',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
      },
      {
        id: 'pts-t', abbr: 'PTS', label: 'Partner Technical Specialist',
        purpose: 'Provide technical enablement and pre-sales support to Business Partners. Runs demos and POCs with partners on behalf of IBM.',
        worksWith: ['TPS', 'BTSS', 'Business Partners'],
        reportsThrough: 'Colony VP',
        ownsAccounts: false,
        salesMotion: 'Partner Technical Enablement → Partner-led POC → Channel close',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
      },
      {
        id: 'bp-t', abbr: 'BP', label: 'Business Partners',
        purpose: 'Ecosystem partners (ISVs, resellers, distributors) who sell IBM technology to clients. Major growth lever for Select Territory.',
        worksWith: ['TPS', 'PTS', 'BTSS'],
        reportsThrough: 'Partner ecosystem — external to IBM org',
        ownsAccounts: true,
        salesMotion: 'Channel-led selling → Partner close → IBM co-sell support',
        segment: 'Select Territory',
        category: 'Ecosystem Roles',
      },
    ],
  },
];

// Product-centric companion chart. It uses the same group/item shape as the
// client-segment chart so both maps share one interaction and layout system.
const PRODUCT_CATEGORIES = [
  {
    id: 'portfolio-ai-data', label: 'AI & Data', sub: 'Software Portfolio',
    desc: 'Products for building, governing, and scaling enterprise AI and trusted data foundations.',
    functions: [
      { id:'product-watsonx', abbr:'watsonx', label:'AI and Data Platform', purpose:'Build, deploy, govern, and scale trusted enterprise AI.', worksWith:['Granite','DataStage','Cloud Pak for Data'], products:'watsonx.ai, watsonx.data, watsonx.governance, watsonx Orchestrate' },
      { id:'product-granite', abbr:'Granite', label:'IBM Foundation Models', purpose:'Open, enterprise-ready models optimized for business use cases.', worksWith:['watsonx','Red Hat AI'], products:'Granite language, code, vision, and embedding models' },
      { id:'product-cp4d', abbr:'CP4D', label:'Cloud Pak for Data', purpose:'Unify data management, governance, analytics, and AI services.', worksWith:['watsonx','DataStage','Db2'], products:'Cloud Pak for Data, Knowledge Catalog' },
      { id:'product-datastage', abbr:'DataStage', label:'Data Integration', purpose:'Design and run resilient data pipelines across hybrid environments.', worksWith:['Cloud Pak for Data','Db2','watsonx'], products:'DataStage, Data Replication' },
    ],
  },
  {
    id: 'portfolio-automation', label: 'Automation', sub: 'Software Portfolio',
    desc: 'AI-powered automation for applications, IT operations, integration, workflows, and business decisions.',
    functions: [
      { id:'product-instana', abbr:'Instana', label:'Observability', purpose:'Monitor applications and infrastructure with automated discovery and context.', worksWith:['Turbonomic','Concert','Red Hat'], products:'Instana Observability' },
      { id:'product-turbonomic', abbr:'Turbonomic', label:'Application Resource Management', purpose:'Continuously optimize application performance, cost, and resource use.', worksWith:['Instana','Apptio','Red Hat'], products:'Turbonomic ARM' },
      { id:'product-apptio', abbr:'Apptio', label:'Technology Financial Management', purpose:'Connect technology investment decisions to business value and cloud economics.', worksWith:['Turbonomic','Cloudability'], products:'ApptioOne, Cloudability, Targetprocess' },
      { id:'product-baw', abbr:'BAW', label:'Business Automation', purpose:'Automate workflows, decisions, documents, and content-intensive processes.', worksWith:['watsonx','webMethods'], products:'Business Automation Workflow, Operational Decision Manager' },
      { id:'product-webmethods', abbr:'webMethods', label:'Integration', purpose:'Connect applications, APIs, events, and data across hybrid environments.', worksWith:['BAW','Red Hat'], products:'webMethods Hybrid Integration' },
    ],
  },
  {
    id: 'portfolio-hybrid-cloud', label: 'Hybrid Cloud', sub: 'Platform Portfolio',
    desc: 'Open hybrid-cloud platforms and services for building, modernizing, and operating applications anywhere.',
    functions: [
      { id:'product-openshift', abbr:'OpenShift', label:'Hybrid Cloud Application Platform', purpose:'Build and run applications consistently across on-premises and public clouds.', worksWith:['RHEL','Ansible','IBM Cloud'], products:'Red Hat OpenShift' },
      { id:'product-rhel', abbr:'RHEL', label:'Enterprise Linux', purpose:'Provide a stable, secure operating foundation for hybrid-cloud workloads.', worksWith:['OpenShift','Ansible','IBM Z'], products:'Red Hat Enterprise Linux' },
      { id:'product-ansible', abbr:'Ansible', label:'IT Automation Platform', purpose:'Automate infrastructure, networks, cloud, security, and application operations.', worksWith:['RHEL','OpenShift','IBM Z'], products:'Red Hat Ansible Automation Platform' },
      { id:'product-ibm-cloud', abbr:'IBM Cloud', label:'Cloud Platform', purpose:'Run regulated and enterprise workloads on a secure, hybrid-ready cloud.', worksWith:['OpenShift','Power','IBM Z'], products:'IBM Cloud, Satellite, Virtual Servers' },
    ],
  },
  {
    id: 'portfolio-security', label: 'Security', sub: 'Software Portfolio',
    desc: 'Security products for identity, data, applications, threat detection, and hybrid-cloud risk.',
    functions: [
      { id:'product-qradar', abbr:'QRadar', label:'Threat Detection and Response', purpose:'Detect, investigate, and respond to threats across hybrid environments.', worksWith:['Guardium','Verify'], products:'QRadar SIEM, SOAR, EDR' },
      { id:'product-guardium', abbr:'Guardium', label:'Data Security', purpose:'Discover, monitor, protect, and govern sensitive data across environments.', worksWith:['QRadar','Verify','watsonx'], products:'Guardium Data Protection, Guardium Insights' },
      { id:'product-verify', abbr:'Verify', label:'Identity and Access Management', purpose:'Manage workforce and consumer identity across cloud and on-premises applications.', worksWith:['QRadar','Guardium'], products:'IBM Security Verify' },
      { id:'product-secrets', abbr:'Secrets', label:'Secrets and Key Management', purpose:'Protect credentials, keys, and privileged access for critical workloads.', worksWith:['IBM Z','IBM Cloud','Verify'], products:'Hyper Protect Crypto Services, zSecure' },
    ],
  },
  {
    id: 'portfolio-infrastructure', label: 'Infrastructure', sub: 'Systems Portfolio',
    desc: 'Secure, AI-ready servers, storage, and infrastructure software for hybrid-cloud environments. In Select Territory, BTSS sells the Focus Products, TSS covers the broader portfolio, and IBM Z follows a specialist motion.',
    youAreHere: true,
    groupByCategory: true,
    functions: [
      {
        id:'product-powervs', abbr:'PowerVS', label:'Power Virtual Server', category:'BTSS Brand Products',
        youAreHere: true,
        purpose:'Configurable, multitenant virtual IBM Power servers connected to IBM Cloud services. PowerVS extends Power workloads into cloud consumption and hybrid operating models.',
        worksWith:['Power','FlashSystem','Fusion','IBM Cloud'], products:'IBM Power Virtual Server, Power Virtual Server Hybrid Package',
        seller:'Infrastructure BTSS leads technical discovery, demos, solution validation, and progression. TSS coordinates the broader territory and commercial motion.',
        salesMotion:'Workload discovery → sizing → architecture → migration plan → cloud consumption',
        buyer:'Power, AIX, IBM i, SAP, and hybrid-cloud infrastructure teams',
      },
      {
        id:'product-flashsystem', abbr:'FlashSystem', label:'Primary Storage', category:'BTSS Brand Products',
        youAreHere: true,
        purpose:'AI-assisted enterprise flash storage for application performance, operational simplicity, data modernization, and cyber resilience.',
        worksWith:['Fusion','Storage Defender','Storage Insights','Power','IBM Z'], products:'IBM FlashSystem family, FlashCore Modules',
        seller:'Infrastructure BTSS leads storage discovery, sizing, demos, technical validation, and competitive positioning. TSS owns the wider account and territory motion.',
        salesMotion:'Capacity and workload discovery → sizing → resilience design → proposal → deployment',
        buyer:'Storage, infrastructure, database, virtualization, and cyber-resilience teams',
      },
      {
        id:'product-fusion', abbr:'Fusion', label:'Container and AI Infrastructure', category:'BTSS Brand Products',
        youAreHere: true,
        purpose:'Turnkey infrastructure that brings data, AI, containers, and applications together for production-ready hybrid and AI outcomes.',
        worksWith:['FlashSystem','OpenShift','watsonx','Storage Defender'], products:'IBM Fusion, Fusion software and appliances',
        seller:'Infrastructure BTSS leads the technical motion around OpenShift, data services, AI readiness, demos, and solution validation. TSS supports territory progression.',
        salesMotion:'Platform discovery → OpenShift and data architecture → workshop or demo → validation → expansion',
        buyer:'Platform engineering, OpenShift, data, AI, and application modernization teams',
      },
      {
        id:'product-power', abbr:'Power', label:'Enterprise Compute', category:'TSS Portfolio Coverage',
        purpose:'High-performance, scalable, and reliable servers for mission-critical applications, databases, and AI workloads.',
        worksWith:['PowerVS','FlashSystem','IBM Cloud'], products:'IBM Power servers, AIX, IBM i, Power Linux',
        seller:'TSS leads the Select Territory commercial coverage and brings in Power or technical specialists when deeper architecture expertise is required.',
        salesMotion:'Installed-base and workload review → refresh or expansion → configuration → commercial close',
        buyer:'Infrastructure, SAP, Oracle, AIX, IBM i, and line-of-business application teams',
      },
      {
        id:'product-storage-defender', abbr:'Defender', label:'Storage Defender', category:'TSS Portfolio Coverage',
        purpose:'Data-resilience software that helps clients detect threats early and prove that recoveries are clean, secure, and reliable.',
        worksWith:['FlashSystem','Storage Insights','Fusion'], products:'IBM Storage Defender',
        seller:'TSS carries the broader commercial motion and engages Storage specialists or BTSS support when technical validation is needed.',
        salesMotion:'Cyber-resilience assessment → recovery requirements → solution design → validation → close',
        buyer:'Security, backup, storage, risk, and business-continuity teams',
      },
      {
        id:'product-storage-insights', abbr:'Insights', label:'Storage Insights and Spectrum Control', category:'TSS Portfolio Coverage',
        purpose:'Visibility, analytics, monitoring, and management software for optimizing heterogeneous storage infrastructure.',
        worksWith:['FlashSystem','Storage Defender','Fusion'], products:'IBM Storage Insights, IBM Spectrum Control',
        seller:'TSS positions the portfolio value and coordinates specialist support for assessments, monitoring strategy, or complex estates.',
        salesMotion:'Estate discovery → visibility assessment → monitoring design → trial or proposal → adoption',
        buyer:'Storage operations, infrastructure operations, capacity planning, and FinOps teams',
      },
      {
        id:'product-z', abbr:'IBM Z', label:'Enterprise Mainframe', category:'IBM Z Specialist Motion',
        purpose:'Telum-powered enterprise infrastructure for high-volume transactions, trusted AI, security, and mission-critical operating systems and software.',
        worksWith:['LinuxONE','FlashSystem','Storage Defender','Red Hat'], products:'IBM z17, z/OS, IBM Z software',
        seller:'Specialized IBM Z sellers and technical specialists lead this motion. Select Territory TSS identifies opportunities and coordinates the specialist team rather than treating Z as ordinary cross-brand coverage.',
        salesMotion:'Installed-base strategy → capacity and workload planning → architecture → financing and migration planning → specialist close',
        buyer:'Mainframe, core systems, payments, security, operations, and enterprise architecture leaders',
      },
      {
        id:'product-linuxone', abbr:'LinuxONE', label:'Enterprise Linux Server', category:'IBM Z Specialist Motion',
        purpose:'Enterprise-grade Linux infrastructure powered by IBM Telum technology for secure, consolidated, cloud-native, and AI workloads.',
        worksWith:['IBM Z','OpenShift','FlashSystem','Red Hat'], products:'IBM LinuxONE',
        seller:'IBM Z and LinuxONE specialists lead architecture and technical validation. TSS discovers demand and brings the specialist team into the account.',
        salesMotion:'Linux estate discovery → consolidation or modernization case → architecture → workload validation → specialist close',
        buyer:'Linux platform, cloud platform, security, infrastructure, and application modernization teams',
      },
    ],
  },
];

// The 2026 BTSS Runbook defines Select Territory around three brands and seven
// specialties. Keep the chart faithful to that seller-facing model.
const productNode = (id, label, fullName, purpose) => ({
  id, label, sub:fullName, kind:'Product', purpose, products:fullName,
});
const dataBrand = PRODUCT_CATEGORIES.find(category => category.id === 'portfolio-ai-data');
const automationBrand = PRODUCT_CATEGORIES.find(category => category.id === 'portfolio-automation');
const infrastructureBrand = PRODUCT_CATEGORIES.find(category => category.id === 'portfolio-infrastructure');

if (dataBrand) {
  dataBrand.label = 'Data';
  dataBrand.desc = 'Select Territory Data offerings are organized into AI-Powered Productivity and Data Trust & Planning specialties.';
  dataBrand.hierarchy = [
    {
      id:'product-specialty-ai-productivity', label:'AI-Powered Productivity', kind:'Specialty',
      desc:'Focus products for AI assistants, agentic productivity, development acceleration, and governed AI.',
      children:[
        productNode('product-orchestrate','watsonx Orchestrate','IBM watsonx Orchestrate','Build, govern, and automate work with AI assistants and agents.'),
        productNode('product-bob','Project Bob','IBM Project Bob / watsonx Code Assistant','Accelerate software development with IBM AI coding assistance.'),
        productNode('product-watsonx-gov','watsonx.governance','IBM watsonx.governance','Govern AI models, agents, risk, and regulatory obligations.'),
      ],
    },
    {
      id:'product-specialty-data-trust', label:'Data Trust & Planning', kind:'Specialty',
      desc:'Focus products for trusted data, governance, integration, security, analytics, and enterprise planning.',
      children:[
        productNode('product-guardium-focus','Guardium','IBM Guardium','Discover, protect, and govern sensitive enterprise data.'),
        productNode('product-watsonx-data','watsonx.data','IBM watsonx.data','Create an AI-ready hybrid data foundation.'),
        productNode('product-watsonx-integration','Data Integration','IBM watsonx.data integration','Integrate and deliver trusted data across hybrid environments.'),
        productNode('product-planning-analytics','Planning Analytics','IBM Planning Analytics','Support integrated business planning, forecasting, and scenario analysis.'),
      ],
    },
  ];
}

if (automationBrand) {
  automationBrand.desc = 'Select Territory Automation offerings span DevOps, Integration, Secure Access & Identity, and Asset & Operations Optimization.';
  automationBrand.hierarchy = [
    {
      id:'product-specialty-devops', label:'DevOps', kind:'Specialty',
      children:[
        productNode('product-terraform-focus','Terraform','HashiCorp Terraform','Provision and manage infrastructure through consistent workflows.'),
        productNode('product-instana-focus','Instana','IBM Instana Observability','Observe application performance and dependencies in real time.'),
        productNode('product-concert-focus','Concert','IBM Concert','Use AI-driven insights to manage application resilience and risk.'),
        productNode('product-kubecost-focus','Kubecost','IBM Kubecost','Understand and optimize Kubernetes cost and usage.'),
        productNode('product-cloudability-focus','Cloudability','IBM Cloudability','Manage and optimize cloud financial performance.'),
      ],
    },
    {
      id:'product-specialty-integration', label:'Integration', kind:'Specialty',
      children:[productNode('product-webmethods-focus','webMethods','IBM webMethods Hybrid Integration','Connect applications, APIs, events, files, and data across hybrid environments.')],
    },
    {
      id:'product-specialty-access', label:'Secure Access & Identity', kind:'Specialty',
      children:[
        productNode('product-vault-focus','Vault','HashiCorp Vault','Secure secrets, identities, and privileged access.'),
        productNode('product-verify-focus','Verify','IBM Security Verify','Manage workforce and customer identity and access.'),
        productNode('product-ns1-focus','NS1','IBM NS1 Connect','Provide resilient, intelligent DNS and traffic steering.'),
      ],
    },
    {
      id:'product-specialty-asset-ops', label:'Asset & Operations Optimization', kind:'Specialty',
      children:[productNode('product-maximo-focus','Maximo','IBM Maximo Application Suite','Optimize asset performance, maintenance, reliability, and operations.')],
    },
  ];
}

if (infrastructureBrand) {
  const asProductNode = product => ({ ...product, label:product.abbr, sub:product.label, kind:'Product' });
  const focusProducts = infrastructureBrand.functions.filter(product => product.category === 'BTSS Brand Products');
  const territoryProducts = infrastructureBrand.functions.filter(product => product.category === 'TSS Portfolio Coverage');
  const zProducts = infrastructureBrand.functions.filter(product => product.category === 'IBM Z Specialist Motion');
  infrastructureBrand.hierarchy = [{
    id:'product-specialty-infrastructure-modernization', label:'Infrastructure Modernization', kind:'Specialty', youAreHere:true,
    desc:'The infrastructure specialty combines BTSS Focus Products, broader non-Focus TSS coverage, and a distinct IBM Z specialist motion.',
    children:[
      {
        id:'product-group-focus', label:'Focus Products', kind:'Product Group', youAreHere:true,
        desc:'BTSS sells and technically validates PowerVS, FlashSystem, and Fusion as part of a focused 1-12 product assignment across approximately 300+ Select Activate accounts.',
        children:focusProducts.map(asProductNode),
      },
      ...territoryProducts.map(asProductNode),
      {
        id:'product-group-z', label:'IBM Z', kind:'Product Group',
        desc:'Specialist-led IBM Z and LinuxONE offerings. TSS can identify demand and coordinate the specialist team.',
        children:zProducts.map(asProductNode),
      },
    ],
  }];
  infrastructureBrand.groupByCategory = false;
}

// Hybrid Cloud and Security remain important IBM portfolios, but the runbook
// places Select Territory product coverage within Data, Automation, and
// Infrastructure. Show those three brands in this seller-oriented view.
PRODUCT_CATEGORIES.splice(0, PRODUCT_CATEGORIES.length, dataBrand, automationBrand, infrastructureBrand);

// ─────────────────────────────────────────────────────────────────
// Hex geometry (pointy-top)
// ─────────────────────────────────────────────────────────────────
const R   = 72;                    // original radius
const CS  = R * Math.sqrt(3);      // horizontal center-to-center
const RS  = R * 2;                 // vertical center-to-center
const GAP = 48;                    // spacing so hexes don't touch

function hexPts(cx, cy, r = R) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = -Math.PI / 2 + (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

// ─────────────────────────────────────────────────────────────────
// View state
// ─────────────────────────────────────────────────────────────────
let _expandedSegments  = new Set();
let _selectedId        = null;   // currently selected node id
let _panelCollapsed    = false;
let _zoom              = 1;
let _chartMode         = 'segments'; // 'segments' | 'products'
let _hierarchyLoaded   = false;
const ZOOM_STEP        = 0.15;
const ZOOM_MIN         = 0.4;
const ZOOM_MAX         = 2.5;

function activeGroups() {
  return _chartMode === 'products' ? PRODUCT_CATEGORIES : SEGMENTS;
}

const HIERARCHY_STORAGE_KEY = 'ibm-hive-colonies-hierarchy-v1';

function loadHierarchyEdits() {
  if (_hierarchyLoaded) return;
  _hierarchyLoaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(HIERARCHY_STORAGE_KEY) || 'null');
    if (!saved) return;
    SEGMENTS.forEach(segment => {
      if (saved[segment.id]) segment.hierarchy = saved[segment.id];
    });
  } catch (error) {
    console.warn('Could not load saved Colony nodes.', error);
  }
}

function saveHierarchyEdits() {
  const saved = Object.fromEntries(SEGMENTS.filter(segment => segment.hierarchy)
    .map(segment => [segment.id, segment.hierarchy]));
  localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(saved));
}

function findHierarchyLocation(id) {
  function visit(nodes, parent, segment) {
    for (const node of nodes || []) {
      if (node.id === id) return { node, parent, segment };
      const found = visit(node.children, node, segment);
      if (found) return found;
    }
    return null;
  }
  for (const segment of SEGMENTS) {
    const found = visit(segment.hierarchy, null, segment);
    if (found) return found;
  }
  return null;
}

function openNodeEditor(mode, nodeId) {
  const modal = document.getElementById('ohiveNodeEditor');
  const form = document.getElementById('ohiveNodeForm');
  if (!modal || !form) return;
  const location = findHierarchyLocation(nodeId);
  if (!location) return;
  const editing = mode === 'edit';
  const node = editing ? location.node : null;
  form.dataset.mode = mode;
  form.dataset.nodeId = nodeId;
  form.elements.label.value = node?.label || '';
  form.elements.kind.value = node?.kind || 'Role';
  form.elements.fullName.value = node?.sub || '';
  form.elements.description.value = node?.desc || '';
  modal.querySelector('.ohive-node-editor-title').textContent = editing ? 'Edit Node' : `Add Node Under ${location.node.label}`;
  modal.classList.add('open');
  form.elements.label.focus();
}

function closeNodeEditor() {
  document.getElementById('ohiveNodeEditor')?.classList.remove('open');
}

function saveNodeEditor(form) {
  const mode = form.dataset.mode;
  const location = findHierarchyLocation(form.dataset.nodeId);
  if (!location) return;
  const values = {
    label: form.elements.label.value.trim(),
    kind: form.elements.kind.value,
    sub: form.elements.fullName.value.trim(),
    desc: form.elements.description.value.trim(),
  };
  if (!values.label) return;
  if (mode === 'edit') {
    Object.assign(location.node, values);
  } else {
    location.node.children ||= [];
    location.node.children.push({
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...values,
    });
    _expandedSegments.add(location.node.id);
  }
  saveHierarchyEdits();
  closeNodeEditor();
  redraw();
  showDetail(location.node.id, 'hierarchy', location.node);
}

function deleteHierarchyNode(nodeId) {
  const location = findHierarchyLocation(nodeId);
  if (!location || !window.confirm(`Delete ${location.node.label} and everything beneath it?`)) return;
  const siblings = location.parent ? location.parent.children : location.segment.hierarchy;
  const index = siblings.findIndex(node => node.id === nodeId);
  if (index < 0) return;
  siblings.splice(index, 1);
  collapseHierarchy(location.node);
  _selectedId = null;
  saveHierarchyEdits();
  redraw();
  showDetail(null, null);
}

// ─────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────
export async function renderOrg(container) {
  loadHierarchyEdits();
  _expandedSegments = new Set();
  _selectedId       = null;
  _panelCollapsed   = false;
  _zoom             = 1;
  _chartMode        = 'segments';

  container.innerHTML = `
    <div class="ohive-layout">
      <div class="ohive-hive-area" id="ohiveHiveArea">
        <div class="ohive-chart-switch" aria-label="Colony chart">
          <button class="ohive-chart-switch-btn active" data-chart-mode="segments">Sales</button>
          <button class="ohive-chart-switch-btn" data-chart-mode="products">Product Brands</button>
        </div>
        <div class="ohive-zoom-controls" id="ohiveZoomControls">
          <button class="ohive-zoom-btn" id="ohiveZoomIn" title="Zoom in">+</button>
          <button class="ohive-zoom-btn" id="ohiveZoomReset" title="Reset zoom">⊙</button>
          <button class="ohive-zoom-btn" id="ohiveZoomOut" title="Zoom out">−</button>
        </div>
        <div class="ohive-canvas" id="ohiveCanvas"></div>
      </div>
      <button class="ohive-panel-toggle" id="ohivePanelToggle" title="Toggle detail panel">&#x203A;</button>
      <div class="ohive-detail-panel" id="ohiveDetail">
        <div class="ohive-detail-empty">
          <div class="ohive-detail-welcome">
            <div class="ohive-detail-welcome-title">IBM Colonies</div>
            <div class="ohive-detail-welcome-body">Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM's go-to-market motion.</div>
            <div class="ohive-detail-welcome-tip">Your current role is highlighted in purple.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="ohive-node-editor" id="ohiveNodeEditor" role="dialog" aria-modal="true" aria-labelledby="ohiveNodeEditorTitle">
      <form class="ohive-node-editor-card" id="ohiveNodeForm">
        <div class="ohive-node-editor-head">
          <div class="ohive-node-editor-title" id="ohiveNodeEditorTitle">Edit Node</div>
          <button type="button" class="ohive-node-editor-close" aria-label="Close">×</button>
        </div>
        <label>Name<input name="label" type="text" required maxlength="42"></label>
        <label>Type<select name="kind">
          <option>Client Sub-Segment</option><option>Brand</option><option>Specialty</option>
          <option>Market</option><option>Role Group</option><option>Role</option><option>Ecosystem</option>
        </select></label>
        <label>Full name or expanded acronym<input name="fullName" type="text" maxlength="90"></label>
        <label>Description<textarea name="description" rows="4" maxlength="500"></textarea></label>
        <div class="ohive-node-editor-actions">
          <button type="button" class="ohive-node-editor-cancel">Cancel</button>
          <button type="submit" class="ohive-node-editor-save">Save</button>
        </div>
      </form>
    </div>
  `;

  const detailPanel = document.getElementById('ohiveDetail');
  detailPanel?.addEventListener('click', event => {
    const menuToggle = event.target.closest('[data-node-menu-toggle]');
    if (menuToggle) {
      event.stopPropagation();
      menuToggle.closest('.ohive-node-actions')?.classList.toggle('open');
      return;
    }
    const action = event.target.closest('[data-node-action]');
    if (!action) return;
    const { nodeAction, nodeId } = action.dataset;
    if (nodeAction === 'add') openNodeEditor('add', nodeId);
    if (nodeAction === 'edit') openNodeEditor('edit', nodeId);
    if (nodeAction === 'delete') deleteHierarchyNode(nodeId);
  });
  document.querySelector('.ohive-node-editor-close')?.addEventListener('click', closeNodeEditor);
  document.querySelector('.ohive-node-editor-cancel')?.addEventListener('click', closeNodeEditor);
  document.getElementById('ohiveNodeEditor')?.addEventListener('click', event => {
    if (event.target.id === 'ohiveNodeEditor') closeNodeEditor();
  });
  document.getElementById('ohiveNodeForm')?.addEventListener('submit', event => {
    event.preventDefault();
    saveNodeEditor(event.currentTarget);
  });

  document.getElementById('ohiveZoomIn')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = Math.min(ZOOM_MAX, parseFloat((_zoom + ZOOM_STEP).toFixed(2)));
    applyZoom();
  });
  container.querySelectorAll('[data-chart-mode]').forEach(button => {
    button.addEventListener('click', e => {
      e.stopPropagation();
      const nextMode = button.dataset.chartMode;
      if (!nextMode || nextMode === _chartMode) return;
      _chartMode = nextMode;
      _expandedSegments.clear();
      _selectedId = null;
      _zoom = 1;
      applyZoom();
      container.querySelectorAll('[data-chart-mode]').forEach(item =>
        item.classList.toggle('active', item.dataset.chartMode === _chartMode));
      redraw();
      showDetail(null, null);
    });
  });
  document.getElementById('ohiveZoomOut')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = Math.max(ZOOM_MIN, parseFloat((_zoom - ZOOM_STEP).toFixed(2)));
    applyZoom();
  });
  document.getElementById('ohiveZoomReset')?.addEventListener('click', e => {
    e.stopPropagation();
    _zoom = 1;
    applyZoom();
  });
  document.getElementById('ohivePanelToggle')?.addEventListener('click', e => {
    e.stopPropagation();
    _panelCollapsed = !_panelCollapsed;
    const layout = container.querySelector('.ohive-layout');
    const toggle = document.getElementById('ohivePanelToggle');
    const detail = document.getElementById('ohiveDetail');
    layout?.classList.toggle('ohive-panel-collapsed', _panelCollapsed);
    if (toggle) toggle.innerHTML = _panelCollapsed ? '&#x2039;' : '&#x203A;';
    // The hive area's available width changes as the panel slides in/out,
    // so the role clusters need to re-pack. Redraw now for responsiveness
    // and again once the width transition settles for a pixel-perfect fit.
    redraw();
    detail?.addEventListener('transitionend', () => redraw(), { once: true });
  });

  // Trackpad pinch-to-zoom: browsers report a trackpad pinch gesture as a
  // wheel event with ctrlKey set. Plain two-finger scroll (no ctrlKey)
  // is left alone so it keeps panning the canvas via native scrolling.
  const hiveArea = document.getElementById('ohiveHiveArea');
  hiveArea?.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.01);
    _zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, _zoom * factor));
    applyZoom();
  }, { passive: false });

  // Re-pack role clusters if the window itself is resized.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (document.getElementById('ohiveCanvas')) redraw();
    }, 150);
  });

  redraw();
}

function applyZoom() {
  const canvas = document.getElementById('ohiveCanvas');
  if (canvas) canvas.style.transform = `scale(${_zoom})`;
}

// ─────────────────────────────────────────────────────────────────
// Layout builder
// ─────────────────────────────────────────────────────────────────
const COLS_PER_ROW        = 4;
const CATEGORY_LABEL_H    = 26; // height reserved above a category's hex row for its label
const CAT_GAP             = GAP * 1.5; // horizontal gap between category groups

// How much horizontal room the hive actually has right now — shrinks
// when the detail panel is open, grows when it's collapsed. Category
// groups wrap to a new row (see packCategoryRows) once they no longer
// fit, rather than overflowing off-screen behind the panel.
function getAvailableWidth() {
  const hiveArea = document.getElementById('ohiveHiveArea');
  const raw = hiveArea ? hiveArea.clientWidth : 900;
  return Math.max(CS + 40, (raw || 900) - 64);
}

// Bin-packs a groupByCategory segment's role categories into as few rows
// as fit within availW — one row when there's room (the "three tiers"
// case: root → segments → roles), wrapping a clump of categories down
// to additional rows only when the available width forces it.
function packCategoryRows(seg, availW) {
  const categoryOrder = [];
  const categoryMap   = {};
  seg.functions.forEach(fn => {
    const cat = fn.category || 'Other';
    if (!categoryMap[cat]) { categoryMap[cat] = []; categoryOrder.push(cat); }
    categoryMap[cat].push(fn);
  });

  const cats = categoryOrder.map(cat => {
    const fns  = categoryMap[cat];
    const cols = Math.min(fns.length, COLS_PER_ROW);
    const rows = Math.ceil(fns.length / cols);
    const w    = cols * CS + (cols - 1) * GAP;
    return { cat, fns, cols, rows, w };
  });

  const rows = [];
  let curRow = [];
  let curRowW = 0;
  cats.forEach(c => {
    const addW = c.w + (curRow.length > 0 ? CAT_GAP : 0);
    if (curRow.length > 0 && curRowW + addW > availW) {
      rows.push(curRow);
      curRow = [c];
      curRowW = c.w;
    } else {
      curRow.push(c);
      curRowW += addW;
    }
  });
  if (curRow.length) rows.push(curRow);

  return rows.map(row => ({
    cats: row,
    rowWidth:  row.reduce((s, c, i) => s + c.w + (i > 0 ? CAT_GAP : 0), 0),
    // Include the hexagon's upper radius after the heading row. Without this,
    // category labels sit behind the first row of point-up hexagons.
    rowHeight: CATEGORY_LABEL_H + R + Math.max(...row.map(c => c.rows)) * (RS + GAP),
  }));
}

function hierarchyNodeById(id, nodes) {
  for (const node of nodes || []) {
    if (node.id === id) return node;
    const found = hierarchyNodeById(id, node.children);
    if (found) return found;
  }
  return null;
}

function hierarchyTypeLabel(node) {
  if (node?.kind === 'Client Motion') return 'Client Sub-Segment';
  return node?.kind || 'Node';
}

function collapseHierarchy(node) {
  if (!node) return;
  _expandedSegments.delete(node.id);
  (node.children || []).forEach(collapseHierarchy);
}

function hierarchySubtreeWidth(node) {
  if (!_expandedSegments.has(node.id) || !node.children?.length) return CS;
  const childWidths = node.children.map(hierarchySubtreeWidth);
  return Math.max(CS, childWidths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, childWidths.length - 1));
}

function hierarchyForestWidth(nodes) {
  const widths = (nodes || []).map(hierarchySubtreeWidth);
  return widths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, widths.length - 1);
}

function placeHierarchy(nodes, parentId, parentX, depth, baseY, output) {
  if (!nodes?.length) return;
  const widths = nodes.map(hierarchySubtreeWidth);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + GAP * Math.max(0, widths.length - 1);
  let cursor = parentX - totalWidth / 2;
  nodes.forEach((node, index) => {
    const cx = cursor + widths[index] / 2;
    output.push({ node, parentId, cx, cy:baseY + depth * (RS + GAP), depth });
    if (_expandedSegments.has(node.id)) {
      placeHierarchy(node.children, node.id, cx, depth + 1, baseY, output);
    }
    cursor += widths[index] + GAP;
  });
}

function buildLayout() {
  const nodes     = [];
  const pos       = {};
  const lines_data = [];
  const groups = activeGroups();

  const PAD_X = R + 48;
  const PAD_Y = R + 36;
  const availW = getAvailableWidth();

  const segCount  = groups.length;
  const segTotalW = segCount * CS + (segCount - 1) * GAP;

  // Pre-compute grouped-row layouts once so the width used to size the
  // canvas and the positions used to place hexes never disagree.
  const groupedRowsBySeg = {};
  const clusterWidths = {};
  groups.forEach(seg => {
    if (!_expandedSegments.has(seg.id)) return;
    if (seg.hierarchy) {
      clusterWidths[seg.id] = hierarchyForestWidth(seg.hierarchy);
    } else if (seg.groupByCategory) {
      const rows = packCategoryRows(seg, availW);
      groupedRowsBySeg[seg.id] = rows;
      clusterWidths[seg.id] = Math.max(...rows.map(r => r.rowWidth));
    } else {
      const n    = seg.functions.length;
      const cols = Math.min(n, COLS_PER_ROW);
      clusterWidths[seg.id] = cols * CS + (cols - 1) * GAP;
    }
  });

  const hierarchyEnvelopeWidths = groups.map((seg, index) => {
    if (!seg.hierarchy || !_expandedSegments.has(seg.id)) return 0;
    const segmentOffset = (index - (segCount - 1) / 2) * (CS + GAP);
    return 2 * (Math.abs(segmentOffset) + (clusterWidths[seg.id] || CS) / 2);
  });
  const maxW  = Math.max(segTotalW, ...Object.values(clusterWidths), ...hierarchyEnvelopeWidths, 0);
  const svgW  = maxW + PAD_X * 2;
  const svgCX = svgW / 2;

  // Root
  let curY = PAD_Y + R;
  nodes.push({
    id: 'root', label: _chartMode === 'products' ? 'IBM Products' : 'IBM Sales', sub: 'Colony',
    type: 'root', cx: svgCX, cy: curY,
    isSelected: _selectedId === 'root',
    // The colony root is highlighted purple — you sit inside it.
    youAreHere: true, data: null,
  });
  pos['root'] = { cx: svgCX, cy: curY };
  curY += RS + GAP;

  // Segments
  const segStartX = svgCX - segTotalW / 2 + CS / 2;
  groups.forEach((seg, si) => {
    const cx = segStartX + si * (CS + GAP);
    const cy = curY;
    nodes.push({
      id: seg.id, label: seg.label, sub: _chartMode === 'products' ? 'Brand' : 'Client Segment',
      type: 'segment', cx, cy,
      isSelected: _selectedId === seg.id,
      youAreHere: seg.youAreHere || false,
      isExpanded: _expandedSegments.has(seg.id),
      data: seg,
    });
    pos[seg.id] = { cx, cy };
    // IBM → segment line
    lines_data.push({ x1: svgCX, y1: pos['root'].cy + R, x2: cx, y2: cy - R, kind: 'root-seg' });
  });
  curY += RS + GAP;

  // Role clusters
  groups.forEach(seg => {
    if (!_expandedSegments.has(seg.id)) return;

    if (seg.hierarchy) {
      const placed = [];
      const segmentX = pos[seg.id]?.cx ?? svgCX;
      placeHierarchy(seg.hierarchy, seg.id, segmentX, 0, curY, placed);
      placed.forEach(({ node, parentId, cx, cy }) => {
        nodes.push({
          id:node.id, label:node.label, sub:hierarchyTypeLabel(node),
          type:'hierarchy', cx, cy,
          isSelected:_selectedId === node.id,
          youAreHere:node.youAreHere || false,
          isExpanded:_expandedSegments.has(node.id),
          data:node, segId:seg.id,
        });
        pos[node.id] = { cx, cy };
        const parentPos = pos[parentId];
        if (parentPos) lines_data.push({ x1:parentPos.cx, y1:parentPos.cy + R, x2:cx, y2:cy - R, kind:'hierarchy' });
      });
      (seg.crossLinks || []).forEach(([sourceId, targetId]) => {
        const source = pos[sourceId];
        const target = pos[targetId];
        if (source && target) {
          lines_data.push({ x1:source.cx, y1:source.cy, x2:target.cx, y2:target.cy, kind:'cross-role' });
        }
      });
      const maxDepth = placed.length ? Math.max(...placed.map(item => item.depth)) : 0;
      curY += (maxDepth + 1) * (RS + GAP) + GAP;
    } else if (seg.groupByCategory) {
      const rows = groupedRowsBySeg[seg.id] || [];

      // Each row of categories is centred independently and stacked
      // vertically — one row when everything fits (three tiers total),
      // extra rows only for the clump that didn't fit on the row above.
      rows.forEach(row => {
        let groupStartX = svgCX - row.rowWidth / 2 + CS / 2; // left-centre of first hex in this row

        row.cats.forEach(c => {
          const groupCX = groupStartX + c.w / 2 - CS / 2; // centre of this group
          const labelX  = groupStartX - CS / 2;

          // Category label — sits just above the hexes, left-aligned to the group
          nodes.push({
            id: `cat-${seg.id}-${c.cat}`, label: c.cat, sub: null,
            type: 'category-label',
            cx: groupCX, cy: curY + CATEGORY_LABEL_H / 2,
            clusterX: labelX,
            isSelected: false, youAreHere: false, isExpanded: false, data: null,
            segId: seg.id,
          });

          // Hexes for this category
          c.fns.forEach((fn, fi) => {
            const col = fi % c.cols;
            const frow = Math.floor(fi / c.cols);
            const cx  = groupStartX + col * (CS + GAP);
            const cy  = curY + CATEGORY_LABEL_H + R + frow * (RS + GAP);

            nodes.push({
              id: fn.id, label: fn.abbr, sub: _chartMode === 'products' ? 'Product' : 'Role',
              type: 'function', cx, cy,
              isSelected: _selectedId === fn.id,
              youAreHere: fn.youAreHere || false,
              isExpanded: false, data: fn,
              segId: seg.id,
            });
            pos[fn.id] = { cx, cy };
            const segPos = pos[seg.id];
            if (segPos) {
              lines_data.push({ x1: segPos.cx, y1: segPos.cy + R, x2: cx, y2: cy - R, kind: 'seg-role' });
            }
          });

          groupStartX += c.w + CAT_GAP;
        });

        curY += row.rowHeight + GAP;
      });
    } else {
      const fns  = seg.functions;
      const cols = Math.min(fns.length, COLS_PER_ROW);
      const rows = Math.ceil(fns.length / cols);
      const clusterW      = cols * CS + (cols - 1) * GAP;
      const clusterStartX = svgCX - clusterW / 2 + CS / 2;

      fns.forEach((fn, fi) => {
        const col     = fi % cols;
        const row     = Math.floor(fi / cols);
        const offsetX = (row % 2 === 1) ? CS / 2 : 0;
        const cx      = clusterStartX + col * (CS + GAP) + offsetX;
        const cy      = curY + row * (RS + GAP);

        nodes.push({
          id: fn.id, label: fn.abbr, sub: _chartMode === 'products' ? 'Product' : 'Role',
          type: 'function', cx, cy,
          isSelected: _selectedId === fn.id,
          youAreHere: fn.youAreHere || false,
          isExpanded: false, data: fn,
          segId: seg.id,
        });
        pos[fn.id] = { cx, cy };
        // Segment → role line
        const segPos = pos[seg.id];
        if (segPos) {
          lines_data.push({ x1: segPos.cx, y1: segPos.cy + R, x2: cx, y2: cy - R, kind: 'seg-role' });
        }
      });

      curY += rows * (RS + GAP) + GAP;
    }
  });

  const svgH = curY + R + PAD_Y;
  return { nodes, svgW, svgH, lines_data };
}

// ─────────────────────────────────────────────────────────────────
// Compute which node ids are "related" to the selected node
// Returns: { selected: Set, related: Set }
// ─────────────────────────────────────────────────────────────────
function getRelationshipSets(selectedId) {
  if (!selectedId || selectedId === 'root') return { selected: new Set(), related: new Set() };

  // Find the selected function
  let selFn = null;
  for (const seg of activeGroups()) {
    const fn = seg.functions.find(f => f.id === selectedId);
    if (fn) { selFn = fn; break; }
  }
  if (!selFn) return { selected: new Set([selectedId]), related: new Set() };

  const worksWithAbbrs = new Set((selFn.worksWith || []).map(w => w.toLowerCase()));

  // Find all role nodes whose abbr is in worksWith
  const related = new Set();
  for (const seg of activeGroups()) {
    for (const fn of seg.functions) {
      if (worksWithAbbrs.has(fn.abbr.toLowerCase()) || worksWithAbbrs.has(fn.label.toLowerCase())) {
        related.add(fn.id);
      }
    }
  }

  return { selected: new Set([selectedId]), related };
}

// ─────────────────────────────────────────────────────────────────
// Text wrap — break on spaces, max maxChars per line
// ─────────────────────────────────────────────────────────────────
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + ' ' + w).length <= maxChars) { cur += ' ' + w; }
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─────────────────────────────────────────────────────────────────
// Draw
// ─────────────────────────────────────────────────────────────────
function redraw() {
  const canvas = document.getElementById('ohiveCanvas');
  if (!canvas) return;

  const { nodes, svgW, svgH, lines_data } = buildLayout();
  const { selected, related } = getRelationshipSets(_selectedId);
  const hasSelection = selected.size > 0;

  // Lines
  const lines = lines_data.map(l => {
    return `<line data-line-kind="${l.kind}" x1="${l.x1.toFixed(1)}" y1="${l.y1.toFixed(1)}"
      x2="${l.x2.toFixed(1)}" y2="${l.y2.toFixed(1)}"
      stroke="rgba(255,255,255,0.48)"
      stroke-width="1.5" stroke-linecap="round" pointer-events="none"/>`;
  }).join('');

  let hexes = '';
  nodes.forEach(n => {
    // Category label — a real heading for the role grouping (Sales / Technical / Ecosystem Roles)
    if (n.type === 'category-label') {
      // Use the same cluster left-edge as the hexes below it
      const labelX = n.clusterX !== undefined ? n.clusterX : n.cx;
      hexes += `
        <g pointer-events="none">
          <text x="${labelX.toFixed(1)}" y="${(n.cy + 5).toFixed(1)}"
            text-anchor="start" fill="rgba(255,255,255,0.85)" font-size="13" font-weight="600"
            letter-spacing="0.2" font-family="IBM Plex Sans,system-ui,sans-serif">${n.label}</text>
        </g>`;
      return;
    }

    const isRoot = n.type === 'root';
    const isSeg  = n.type === 'segment';
    const isFn   = n.type === 'function';
    const isSel  = selected.has(n.id);
    const isRel  = related.has(n.id);
    const isYou  = n.youAreHere;

    // Outline: always white except selected (blue) and you-are-here (purple)
    // Related cells get a brighter white outline to highlight the relationship
    const stroke = isYou
      ? '#a855f7'
      : isSel
        ? '#4589ff'
        : isRel
          ? 'rgba(255,255,255,0.90)'
          : 'rgba(255,255,255,0.70)';
    const sw = isSel || isYou ? 2.5 : isRel ? 2 : 1.5;

    // Fill: all cells the same gray — never dim
    const fill = '#2a2a2a';

    // Text: always white
    const labelColor = '#ffffff';
    const subColor   = 'rgba(255,255,255,0.72)';

    const labelFontSize   = isRoot ? 16 : isFn ? 14 : 13;
    const labelFontWeight = isRoot || isSel ? 700 : 500;

    // Vertically center the whole (label block + sub block) as a unit on the
    // hex's true center, regardless of how many lines either block wraps to.
    // dominant-baseline="central" anchors each line on its own visual middle,
    // so the only math needed is laying out line *slots*, not baselines.
    const labelLines  = wrapText(n.label, isRoot ? 10 : 8);
    const subLines    = n.sub ? wrapText(n.sub, 11) : [];

    const lineH    = labelFontSize + 3;
    const subLineH = 14;
    const blockGap = subLines.length ? 5 : 0;

    const labelBlockH = labelLines.length * lineH;
    const subBlockH   = subLines.length * subLineH;
    const totalH      = labelBlockH + blockGap + subBlockH;
    const blockTop    = n.cy - totalH / 2;

    const labelEl = labelLines.map((line, i) => {
      const lineCY = blockTop + i * lineH + lineH / 2;
      return `<text x="${n.cx.toFixed(1)}" y="${lineCY.toFixed(1)}"
        text-anchor="middle" dominant-baseline="central" fill="${labelColor}"
        font-size="${labelFontSize}" font-weight="${labelFontWeight}"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${line}</text>`;
    }).join('');

    const subTop = blockTop + labelBlockH + blockGap;
    const subEl = subLines.map((line, i) => {
      const lineCY = subTop + i * subLineH + subLineH / 2;
      return `<text x="${n.cx.toFixed(1)}" y="${lineCY.toFixed(1)}"
        text-anchor="middle" dominant-baseline="central" fill="${subColor}" font-size="11.5"
        font-family="IBM Plex Sans,system-ui,sans-serif" pointer-events="none">${line}</text>`;
    }).join('');

    // No expand dot — the lines communicating segment→role is enough

    hexes += `
      <g class="ohive-node" data-node-id="${n.id}" data-node-type="${n.type}"
         ${n.segId ? `data-seg-id="${n.segId}"` : ''} style="cursor:pointer">
        <polygon points="${hexPts(n.cx, n.cy)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelEl}${subEl}
      </g>`;
  });

  canvas.innerHTML = `
    <svg id="ohiveSvg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
      <g>${lines}</g>
      <g>${hexes}</g>
    </svg>`;

  canvas.querySelector('#ohiveSvg')?.addEventListener('click', () => clearSelection());

  canvas.querySelectorAll('.ohive-node').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleClick(el.dataset.nodeId, el.dataset.nodeType, e.shiftKey);
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Interaction
// ─────────────────────────────────────────────────────────────────
function handleClick(id, type, shiftKey = false) {
  if (type === 'root') {
    _expandedSegments.clear();
    _selectedId = null;
    redraw();
    showDetail(null, null);
    return;
  }

  if (type === 'segment') {
    if (_expandedSegments.has(id)) {
      _expandedSegments.delete(id);
      const collapsingSegment = activeGroups().find(s => s.id === id);
      (collapsingSegment?.hierarchy || []).forEach(collapseHierarchy);
      _selectedId = null;
    } else {
      if (!shiftKey) _expandedSegments.clear();
      _expandedSegments.add(id);
      _selectedId = id;
    }
    redraw();
    const seg = activeGroups().find(s => s.id === id);
    showDetail(id, 'segment', seg);
    return;
  }

  if (type === 'hierarchy') {
    const seg = activeGroups().find(group => group.hierarchy && hierarchyNodeById(id, group.hierarchy));
    const node = seg ? hierarchyNodeById(id, seg.hierarchy) : null;
    if (!node) return;
    if (node.children?.length) {
      if (_expandedSegments.has(id)) collapseHierarchy(node);
      else _expandedSegments.add(id);
    }
    _selectedId = id;
    redraw();
    showDetail(id, 'hierarchy', node);
    return;
  }

  if (type === 'function') {
    _selectedId = (_selectedId === id) ? null : id;
    redraw();
    if (_selectedId) {
      const seg = activeGroups().find(s => s.functions.some(f => f.id === id));
      const fn  = seg?.functions.find(f => f.id === id);
      showDetail(id, 'function', fn);
    } else {
      showDetail(null, null);
    }
    return;
  }
}

function clearSelection() {
  _selectedId = null;
  redraw();
  showDetail(null, null);
}

// ─────────────────────────────────────────────────────────────────
// Permanent right-side detail panel
// ─────────────────────────────────────────────────────────────────
function field(label, value) {
  if (!value) return '';
  return `
    <div class="odp-field">
      <div class="odp-field-label">${label}</div>
      <div class="odp-field-value">${value}</div>
    </div>`;
}

function showDetail(id, type, data) {
  const panel = document.getElementById('ohiveDetail');
  if (!panel) return;

  if (!id || !data) {
    const isProducts = _chartMode === 'products';
    panel.innerHTML = `
      <div class="ohive-detail-empty">
        <div class="ohive-detail-welcome">
          <div class="ohive-detail-welcome-title">${isProducts ? 'IBM Product Brands' : 'IBM Colonies'}</div>
          <div class="ohive-detail-welcome-body">${isProducts
            ? 'Explore IBM product brands, their products, and the specialized sales motions that connect them.'
            : 'Understand how IBM works, where your role fits, and who you need to succeed.<br><br>Explore client segments, discover key roles, and visualize the connections that drive IBM\'s go-to-market motion.'}</div>
          <div class="ohive-detail-welcome-tip">${isProducts ? 'Select a brand to reveal its products.' : 'Your current role is highlighted in purple.'}</div>
        </div>
      </div>`;
    return;
  }

  if (type === 'hierarchy') {
    const typeLabel = hierarchyTypeLabel(data);
    const detailSub = data.clientCount || (data.sub && data.sub !== typeLabel ? data.sub : '');
    const isEditableColonyNode = Boolean(findHierarchyLocation(data.id));
    const nodeActions = isEditableColonyNode ? `
      <div class="ohive-node-actions">
        <button class="ohive-node-menu-toggle" data-node-menu-toggle aria-label="Node options" title="Node options">⋮</button>
        <div class="ohive-node-menu">
          <button data-node-action="add" data-node-id="${data.id}">Add Child Node</button>
          <button data-node-action="edit" data-node-id="${data.id}">Edit Node</button>
          <button class="danger" data-node-action="delete" data-node-id="${data.id}">Delete Node</button>
        </div>
      </div>` : '';
    const childList = (data.children || []).map(child => `
      <div class="odp-role-row">
        <span class="odp-role-abbr">${child.label}</span>
        ${child.sub ? `<span class="odp-role-label">${child.sub}</span>` : ''}
      </div>`).join('');
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-heading-row">
          <div>
            <div class="odp-type-badge">${typeLabel}</div>
            <div class="odp-title">${data.label}</div>
          </div>
          ${nodeActions}
        </div>
        ${detailSub ? `<div class="odp-sub">${detailSub}</div>` : ''}
        ${data.youAreHere ? '<div class="odp-you-badge">You are here</div>' : ''}
        ${data.desc || data.purpose ? `<div class="odp-desc">${data.desc || data.purpose}</div>` : ''}
        ${data.products ? field(typeLabel === 'Product' ? 'Product Family' : 'Products in This Specialty', data.products) : ''}
        ${data.seller ? field('Select Territory Coverage', data.seller) : ''}
        ${data.salesMotion ? field('Sales Motion', data.salesMotion) : ''}
        ${data.buyer ? field('Typical Buyers', data.buyer) : ''}
        ${childList ? `<div class="odp-section-title">Branches</div><div class="odp-role-list">${childList}</div><div class="odp-hint">Click a branch to continue.</div>` : ''}
      </div>`;
    return;
  }

  if (type === 'segment') {
    const isProducts = _chartMode === 'products';
    let rolesHtml = '';
    if (data.hierarchy) {
      rolesHtml = `<div class="odp-role-list">${data.hierarchy.map(item => `
        <div class="odp-role-row">
          <span class="odp-role-abbr">${item.label}</span>
          <span class="odp-role-label">${item.sub || ''}</span>
        </div>`).join('')}</div>`;
    } else if (data.groupByCategory) {
      const categoryOrder = [];
      const categoryMap   = {};
      data.functions.forEach(f => {
        const cat = f.category || 'Other';
        if (!categoryMap[cat]) { categoryMap[cat] = []; categoryOrder.push(cat); }
        categoryMap[cat].push(f);
      });
      rolesHtml = categoryOrder.map(cat => {
        const rows = categoryMap[cat].map(f =>
          `<div class="odp-role-row">
            <span class="odp-role-abbr">${f.abbr}</span>
            <span class="odp-role-label">${f.label}</span>
          </div>`
        ).join('');
        return `<div class="odp-cat-heading">${cat}</div><div class="odp-role-list">${rows}</div>`;
      }).join('');
    } else {
      rolesHtml = `<div class="odp-role-list">${data.functions.map(f =>
        `<div class="odp-role-row">
          <span class="odp-role-abbr">${f.abbr}</span>
          <span class="odp-role-label">${f.label}</span>
        </div>`
      ).join('')}</div>`;
    }
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-type-badge">${isProducts ? 'Brand' : 'Client Segment'}</div>
        <div class="odp-title">${data.label}</div>
        <div class="odp-sub">${data.clientCount || data.sub}</div>
        <div class="odp-desc">${data.desc}</div>
        <div class="odp-section-title">${isProducts ? 'Products in This Brand' : data.hierarchy ? `${data.label} Branches` : 'Roles in This Segment'}</div>
        ${rolesHtml}
        <div class="odp-hint">Click ${isProducts ? 'a product' : data.hierarchy ? 'a branch to continue' : 'a role to see how it connects to others'}.</div>
      </div>`;
    return;
  }

  if (type === 'function') {
    const isProducts = _chartMode === 'products';
    const ww = (data.worksWith || []).map(w =>
      `<span class="odp-works-tag">${w}</span>`
    ).join('');
    panel.innerHTML = `
      <div class="odp-content">
        <div class="odp-type-badge">${isProducts ? 'Product' : 'Role'}</div>
        <div class="odp-title">${data.abbr}</div>
        <div class="odp-sub">${data.label}</div>
        ${data.youAreHere ? '<div class="odp-you-badge">You are here</div>' : ''}
        <div class="odp-desc">${data.purpose}</div>

        <div class="odp-section-title">${isProducts ? 'Related Products' : 'Works With'}</div>
        <div class="odp-works-tags">${ww || '—'}</div>
        <div class="odp-works-hint">Highlighted in hive above</div>

        ${isProducts ? '' : field('Quota', data.ownsAccounts ? 'Owns accounts — carries quota' : 'Supports quota — does not own accounts')}
        ${isProducts ? '' : field('Sales Motion', data.salesMotion)}
        ${data.products ? field('Products', data.products) : ''}
        ${isProducts && data.seller ? field('Select Territory Coverage', data.seller) : ''}
        ${isProducts && data.salesMotion ? field('Sales Motion', data.salesMotion) : ''}
        ${isProducts && data.buyer ? field('Typical Buyers', data.buyer) : ''}
      </div>`;
  }
}
