-- IBM Hive Database Schema
-- SQLite

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────
-- MARKETS
-- Enterprise, Strategic, Horizon, Territory
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS markets (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name     TEXT NOT NULL UNIQUE,
  color    TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────
-- COMBS (Business units / divisions / portfolio pillars)
-- A comb belongs to a market
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS combs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  color     TEXT
);

-- ─────────────────────────────────────────────
-- PEOPLE (every bee in the hive)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  initials   TEXT NOT NULL,
  role       TEXT NOT NULL,
  role_type  TEXT NOT NULL CHECK(role_type IN ('exec','director','manager','ae','tse','csm','sdr','partner','other')),
  market_id  INTEGER REFERENCES markets(id),
  comb_id    INTEGER REFERENCES combs(id),
  manager_id INTEGER REFERENCES people(id),
  email      TEXT UNIQUE,
  slack      TEXT,
  location   TEXT,
  color      TEXT NOT NULL DEFAULT '#0f62fe',
  is_current_user INTEGER NOT NULL DEFAULT 0 CHECK(is_current_user IN (0,1)),
  joined_date TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- NETWORK CONNECTIONS
-- Relationship between the current user and another person
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS network_connections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id     INTEGER NOT NULL REFERENCES people(id),
  relationship  TEXT NOT NULL CHECK(relationship IN ('close_ally','partner','cross_brand','client','peer')),
  how_we_met    TEXT,
  notes         TEXT,
  needs_followup INTEGER NOT NULL DEFAULT 0 CHECK(needs_followup IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- ACCOUNTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  short_name  TEXT,
  industry    TEXT NOT NULL,
  stage       TEXT NOT NULL CHECK(stage IN ('Closed Won','Negotiation','Proposal','At Risk','Prospect')),
  value_usd   INTEGER,            -- deal value in dollars, NULL for prospects
  owner_id    INTEGER REFERENCES people(id),
  notes       TEXT,
  champion    TEXT,               -- champion contact name/title at the account
  renewal_date TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- ACCOUNT COLLABORATORS
-- Other IBM people involved on an account
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS account_collaborators (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  person_id  INTEGER NOT NULL REFERENCES people(id),
  role_on_acct TEXT,              -- e.g. "TSE", "CSM", "Exec Sponsor"
  UNIQUE(account_id, person_id)
);

-- ─────────────────────────────────────────────
-- NOTES (open notes on any person or account)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('person','account')),
  entity_id   INTEGER NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_people_market    ON people(market_id);
CREATE INDEX IF NOT EXISTS idx_people_manager   ON people(manager_id);
CREATE INDEX IF NOT EXISTS idx_accounts_owner   ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_accounts_stage   ON accounts(stage);
CREATE INDEX IF NOT EXISTS idx_notes_entity     ON notes(entity_type, entity_id);
