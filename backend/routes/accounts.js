'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/accounts
// Query params: ?stage=Negotiation  ?owner=<id>  ?search=jpmorgan
router.get('/', (req, res) => {
  const db = getDb();
  let sql = `
    SELECT
      a.*,
      p.first_name || ' ' || p.last_name AS owner_name
    FROM accounts a
    LEFT JOIN people p ON p.id = a.owner_id
    WHERE 1=1
  `;
  const params = [];

  if (req.query.stage) {
    sql += ' AND a.stage = ?';
    params.push(req.query.stage);
  }
  if (req.query.owner) {
    sql += ' AND a.owner_id = ?';
    params.push(req.query.owner);
  }
  if (req.query.search) {
    sql += ' AND (a.name LIKE ? OR a.industry LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term);
  }
  sql += ' ORDER BY a.stage, a.value_usd DESC';

  const accounts = db.prepare(sql).all(...params);

  // Attach collaborators to each account
  accounts.forEach(acct => {
    acct.collaborators = db.prepare(`
      SELECT p.id, p.initials, p.first_name, p.last_name, p.role_type, p.color, ac.role_on_acct
      FROM account_collaborators ac
      JOIN people p ON p.id = ac.person_id
      WHERE ac.account_id = ?
    `).all(acct.id);
  });

  res.json(accounts);
});

// GET /api/accounts/:id — single account with full details
router.get('/:id', (req, res) => {
  const db = getDb();
  const acct = db.prepare(`
    SELECT a.*, p.first_name || ' ' || p.last_name AS owner_name
    FROM accounts a
    LEFT JOIN people p ON p.id = a.owner_id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!acct) return res.status(404).json({ error: 'Not found' });

  acct.collaborators = db.prepare(`
    SELECT p.id, p.initials, p.first_name, p.last_name, p.role_type, p.color, ac.role_on_acct
    FROM account_collaborators ac
    JOIN people p ON p.id = ac.person_id
    WHERE ac.account_id = ?
  `).all(acct.id);

  acct.notes = db.prepare(
    "SELECT * FROM notes WHERE entity_type='account' AND entity_id=? ORDER BY created_at DESC"
  ).all(acct.id);

  res.json(acct);
});

// POST /api/accounts
router.post('/', (req, res) => {
  const db = getDb();
  const { name, short_name, industry, stage, value_usd, owner_id, notes, champion, renewal_date } = req.body;

  if (!name || !industry || !stage) {
    return res.status(400).json({ error: 'name, industry, and stage are required' });
  }

  const info = db.prepare(`
    INSERT INTO accounts (name, short_name, industry, stage, value_usd, owner_id, notes, champion, renewal_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, short_name || name, industry, stage, value_usd || null, owner_id || null, notes || null, champion || null, renewal_date || null);

  res.status(201).json({ id: info.lastInsertRowid });
});

// PATCH /api/accounts/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const acct = db.prepare('SELECT id FROM accounts WHERE id = ?').get(req.params.id);
  if (!acct) return res.status(404).json({ error: 'Not found' });

  const fields = ['name','short_name','industry','stage','value_usd','owner_id','notes','champion','renewal_date'];
  const updates = [];
  const params = [];

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(req.body[f]);
    }
  });

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

module.exports = router;
