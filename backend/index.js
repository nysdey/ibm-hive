'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/hive',     require('./routes/hive'));
app.use('/api/store',    require('./routes/store'));
app.use('/api/people',   require('./routes/people'));
app.use('/api/markets',  require('./routes/markets'));
app.use('/api/network',  require('./routes/network'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/notes',    require('./routes/notes'));
app.use('/api/combs',    require('./routes/combs'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// SPA fallback — serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`IBM Hive running at http://localhost:${PORT}`);
});
