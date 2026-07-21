'use strict';

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'hive.db');

// Ensure the db directory exists (useful in CI/fresh clones before seed runs)
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, '..', 'db'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'db'), { recursive: true });
}

let _db;

// Tables that back login + per-user persistence. Created lazily here (in
// addition to schema.sql) so an already-seeded hive.db picks them up without
// needing a full `npm run seed` / data wipe.
function ensureAuthTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      username     TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      pass_hash    TEXT NOT NULL,
      pass_salt    TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS hive_state (
      user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_kv (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key        TEXT NOT NULL,
      data       TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, key)
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);
}

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    ensureAuthTables(_db);
  }
  return _db;
}

module.exports = { getDb };
