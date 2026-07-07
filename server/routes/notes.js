'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/notes?entity_type=account&entity_id=3
router.get('/', (req, res) => {
  const db = getDb();
  const { entity_type, entity_id } = req.query;

  if (!entity_type || !entity_id) {
    return res.status(400).json({ error: 'entity_type and entity_id are required' });
  }

  const notes = db.prepare(
    'SELECT * FROM notes WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC'
  ).all(entity_type, entity_id);

  res.json(notes);
});

// POST /api/notes
router.post('/', (req, res) => {
  const db = getDb();
  const { entity_type, entity_id, body } = req.body;

  if (!entity_type || !entity_id || !body) {
    return res.status(400).json({ error: 'entity_type, entity_id, and body are required' });
  }

  if (!['person', 'account'].includes(entity_type)) {
    return res.status(400).json({ error: 'entity_type must be "person" or "account"' });
  }

  const info = db.prepare(
    'INSERT INTO notes (entity_type, entity_id, body) VALUES (?, ?, ?)'
  ).run(entity_type, entity_id, body);

  res.status(201).json({ id: info.lastInsertRowid });
});

// DELETE /api/notes/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
