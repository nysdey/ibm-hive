'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/network
// Returns all connections with full person detail
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      nc.id, nc.relationship, nc.how_we_met, nc.notes, nc.needs_followup,
      nc.created_at, nc.updated_at,
      p.id         AS person_id,
      p.first_name, p.last_name, p.initials, p.role, p.role_type,
      p.email, p.slack, p.location, p.color,
      m.name       AS market
    FROM network_connections nc
    JOIN people  p ON p.id = nc.person_id
    LEFT JOIN markets m ON m.id = p.market_id
    ORDER BY nc.relationship, p.last_name
  `).all();

  // Filter by relationship type
  if (req.query.relationship) {
    return res.json(rows.filter(r => r.relationship === req.query.relationship));
  }

  res.json(rows);
});

// POST /api/network — add a connection
router.post('/', (req, res) => {
  const db = getDb();
  const { person_id, relationship, how_we_met, notes, needs_followup } = req.body;

  if (!person_id || !relationship) {
    return res.status(400).json({ error: 'person_id and relationship are required' });
  }

  const info = db.prepare(`
    INSERT INTO network_connections (person_id, relationship, how_we_met, notes, needs_followup)
    VALUES (?, ?, ?, ?, ?)
  `).run(person_id, relationship, how_we_met || null, notes || null, needs_followup ? 1 : 0);

  res.status(201).json({ id: info.lastInsertRowid });
});

// PATCH /api/network/:id — update notes / relationship
router.patch('/:id', (req, res) => {
  const db = getDb();
  const { relationship, how_we_met, notes, needs_followup } = req.body;

  const conn = db.prepare('SELECT id FROM network_connections WHERE id = ?').get(req.params.id);
  if (!conn) return res.status(404).json({ error: 'Not found' });

  db.prepare(`
    UPDATE network_connections
    SET relationship  = COALESCE(?, relationship),
        how_we_met    = COALESCE(?, how_we_met),
        notes         = COALESCE(?, notes),
        needs_followup = COALESCE(?, needs_followup),
        updated_at    = datetime('now')
    WHERE id = ?
  `).run(
    relationship  ?? null,
    how_we_met    ?? null,
    notes         ?? null,
    needs_followup != null ? (needs_followup ? 1 : 0) : null,
    req.params.id
  );

  res.json({ ok: true });
});

// DELETE /api/network/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM network_connections WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
