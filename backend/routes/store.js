'use strict';

/**
 * store.js — /api/store/:key
 *
 * Generic per-user JSON key-value store. Any feature view that needs its own
 * independent saved state can read/write here without a bespoke table.
 *
 *   GET /api/store/:key  (Bearer token) -> { data: <object|null>, updated_at }
 *   PUT /api/store/:key  (Bearer token) { data } -> { ok: true, updated_at }
 */

const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('./auth');

const router = Router();
router.use(requireAuth);

const KEY_RE = /^[a-zA-Z0-9._-]{1,64}$/;

router.get('/:key', (req, res) => {
  if (!KEY_RE.test(req.params.key)) return res.status(400).json({ error: 'Invalid key' });
  const row = getDb()
    .prepare('SELECT data, updated_at FROM user_kv WHERE user_id = ? AND key = ?')
    .get(req.user.id, req.params.key);
  if (!row) return res.json({ data: null, updated_at: null });
  let data = null;
  try { data = JSON.parse(row.data); } catch { data = null; }
  res.json({ data, updated_at: row.updated_at });
});

router.put('/:key', (req, res) => {
  if (!KEY_RE.test(req.params.key)) return res.status(400).json({ error: 'Invalid key' });
  const data = req.body && req.body.data;
  if (data === undefined || data === null || typeof data !== 'object') {
    return res.status(400).json({ error: 'Expected a { data: {...} } body' });
  }
  const json = JSON.stringify(data);
  if (json.length > 5_000_000) return res.status(413).json({ error: 'Data too large' });

  getDb().prepare(`
    INSERT INTO user_kv (user_id, key, data, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(req.user.id, req.params.key, json);

  res.json({ ok: true, updated_at: new Date().toISOString() });
});

module.exports = router;
