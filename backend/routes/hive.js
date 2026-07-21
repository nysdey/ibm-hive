'use strict';

/**
 * hive.js — /api/hive
 *
 * Per-user persistence for the "My Combs" view. The frontend keeps the whole
 * normalized hive graph (people, connections, combs) as one JSON document and
 * syncs it here. One row per user in hive_state.
 *
 *   GET /api/hive   (Bearer token) -> { data: <object|null>, updated_at }
 *   PUT /api/hive   (Bearer token) { data } -> { ok: true, updated_at }
 */

const { Router } = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('./auth');

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const row = getDb()
    .prepare('SELECT data, updated_at FROM hive_state WHERE user_id = ?')
    .get(req.user.id);

  if (!row) return res.json({ data: null, updated_at: null });

  let data = null;
  try { data = JSON.parse(row.data); } catch { data = null; }
  res.json({ data, updated_at: row.updated_at });
});

router.put('/', (req, res) => {
  const data = req.body && req.body.data;
  if (data === undefined || data === null || typeof data !== 'object') {
    return res.status(400).json({ error: 'Expected a { data: {...} } body' });
  }

  const json = JSON.stringify(data);
  // ~5MB guard — a personal network should never approach this.
  if (json.length > 5_000_000) {
    return res.status(413).json({ error: 'Hive data too large' });
  }

  getDb().prepare(`
    INSERT INTO hive_state (user_id, data, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(req.user.id, json);

  res.json({ ok: true, updated_at: new Date().toISOString() });
});

module.exports = router;
