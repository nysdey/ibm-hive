# IBM Hive

> Visualize everything — org structure, personal relationships, accounts, and onboarding resources for IBM sellers, in one dark, hexagon-first interface.

## Concept

Everyone is a **bee** in the hive. The org maps to a honeycomb:

| Term | Meaning |
|------|---------|
| **Hive** | IBM — the entire organization |
| **Colony** | A business-unit grouping (Data & AI, Automation, Sustainability, Security, Infrastructure, Hybrid Cloud). Stored in the database as `combs` — the table/route name predates the "Colony" product label, so don't be surprised to see both. |
| **Cell** | Your immediate team — manager, peers, and technical counterparts |
| **Bee** | One person. One row in `people`, always. |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Backend | Express 4 |
| Database | SQLite via `better-sqlite3` |
| Frontend | Vanilla HTML / CSS / ES Modules — no build step |

---

## Project Structure

```
ibm-hive/
│
├── frontend/                   # Served as static files by Express
│   ├── index.html              # SPA shell — topnav, profile switcher, sidebar, slide-over panel, connection modal
│   ├── img/logo.svg
│   ├── css/
│   │   └── hive.css            # Design system & component styles (dark, blue→purple only)
│   └── js/
│       ├── app.js              # Boot, topnav routing, per-view sidebar, profile switcher
│       ├── api.js              # Fetch wrappers for every API endpoint
│       ├── panel.js            # Slide-over detail panel (people + accounts)
│       └── views/
│           ├── org.js          # Organization — pan/zoomable hex hive of the whole company
│           ├── seller.js       # Cell — your team structure + your connections, tabbed
│           ├── network.js      # People — connections CRM (create/edit/delete)
│           ├── accounts.js     # Accounts — honeycomb, color-coded by pipeline stage
│           ├── resources.js    # Resources — onboarding runbook (tools, plays, motions, GTM, role guide)
│           └── exec.js         # Not wired into the current nav — kept from an earlier iteration
│
├── backend/                    # Express API server
│   ├── index.js                # App entry point, middleware, route mounting, serves frontend/
│   ├── db.js                   # SQLite connection singleton
│   └── routes/
│       ├── people.js           # /api/people
│       ├── markets.js          # /api/markets
│       ├── combs.js            # /api/combs (Colonies)
│       ├── network.js          # /api/network — full CRUD
│       ├── accounts.js         # /api/accounts — read + create/update, no delete yet
│       └── notes.js            # /api/notes
│
├── db/
│   ├── schema.sql              # DDL — tables, constraints, indexes
│   ├── seed.js                 # Idempotent seed script — wipes and rebuilds db/hive.db
│   └── hive.db*                # SQLite file + WAL — git-ignored, created by `npm run seed`
│
├── docs/
│   └── prototype.html          # Standalone demo — no server required, hardcoded sample data
│
├── package.json
└── README.md
```

`node_modules/` and the `db/hive.db*` files are git-ignored — both are fully reproducible (`npm install`, `npm run seed`), so there's no reason to commit them.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create and seed the database
npm run seed

# 3. Start the server
npm start
# → http://localhost:3000

