'use strict';

const { Router } = require('express');
const { getDb } = require('../db');

const router = Router();

// GET /api/combs
// Optional: ?market=Enterprise
router.get('/', (req, res) => {
  const db = getDb();
  let sql = `
    SELECT c.*, m.name AS market_name, m.color AS market_color,
           COUNT(p.id) AS people_count
    FROM combs c
    LEFT JOIN markets m ON m.id = c.market_id
    LEFT JOIN people p  ON p.comb_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (req.query.market) {
    sql += ' AND m.name = ?';
    params.push(req.query.market);
  }
  sql += ' GROUP BY c.id ORDER BY c.market_id, c.name';
  res.json(db.prepare(sql).all(...params));
});

module.exports = router;
