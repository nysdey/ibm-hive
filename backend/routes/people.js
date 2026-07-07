'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/people
// Query params: ?market=Enterprise  ?role_type=ae  ?search=jordan
router.get('/', (req, res) => {
  const db = getDb();
  let sql = `
    SELECT
      p.id, p.first_name, p.last_name, p.initials, p.role, p.role_type,
      p.email, p.slack, p.location, p.color, p.is_current_user, p.joined_date,
      m.name  AS market,
      m.color AS market_color,
      c.name  AS comb,
      mgr.first_name || ' ' || mgr.last_name AS manager_name,
      p.manager_id
    FROM people p
    LEFT JOIN markets m ON m.id = p.market_id
    LEFT JOIN combs   c ON c.id = p.comb_id
    LEFT JOIN people mgr ON mgr.id = p.manager_id
    WHERE 1=1
  `;
  const params = [];

  if (req.query.market) {
    sql += ' AND m.name = ?';
    params.push(req.query.market);
  }
  if (req.query.role_type) {
    sql += ' AND p.role_type = ?';
    params.push(req.query.role_type);
  }
  if (req.query.search) {
    sql += ' AND (p.first_name || " " || p.last_name LIKE ? OR p.role LIKE ?)';
    const term = `%${req.query.search}%`;
    params.push(term, term);
  }
  sql += ' ORDER BY p.role_type, p.last_name';

  res.json(db.prepare(sql).all(...params));
});

// GET /api/people/:id — full detail + chain
router.get('/:id', (req, res) => {
  const db = getDb();
  const person = db.prepare(`
    SELECT
      p.*,
      m.name  AS market,
      m.color AS market_color,
      c.name  AS comb,
      mgr.first_name || ' ' || mgr.last_name AS manager_name,
      mgr.role AS manager_role,
      mgr.email AS manager_email
    FROM people p
    LEFT JOIN markets m  ON m.id  = p.market_id
    LEFT JOIN combs   c  ON c.id  = p.comb_id
    LEFT JOIN people mgr ON mgr.id = p.manager_id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!person) return res.status(404).json({ error: 'Not found' });

  // network connection (if any, from current user's perspective)
  person.connection = db.prepare(`
    SELECT nc.relationship, nc.how_we_met, nc.notes, nc.needs_followup
    FROM network_connections nc WHERE nc.person_id = ?
  `).get(person.id) || null;

  res.json(person);
});

// GET /api/people/:id/reports — direct reports
router.get('/:id/reports', (req, res) => {
  const db = getDb();
  const reports = db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.initials, p.role, p.role_type, p.color
    FROM people p WHERE p.manager_id = ?
    ORDER BY p.role_type, p.last_name
  `).all(req.params.id);
  res.json(reports);
});

module.exports = router;
