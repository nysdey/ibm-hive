'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/markets
router.get('/', (_req, res) => {
  const db = getDb();
  const markets = db.prepare('SELECT * FROM markets ORDER BY id').all();

  // Attach top-level people counts per market
  markets.forEach(m => {
    m.people_count = db.prepare(
      'SELECT COUNT(*) as c FROM people WHERE market_id = ?'
    ).get(m.id).c;
  });

  res.json(markets);
});

module.exports = router;