# Development (auto-reload)
npm run dev
```

> **No server?** Open `docs/prototype.html` directly in a browser for a fully interactive demo with hardcoded sample data — no install, no seed.

---

## Views

### Organization
A pan/zoomable hex map of the whole hive — canvas background tiled with a dense hexagon texture, an SVG overlay for real people. Zoom in to read names; zoom out to see colony labels. Click any real person's hex, or a colony label, to open a detail modal. Filterable from the sidebar by colony, job role, or market.

> The background hex count (`VIRTUAL_N` in `org.js`) is intentionally tuned low (80 rings ≈ 19,441 cells) rather than literal ("270,000 bees · 6 colonies" is flavor text for IBM's real headcount). A previous version set this to 300 rings (~271K cells) and drew all of them synchronously on load — that froze the tab for tens of seconds. If you're tempted to raise this constant for a denser look, profile it first.

### Cell (My Team)
Your actual team, as tabs:
- **List / Hive / Pairings** — your manager, technical/territory counterparts, and peers, plus BTSS↔TSS pairings.
- **Territory Coverage** — an interactive US map in the isometric IBM style: every state is a real geographic shape lifted off a dark board and coloured by the rep who owns it. Switch between coverage **views** (manager / market / product slices — Rob Mason, Aaron Carman, Chris Kennedy, Cale Webster, Industrial, Storage, Power/Cloud), spotlight a rep from the legend, and toggle **Edit** to re-assign states/territories. Each view saves independently, per-user (`/api/store/territory_coverage_v1`). State shapes are pre-projected (Albers USA) in [`frontend/js/views/us-geo.js`](frontend/js/views/us-geo.js); seed coverage lives in [`territory-data.js`](frontend/js/views/territory-data.js).

### People
Your personal connections CRM, full CRUD:
- **Create** — "+ Add Connection", person picker excludes yourself and existing connections.
- **Edit** — pencil icon on any card, opens the same modal pre-filled.
- **Delete** — trash icon on any card, or the Delete button in edit mode. Both confirm-gated.
- Search and filter by relationship type; stats row for total connections, close allies, cross-brand, and follow-ups needed.

### Accounts
All your accounts as a color-coded honeycomb (blue → magenta spectrum: Closed Won → Negotiation → Proposal → At Risk → Prospect), filterable by stage, with pipeline totals up top. Click a cell for the detail panel (collaborators, notes). Read-only today — the backend supports create/update but not delete, and there's no add/edit UI yet.

### Resources
An onboarding runbook, not a stub: quick start, go-to tools (Salesforce, SalesLoft, Seismic, TechZone, etc.), focus products, sales plays, core motions, GTM workflow, operating rhythm, a role guide (BTSS vs BSS vs BTS vs TSS), and team structure. Filterable from the sidebar.

### Accounts & sign-in
The app is gated behind a login screen. Create an account (username + password) or sign in; the topnav user menu shows who you're signed in as and offers **Log out**. Passwords are hashed with scrypt (Node's built-in `crypto`) — no plaintext, no external auth dependency.

Each account gets its own **My Combs** graph, persisted server-side (SQLite `hive_state`) so it follows you across devices and reloads. A localStorage cache gives instant loads; any legacy anonymous `ibm_hive_combs_v1` data in the browser is migrated up to your account on first sign-in.

---

## API Reference

### Auth & persistence

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create an account `{ username, password, display_name? }` → `{ token, user }` |
| `POST` | `/api/auth/login` | Sign in `{ username, password }` → `{ token, user }` |
| `POST` | `/api/auth/logout` | Invalidate the current session (Bearer token) |
| `GET`  | `/api/auth/me` | Current user for the Bearer token |
| `GET`  | `/api/hive` | This user's My Combs graph → `{ data, updated_at }` |
| `PUT`  | `/api/hive` | Replace this user's My Combs graph `{ data }` |
| `GET`  | `/api/store/:key` | Generic per-user JSON store (e.g. Territory Coverage) → `{ data, updated_at }` |
| `PUT`  | `/api/store/:key` | Replace a per-user JSON blob `{ data }` |

Send the token from register/login as `Authorization: Bearer <token>` on every authed request.

### People

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/people` | List all people. Filter: `?market=Enterprise` `?role_type=bss` `?search=chin` |
| `GET` | `/api/people/:id` | Single person with manager info and network connection |
| `GET` | `/api/people/:id/reports` | Direct reports for a given person |

### Markets & Colonies

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/markets` | All markets with headcounts |
| `GET` | `/api/combs` | All colonies (business units). Filter: `?market=Enterprise` |

### Network (Connections)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/network` | Current user's connections. Filter: `?relationship=close_ally` |
| `POST` | `/api/network` | Add a connection `{ person_id, relationship, how_we_met, notes, needs_followup }` |
| `PATCH` | `/api/network/:id` | Update relationship, notes, or needs_followup flag |
| `DELETE` | `/api/network/:id` | Remove a connection |

### Accounts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/accounts` | List accounts. Filter: `?stage=Negotiation` `?owner=<id>` `?search=jpmorgan` |
| `GET` | `/api/accounts/:id` | Single account with collaborators and notes |
| `POST` | `/api/accounts` | Create an account `{ name, industry, stage, value_usd, ... }` |
| `PATCH` | `/api/accounts/:id` | Update any account field |

### Notes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notes` | Notes for an entity. Params: `?entity_type=account&entity_id=3` |
| `POST` | `/api/notes` | Add a note `{ entity_type, entity_id, body }` |
| `DELETE` | `/api/notes/:id` | Delete a note |

