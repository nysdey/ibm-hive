'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'hive.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Run schema DDL then seed all tables
function seed() {
  // Remove existing DB so seed is idempotent
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing hive.db');
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log('Schema applied.');

  // ── MARKETS ────────────────────────────────────────────────────
  const insertMarket = db.prepare(
    'INSERT INTO markets (name, color, headcount) VALUES (?, ?, ?)'
  );
  const markets = db.transaction(() => {
    insertMarket.run('Enterprise', '#4d7bff', 102);
    insertMarket.run('Strategic',  '#a855f7', 78);
    insertMarket.run('Horizon',    '#6c63ff', 64);
    insertMarket.run('Territory',  '#d946ef', 40);
  });
  markets();

  const mkt = {};
  db.prepare('SELECT id, name FROM markets').all().forEach(r => { mkt[r.name] = r.id; });

  // ── COMBS ──────────────────────────────────────────────────────
  const insertComb = db.prepare(
    'INSERT INTO combs (name, market_id, color) VALUES (?, ?, ?)'
  );
  const combs = db.transaction(() => {
    insertComb.run('Mid-Market Sales',       mkt['Enterprise'], '#4d7bff');
    insertComb.run('Financial Services',     mkt['Enterprise'], '#4d7bff');
    insertComb.run('Global Strategic Accts', mkt['Strategic'],  '#a855f7');
    insertComb.run('Growth Markets',         mkt['Horizon'],    '#6c63ff');
    insertComb.run('SMB Territory',          mkt['Territory'],  '#d946ef');
  });
  combs();

  const combMap = {};
  db.prepare('SELECT id, name FROM combs').all().forEach(r => { combMap[r.name] = r.id; });

  // ── PEOPLE ─────────────────────────────────────────────────────
  const insertPerson = db.prepare(`
    INSERT INTO people
      (first_name, last_name, initials, role, role_type, market_id, comb_id,
       manager_id, email, slack, location, color, is_current_user, joined_date)
    VALUES
      (@first_name, @last_name, @initials, @role, @role_type, @market_id, @comb_id,
       @manager_id, @email, @slack, @location, @color, @is_current_user, @joined_date)
  `);

  // Insert in order so we can reference manager IDs
  const seedPeople = db.transaction(() => {
    // ── Enterprise VPs / Directors ──
    insertPerson.run({
      first_name:'Rachel', last_name:'Kim', initials:'RK',
      role:'VP, Enterprise Sales', role_type:'exec',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:null,
      email:'rachel.kim@ibm.com', slack:'@rachel.kim', location:'Austin, TX',
      color:'#c026d3', is_current_user:0, joined_date:'2018-03-01'
    });
    const rachel = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Marcus', last_name:'Park', initials:'MP',
      role:'Director, Mid-Market', role_type:'director',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:rachel,
      email:'marcus.park@ibm.com', slack:'@marcus.park', location:'San Francisco, CA',
      color:'#a855f7', is_current_user:0, joined_date:'2019-07-15'
    });
    const marcus = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Sofia', last_name:'Becker', initials:'SB',
      role:'Sales Manager', role_type:'manager',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:marcus,
      email:'sofia.becker@ibm.com', slack:'@sofia.b', location:'Chicago, IL',
      color:'#6c63ff', is_current_user:0, joined_date:'2020-01-10'
    });
    const sofia = db.prepare('SELECT last_insert_rowid() as id').get().id;

    // ── Current user ──
    insertPerson.run({
      first_name:'Sydney', last_name:'Chin', initials:'SC',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:sofia,
      email:'sydney.chin@ibm.com', slack:'@sydney.chin', location:'New York, NY',
      color:'#4d7bff', is_current_user:1, joined_date:'2021-06-01'
    });
    const jordan = db.prepare('SELECT last_insert_rowid() as id').get().id;

    // ── Enterprise peers ──
    insertPerson.run({
      first_name:'Amir', last_name:'Tahir', initials:'AT',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:sofia,
      email:'amir.tahir@ibm.com', slack:'@amir.t', location:'New York, NY',
      color:'#60a5fa', is_current_user:0, joined_date:'2021-06-01'
    });
    const amir = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Clara', last_name:'Nguyen', initials:'CN',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:sofia,
      email:'clara.nguyen@ibm.com', slack:'@clara.n', location:'Boston, MA',
      color:'#60a5fa', is_current_user:0, joined_date:'2022-01-15'
    });

    insertPerson.run({
      first_name:'Greg', last_name:'Hall', initials:'GH',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:sofia,
      email:'greg.hall@ibm.com', slack:'@greg.h', location:'Chicago, IL',
      color:'#4d7bff', is_current_user:0, joined_date:'2021-09-01'
    });

    insertPerson.run({
      first_name:'Priya', last_name:'Shah', initials:'PS',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:sofia,
      email:'priya.shah@ibm.com', slack:'@priya.s', location:'Austin, TX',
      color:'#4d7bff', is_current_user:0, joined_date:'2022-03-01'
    });

    // ── Enterprise technical / support ──
    insertPerson.run({
      first_name:'Dev', last_name:'Patel', initials:'DP',
      role:'Technical Sales Engineer', role_type:'tse',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:marcus,
      email:'dev.patel@ibm.com', slack:'@dev.patel', location:'Austin, TX',
      color:'#a855f7', is_current_user:0, joined_date:'2020-05-01'
    });
    const dev = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Lisa', last_name:'Wang', initials:'LW',
      role:'Customer Success Manager', role_type:'csm',
      market_id:mkt['Enterprise'], comb_id:combMap['Mid-Market Sales'],
      manager_id:marcus,
      email:'lisa.wang@ibm.com', slack:'@lisa.w', location:'Seattle, WA',
      color:'#4338ca', is_current_user:0, joined_date:'2020-08-15'
    });
    const lisa = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Omar', last_name:'Diaz', initials:'OD',
      role:'Sales Development Rep', role_type:'sdr',
      market_id:mkt['Territory'], comb_id:combMap['SMB Territory'],
      manager_id:sofia,
      email:'omar.diaz@ibm.com', slack:'@omar.d', location:'New York, NY',
      color:'#7e22ce', is_current_user:0, joined_date:'2023-02-01'
    });
    const omar = db.prepare('SELECT last_insert_rowid() as id').get().id;

    // ── Strategic market ──
    insertPerson.run({
      first_name:'James', last_name:'Wu', initials:'JW',
      role:'VP, Strategic Accounts', role_type:'exec',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:null,
      email:'james.wu@ibm.com', slack:'@james.wu', location:'New York, NY',
      color:'#c026d3', is_current_user:0, joined_date:'2017-01-01'
    });
    const james = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Keisha', last_name:'Morris', initials:'KM',
      role:'AE, Strategic Accounts', role_type:'ae',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:james,
      email:'keisha.morris@ibm.com', slack:'@keisha.m', location:'Atlanta, GA',
      color:'#a855f7', is_current_user:0, joined_date:'2022-05-01'
    });
    const keisha = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Dana', last_name:'Fox', initials:'DF',
      role:'AE, Strategic Accounts', role_type:'ae',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:james,
      email:'dana.fox@ibm.com', slack:'@dana.f', location:'Chicago, IL',
      color:'#a855f7', is_current_user:0, joined_date:'2021-11-01'
    });

    insertPerson.run({
      first_name:'Neil', last_name:'Singh', initials:'NS',
      role:'Director, Strategic', role_type:'director',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:james,
      email:'neil.singh@ibm.com', slack:'@neil.s', location:'San Francisco, CA',
      color:'#a855f7', is_current_user:0, joined_date:'2019-03-01'
    });

    insertPerson.run({
      first_name:'Tanya', last_name:'Jones', initials:'TJ',
      role:'Partner Ecosystem Lead', role_type:'partner',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:james,
      email:'tanya.jones@ibm.com', slack:'@tanya.j', location:'Chicago, IL',
      color:'#c026d3', is_current_user:0, joined_date:'2020-09-01'
    });
    const tanya = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Ben', last_name:'Rocha', initials:'BR',
      role:'Consulting Partner', role_type:'partner',
      market_id:mkt['Strategic'], comb_id:combMap['Global Strategic Accts'],
      manager_id:james,
      email:'ben.rocha@ibm.com', slack:'@ben.r', location:'Dallas, TX',
      color:'#7e22ce', is_current_user:0, joined_date:'2021-04-01'
    });
    const ben = db.prepare('SELECT last_insert_rowid() as id').get().id;

    // ── Horizon market ──
    insertPerson.run({
      first_name:'Ingrid', last_name:'Larsen', initials:'IL',
      role:'VP, Horizon Markets', role_type:'exec',
      market_id:mkt['Horizon'], comb_id:combMap['Growth Markets'],
      manager_id:null,
      email:'ingrid.larsen@ibm.com', slack:'@ingrid.l', location:'Toronto, ON',
      color:'#c026d3', is_current_user:0, joined_date:'2016-06-01'
    });
    const ingrid = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Carlos', last_name:'Vega', initials:'CV',
      role:'Sales Manager, Horizon', role_type:'manager',
      market_id:mkt['Horizon'], comb_id:combMap['Growth Markets'],
      manager_id:ingrid,
      email:'carlos.vega@ibm.com', slack:'@carlos.v', location:'Miami, FL',
      color:'#60a5fa', is_current_user:0, joined_date:'2020-02-01'
    });
    const carlos = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Yui', last_name:'Tanaka', initials:'YT',
      role:'Account Executive', role_type:'ae',
      market_id:mkt['Horizon'], comb_id:combMap['Growth Markets'],
      manager_id:carlos,
      email:'yui.tanaka@ibm.com', slack:'@yui.t', location:'San Jose, CA',
      color:'#60a5fa', is_current_user:0, joined_date:'2022-08-01'
    });

    // ── Territory market ──
    insertPerson.run({
      first_name:'Sam', last_name:'Okonkwo', initials:'SO',
      role:'VP, Territory Sales', role_type:'exec',
      market_id:mkt['Territory'], comb_id:combMap['SMB Territory'],
      manager_id:null,
      email:'sam.okonkwo@ibm.com', slack:'@sam.o', location:'Atlanta, GA',
      color:'#c026d3', is_current_user:0, joined_date:'2018-11-01'
    });
    const sam = db.prepare('SELECT last_insert_rowid() as id').get().id;

    insertPerson.run({
      first_name:'Nina', last_name:'Hoffman', initials:'NH',
      role:'Sales Manager, Territory', role_type:'manager',
      market_id:mkt['Territory'], comb_id:combMap['SMB Territory'],
      manager_id:sam,
      email:'nina.hoffman@ibm.com', slack:'@nina.h', location:'Denver, CO',
      color:'#6c63ff', is_current_user:0, joined_date:'2021-01-15'
    });

    return { jordan, sofia, marcus, rachel, amir, dev, lisa, omar, keisha, tanya, ben };
  });

  const ids = seedPeople();

  // ── NETWORK CONNECTIONS ────────────────────────────────────────
  const insertConn = db.prepare(`
    INSERT INTO network_connections (person_id, relationship, how_we_met, notes, needs_followup)
    VALUES (@person_id, @relationship, @how_we_met, @notes, @needs_followup)
  `);

  // Look up people by email for convenience
  const p = {};
  db.prepare('SELECT id, email FROM people').all().forEach(r => { p[r.email] = r.id; });

  const seedNetwork = db.transaction(() => {
    insertConn.run({ person_id: p['sofia.becker@ibm.com'],  relationship:'close_ally',  how_we_met:'Onboarding 2021',         notes:'Direct manager. Weekly 1:1 Tuesdays. Championed my last deal close — always in my corner.', needs_followup:0 });
    insertConn.run({ person_id: p['dev.patel@ibm.com'],     relationship:'partner',     how_we_met:'Accenture deal 2022',     notes:'Go-to TSE for watsonx demos. Helped close Accenture deal in Q3. Schedule 48h in advance.', needs_followup:0 });
    insertConn.run({ person_id: p['amir.tahir@ibm.com'],    relationship:'close_ally',  how_we_met:'Bootcamp 2021',           notes:'Peer AE. We share intel on competitive deals. Covers Finance vertical — good for referrals.', needs_followup:0 });
    insertConn.run({ person_id: p['lisa.wang@ibm.com'],     relationship:'partner',     how_we_met:'Account handoff 2022',   notes:'CSM for my top 3 accounts. Flags renewal risk early. Ping her before any EBR.', needs_followup:0 });
    insertConn.run({ person_id: p['tanya.jones@ibm.com'],   relationship:'cross_brand', how_we_met:'Partner summit 2023',    notes:'Runs the AWS co-sell motion. Introduced 2 new logos in Q2. Monthly coffee chat.', needs_followup:0 });
    insertConn.run({ person_id: p['ben.rocha@ibm.com'],     relationship:'cross_brand', how_we_met:'GBS collaboration 2023', notes:'GBS consultant — same client base. Good for services attach. Loop in on IBM Consulting co-sells.', needs_followup:0 });
    insertConn.run({ person_id: p['omar.diaz@ibm.com'],     relationship:'close_ally',  how_we_met:'Team assignment 2023',   notes:'My SDR. Methodical, always leaves detailed call notes in Salesforce. Pipeline quality is high.', needs_followup:0 });
    insertConn.run({ person_id: p['keisha.morris@ibm.com'], relationship:'partner',     how_we_met:'Partner summit 2023',    notes:"Warm intro'd to JPMorgan contact. Need to follow up on Citi collab by end of month.", needs_followup:1 });
  });
  seedNetwork();

  // ── ACCOUNTS ──────────────────────────────────────────────────
  const insertAcct = db.prepare(`
    INSERT INTO accounts (name, short_name, industry, stage, value_usd, owner_id, notes, champion, renewal_date)
    VALUES (@name, @short_name, @industry, @stage, @value_usd, @owner_id, @notes, @champion, @renewal_date)
  `);

  const jordan_id = p['sydney.chin@ibm.com'];

  const seedAccounts = db.transaction(() => {
    insertAcct.run({ name:'Acme Corp',         short_name:'Acme',     industry:'Manufacturing',      stage:'Closed Won',  value_usd:820000,  owner_id:jordan_id, notes:'Full watsonx deployment. Renewal in Q1. Champion: Sarah Mills (CTO).', champion:'Sarah Mills, CTO', renewal_date:'2025-01-15' });
    insertAcct.run({ name:'JPMorgan Chase',     short_name:'JPMorgan', industry:'Financial Services', stage:'Negotiation', value_usd:1100000, owner_id:jordan_id, notes:'In legal review. Procurement wants 15% discount. Decision by end of month.', champion:'Tom Reed, SVP IT', renewal_date:null });
    insertAcct.run({ name:'Ford Motor Co',      short_name:'Ford',     industry:'Automotive',         stage:'Proposal',    value_usd:650000,  owner_id:jordan_id, notes:'Proposal submitted. Competing against Microsoft Azure. Need exec sponsor.', champion:'Amy Chen, CIO', renewal_date:null });
    insertAcct.run({ name:'Citibank',           short_name:'Citi',     industry:'Financial Services', stage:'At Risk',     value_usd:430000,  owner_id:jordan_id, notes:'Champion left the company. Need to re-engage new IT lead. CSM flagged in red.', champion:'VACANT', renewal_date:null });
    insertAcct.run({ name:'BMS Health',         short_name:'BMS',      industry:'Healthcare',         stage:'Closed Won',  value_usd:510000,  owner_id:jordan_id, notes:'Post-sale implementation underway. Potential expansion in Q3 for additional BUs.', champion:'Dr. Patel, CTO', renewal_date:'2025-06-01' });
    insertAcct.run({ name:'Delta Airlines',     short_name:'Delta',    industry:'Travel & Transport', stage:'Negotiation', value_usd:780000,  owner_id:jordan_id, notes:'Verbal yes from CISO. Waiting on legal terms. Strong IBM Security angle.', champion:'Mike Shore, CISO', renewal_date:null });
    insertAcct.run({ name:'Lenovo',             short_name:'Lenovo',   industry:'Technology',         stage:'Prospect',    value_usd:null,    owner_id:jordan_id, notes:'Initial discovery call done. Need to qualify budget and timeline.', champion:null, renewal_date:null });
    insertAcct.run({ name:'Toyota',             short_name:'Toyota',   industry:'Automotive',         stage:'Proposal',    value_usd:390000,  owner_id:jordan_id, notes:'watsonx Code Assistant use case. Decision maker is SVP Engineering.', champion:'Brian Ngo, SVP Eng', renewal_date:null });
    insertAcct.run({ name:'CSX Rail',           short_name:'CSX',      industry:'Transportation',     stage:'At Risk',     value_usd:290000,  owner_id:jordan_id, notes:'Delayed procurement cycle. Champion on leave. Need to re-qualify.', champion:'(on leave)', renewal_date:null });
    insertAcct.run({ name:'Unilever',           short_name:'Unilever', industry:'Consumer Goods',     stage:'Closed Won',  value_usd:670000,  owner_id:jordan_id, notes:'Expansion deal closed Q2. Moving into 3 new regions. Great reference account.', champion:'Claire Duval, CDO', renewal_date:'2025-09-01' });
    insertAcct.run({ name:'Siemens',            short_name:'Siemens',  industry:'Industrial',         stage:'Prospect',    value_usd:null,    owner_id:jordan_id, notes:'Referral from Keisha. Early stage. Meeting scheduled for next week.', champion:null, renewal_date:null });
    insertAcct.run({ name:'American Express',   short_name:'Amex',     industry:'Financial Services', stage:'Negotiation', value_usd:920000,  owner_id:jordan_id, notes:'Largest active deal. Strong exec sponsor. Procurement is fast-tracking.', champion:'Rita Kaur, SVP Ops', renewal_date:null });
    insertAcct.run({ name:'Pfizer',             short_name:'Pfizer',   industry:'Pharma',             stage:'Closed Won',  value_usd:340000,  owner_id:jordan_id, notes:'Use case: document intelligence. Upsell opportunity for Security module.', champion:'Lena Park, CISO', renewal_date:'2025-03-01' });
    insertAcct.run({ name:'Vodafone',           short_name:'Vodafone', industry:'Telecom',            stage:'Proposal',    value_usd:210000,  owner_id:jordan_id, notes:'Proposal sent. Competing on price. Need to show TCO advantage.', champion:'George Fox, CDO', renewal_date:null });
    insertAcct.run({ name:'Walmart',            short_name:'Walmart',  industry:'Retail',             stage:'Prospect',    value_usd:null,    owner_id:jordan_id, notes:'Cold outreach via Omar (SDR). Need to schedule discovery.', champion:null, renewal_date:null });
    insertAcct.run({ name:'HSBC',               short_name:'HSBC',     industry:'Financial Services', stage:'At Risk',     value_usd:380000,  owner_id:jordan_id, notes:'Regulatory blockers delayed deal. Re-engaging Q3.', champion:'Alan Cross, CTO', renewal_date:null });
    insertAcct.run({ name:'SAP SE',             short_name:'SAP',      industry:'Technology',         stage:'Closed Won',  value_usd:420000,  owner_id:jordan_id, notes:'Partner co-sell closed. Potential to expand into SAP BTP integration.', champion:'Mia Fischer, CIO', renewal_date:'2025-04-01' });
    insertAcct.run({ name:'AT&T',               short_name:'AT&T',     industry:'Telecom',            stage:'Negotiation', value_usd:560000,  owner_id:jordan_id, notes:'Two-horse race vs AWS. Strong IBM advantage on data residency.', champion:'Ken Wallace, SVP IT', renewal_date:null });
  });
  seedAccounts();

  // ── ACCOUNT COLLABORATORS ──────────────────────────────────────
  const insertCollab = db.prepare(
    'INSERT INTO account_collaborators (account_id, person_id, role_on_acct) VALUES (?, ?, ?)'
  );

  const acctMap = {};
  db.prepare('SELECT id, short_name FROM accounts').all().forEach(r => { acctMap[r.short_name] = r.id; });

  const seedCollabs = db.transaction(() => {
    // Dev Patel (TSE) on several deals
    insertCollab.run(acctMap['JPMorgan'], p['dev.patel@ibm.com'],  'TSE');
    insertCollab.run(acctMap['Ford'],     p['dev.patel@ibm.com'],  'TSE');
    insertCollab.run(acctMap['Delta'],    p['dev.patel@ibm.com'],  'TSE');
    insertCollab.run(acctMap['Toyota'],   p['dev.patel@ibm.com'],  'TSE');
    // Lisa Wang (CSM) on closed/active accounts
    insertCollab.run(acctMap['Acme'],     p['lisa.wang@ibm.com'],  'CSM');
    insertCollab.run(acctMap['BMS'],      p['lisa.wang@ibm.com'],  'CSM');
    insertCollab.run(acctMap['Unilever'], p['lisa.wang@ibm.com'],  'CSM');
    // Keisha on strategic-adjacent accounts
    insertCollab.run(acctMap['JPMorgan'], p['keisha.morris@ibm.com'], 'Exec Sponsor');
    insertCollab.run(acctMap['Citi'],     p['keisha.morris@ibm.com'], 'Exec Sponsor');
    // Sofia as manager sponsor on biggest deals
    insertCollab.run(acctMap['Amex'],  p['sofia.becker@ibm.com'], 'Manager Sponsor');
    insertCollab.run(acctMap['Delta'], p['sofia.becker@ibm.com'], 'Manager Sponsor');
  });
  seedCollabs();

  // ── NOTES ─────────────────────────────────────────────────────
  const insertNote = db.prepare(
    'INSERT INTO notes (entity_type, entity_id, body, created_at) VALUES (?, ?, ?, ?)'
  );

  const seedNotes = db.transaction(() => {
    // Account notes
    insertNote.run('account', acctMap['JPMorgan'], 'Procurement confirmed 3-year term preferred. Push for multi-year pricing lever.', '2024-11-01 09:00:00');
    insertNote.run('account', acctMap['JPMorgan'], 'Met with Tom Reed at IBM Think. Very positive on watsonx. Decision expected EOQ.', '2024-10-15 14:30:00');
    insertNote.run('account', acctMap['Citi'],     'New IT lead is Sandra Obi. Scheduled intro call for Nov 18.', '2024-11-05 11:00:00');
    insertNote.run('account', acctMap['Delta'],    'CISO confirmed budget approved. Legal review is the only blocker.', '2024-10-28 16:00:00');
    insertNote.run('account', acctMap['Amex'],     'Exec sponsor confirmed: Rita Kaur is fully behind this. Fast-track approval in progress.', '2024-11-02 10:00:00');
    // Person notes
    insertNote.run('person',  p['keisha.morris@ibm.com'], 'Follow up on Citi collab by Nov 30.', '2024-11-01 08:00:00');
    insertNote.run('person',  p['dev.patel@ibm.com'],     'Dev confirmed availability for Toyota demo on Nov 20.', '2024-11-10 09:00:00');
  });
  seedNotes();

  db.close();
  console.log('Seed complete. Database written to db/hive.db');
}

seed();
