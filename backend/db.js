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

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

module.exports = { getDb };
