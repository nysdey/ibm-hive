'use strict';

/**
 * auth.js — /api/auth
 *
 * Dependency-free authentication using Node's built-in crypto (scrypt).
 * No bcrypt / passport / express-session needed.
 *
 *   POST /api/auth/register  { username, password, display_name? } -> { token, user }
 *   POST /api/auth/login     { username, password }                -> { token, user }
 *   POST /api/auth/logout    (Bearer token)                        -> { ok: true }
 *   GET  /api/auth/me        (Bearer token)                        -> { user }
 *
 * The exported `requireAuth` middleware attaches req.user = { id, username, display_name }.
 */

const { Router } = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');

const router = Router();

// ── Password hashing (scrypt) ─────────────────────────────────────
function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return { hash: hash.toString('hex'), salt: salt.toString('hex') };
}

function verifyPassword(password, saltHex, expectedHex) {
  const { hash } = hashPassword(password, saltHex);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function publicUser(row) {
  return { id: row.id, username: row.username, display_name: row.display_name };
}

// ── Middleware ────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const db = getDb();
  const row = db.prepare(`
    SELECT u.id, u.username, u.display_name
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token);

  if (!row) return res.status(401).json({ error: 'Invalid or expired session' });
  req.user = publicUser(row);
  req.token = token;
  next();
}

// ── Routes ────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const displayName = String(req.body.display_name || '').trim() || username;

  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'That username is taken' });

  const { hash, salt } = hashPassword(password);
  const info = db.prepare(
    'INSERT INTO users (username, display_name, pass_hash, pass_salt) VALUES (?, ?, ?, ?)'
  ).run(username, displayName, hash, salt);

  const token = newToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, info.lastInsertRowid);

  res.json({
    token,
    user: { id: info.lastInsertRowid, username, display_name: displayName },
  });
});

router.post('/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  // Same generic message whether the user exists or the password is wrong.
  if (!row || !verifyPassword(password, row.pass_salt, row.pass_hash)) {
    return res.status(401).json({ error: 'Incorrect username or password' });
  }

  const token = newToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, row.id);
  res.json({ token, user: publicUser(row) });
});

router.post('/logout', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
module.exports.requireAuth = requireAuth;
