/**
 * api.js — thin fetch wrappers for all IBM Hive API calls
 */

const BASE = '/api';

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
  return res.json();
}

// ── People ──────────────────────────────────────────────────────
export const getPeople   = (params = {}) => get('/people?' + new URLSearchParams(params));
export const getPerson   = (id)          => get(`/people/${id}`);
export const getReports  = (id)          => get(`/people/${id}/reports`);

// ── Markets ─────────────────────────────────────────────────────
export const getMarkets  = ()            => get('/markets');

// ── Network ─────────────────────────────────────────────────────
export const getNetwork       = (params = {}) => get('/network?' + new URLSearchParams(params));
export const addConnection    = (body)        => post('/network', body);
export const updateConnection = (id, body)    => patch(`/network/${id}`, body);

// ── Accounts ────────────────────────────────────────────────────
export const getAccounts  = (params = {}) => get('/accounts?' + new URLSearchParams(params));
export const getAccount   = (id)          => get(`/accounts/${id}`);
export const createAccount= (body)        => post('/accounts', body);
export const updateAccount= (id, body)    => patch(`/accounts/${id}`, body);

// ── Notes ───────────────────────────────────────────────────────
export const getNotes  = (entity_type, entity_id) => get(`/notes?entity_type=${entity_type}&entity_id=${entity_id}`);
export const addNote   = (body)                    => post('/notes', body);