---

## Database Schema

Six core tables:

```
markets              — Enterprise / Strategic / Horizon / Territory
combs                — Colonies; belong to a market
people               — Every person (bee) in the org; self-referencing manager_id
network_connections  — Current user's personal connections with relationship metadata
accounts             — Sales accounts with stage, value, owner
account_collaborators — Many-to-many: people involved on an account
notes                — Free-text notes on any person or account
users                — Login accounts (scrypt-hashed passwords)
sessions             — Bearer tokens issued at login
hive_state           — Per-user "My Combs" graph, one JSON blob per user
user_kv              — Generic per-user JSON store, keyed by string (e.g. Territory Coverage)
```

`people.role_type` allows: `exec`, `director`, `manager`, `bss`, `bts`, `tse`, `csm`, `sdr`, `partner`, `intern`, `other`.

See [`db/schema.sql`](db/schema.sql) for the full DDL.

---

## Design system

- Dark by default, near-black background with neutral charcoal cards — no light theme.
- Accent palette is blue → purple only; no red/green/orange anywhere, including "at risk" states (those live at the magenta end of the spectrum instead).
- Every person is a hexagon, not a circle — avatars, team cells, and the Organization hex map all share the same hex-with-thin-white-stroke motif.

---

## Deployment & Handoff

### 1. Enable real authentication (one line)

The entire auth system is built and working — it's just switched off. The app currently calls `bootGuest()` at the bottom of [`frontend/js/app.js`](frontend/js/app.js), which skips the login screen and hardcodes the user as Sydney Chin. To turn real accounts on:

```js
// frontend/js/app.js — last line, replace:
bootGuest();
// with:
startAuth();
```

That's the only code change needed. The login/register overlay, token storage, per-user data sync, and logout are all fully wired.

### 2. Make the database path configurable

`better-sqlite3` writes to a local file. Platforms that use persistent volumes (Render, Fly.io) need the path pointed at the mounted disk. In [`backend/db.js`](backend/db.js), change the path line to:

```js
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'db', 'hive.db');
```

Then set the `DB_PATH` environment variable on the platform (e.g. `DB_PATH=/data/hive.db`).

### 3. Add session expiry (recommended before real users)

Sessions currently live forever. In [`backend/routes/auth.js`](backend/routes/auth.js) inside `requireAuth`, add a time bound to the query:

```js
WHERE s.token = ? AND s.created_at > datetime('now', '-30 days')
```

### 4. Choose a hosting platform

SQLite needs a filesystem that persists across restarts — avoid platforms with ephemeral disks (Heroku free tier, Vercel, Netlify). Good options:

| Platform | How |
|---|---|
| **Railway** | Connect GitHub repo → set start command to `npm start` → deploy. Volumes persist by default. |
| **Render** | Create a Web Service → add a Disk mounted at `/data` → set `DB_PATH=/data/hive.db` env var. |
| **Fly.io** | `fly launch` → `fly volumes create hive_data` → mount at `/data` in `fly.toml`. |
| **VPS (DigitalOcean, Linode, etc.)** | `git clone` → `npm install` → `npm run seed` → `npm start` behind nginx + pm2. Most control, most setup. |

### 5. First-deploy checklist

```bash
# On the server / in the platform's build step — run once:
npm install
npm run seed   # creates db/hive.db (or $DB_PATH) with schema + demo data

# Start:
npm start      # listens on $PORT or 3000
```

After that, every user who registers gets their own isolated row in `users`, `hive_state`, and `user_kv`. No further setup is needed per user.

### 6. Seed data note

`npm run seed` wipes and rebuilds the database from scratch each time. Run it only once on first deploy. For subsequent deploys, the schema is also applied lazily in [`backend/db.js`](backend/db.js) via `ensureAuthTables()`, so new auth tables are created automatically on startup even on an existing database — you do not need to re-seed to pick up schema additions.

---

## Known gaps

- Accounts has no delete route and no create/edit UI (Connections does — see People view for the reference CRUD pattern).
- The topnav search box (`#globalSearch`) is present in the markup but not wired to real filtering yet.
- `frontend/js/views/exec.js` exists but isn't imported by `app.js` — parked from an earlier iteration, not part of the current nav.
