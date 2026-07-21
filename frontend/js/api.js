/**
 * api.js — thin fetch wrappers for all IBM Hive API calls
 */

const BASE = '/api';

// ── Auth token ──────────────────────────────────────────────────
const TOKEN_KEY = 'ibm_hive_token';

export function getToken()      { return localStorage.getItem(TOKEN_KEY); }
export function setToken(token) { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); }
export function clearToken()    { localStorage.removeItem(TOKEN_KEY); }

function authHeaders(extra = {}) {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/** Throw an Error carrying the server's JSON `error` message and status. */
async function toError(res, method, path) {
  let msg = `${method} ${path} → ${res.status}`;
  try {
    const body = await res.json();
    if (body && body.error) msg = body.error;
  } catch { /* non-JSON body */ }
  const err = new Error(msg);
  err.status = res.status;
  return err;
}

async function get(path) {
  const res = await fetch(BASE + path, { headers: authHeaders() });
  if (!res.ok) throw await toError(res, 'GET', path);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res, 'POST', path);
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res, 'PATCH', path);
  return res.json();
}

async function put(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toError(res, 'PUT', path);
  return res.json();
}

async function del(path) {
  const res = await fetch(BASE + path, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw await toError(res, 'DELETE', path);
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
export const deleteConnection = (id)          => del(`/network/${id}`);

// ── Accounts ────────────────────────────────────────────────────
export const getAccounts  = (params = {}) => get('/accounts?' + new URLSearchParams(params));
export const getAccount   = (id)          => get(`/accounts/${id}`);
export const createAccount= (body)        => post('/accounts', body);
export const updateAccount= (id, body)    => patch(`/accounts/${id}`, body);

// ── Notes ───────────────────────────────────────────────────────
export const getNotes  = (entity_type, entity_id) => get(`/notes?entity_type=${entity_type}&entity_id=${entity_id}`);
export const addNote   = (body)                    => post('/notes', body);

// ── Auth ────────────────────────────────────────────────────────
export const register = (body) => post('/auth/register', body);
export const login    = (body) => post('/auth/login', body);
export const logout   = ()     => post('/auth/logout', {});
export const getMe    = ()     => get('/auth/me');

// ── Hive state (per-user "My Combs" data) ───────────────────────
export const getHive  = ()     => get('/hive');
export const saveHive = (data) => put('/hive', { data });

// ── Generic per-user key-value store (per-view saved state) ─────
export const getStore  = (key)       => get(`/store/${key}`);
export const saveStore = (key, data) => put(`/store/${key}`, { data });
