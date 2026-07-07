# IBM Hive

> Visualize everything — intuitive org structure, relationship tracking, and account management for IBM sellers.

## Concept

Everyone is a **bee** in the hive. The org maps to a honeycomb:

| Term | Meaning |
|------|---------|
| **Hive** | IBM — the entire organization |
| **Comb** | Portfolio pillar, division, or business unit |
| **Cell** | An individual team — one bee per cell |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js ≥ 18 |
| Backend | Express 4 |
| Database | SQLite via `better-sqlite3` |
| Frontend | Vanilla HTML / CSS / ES Modules |

---

## Project Structure

```
ibm-hive/
│
├── frontend/                   # Frontend — served as static files by Express
│   ├── index.html              # SPA shell (nav, sidebar, slide-over panel)
│   ├── css/
│   │   └── hive.css            # Design system & component styles
│   └── js/
│       ├── app.js              # Boot, navigation, lazy view rendering
│       ├── api.js              # Fetch wrappers for every API endpoint
│       ├── panel.js            # Slide-over detail panel (people + accounts)
│       └── views/
│           ├── seller.js       # Hierarchy + My Cell tabs
│           ├── network.js      # My Network (connections, search, filter)
│           ├── accounts.js     # Account Hive (honeycomb, stage filter)
│           └── exec.js         # Exec View (full org by market)
│
├── backend/                    # Backend — Express API server
│   ├── index.js                # App entry point, middleware, route mounting
│   ├── db.js                   # SQLite connection singleton
│   └── routes/
│       ├── people.js           # /api/people
│       ├── markets.js          # /api/markets
│       ├── combs.js            # /api/combs
│       ├── network.js          # /api/network
│       ├── accounts.js         # /api/accounts
│       └── notes.js            # /api/notes
│
├── db/                         # Database layer
│   ├── schema.sql              # DDL — tables, constraints, indexes
│   ├── seed.js                 # Idempotent seed script
│   └── hive.db                 # SQLite file (git-ignored, created by seed)
│
├── docs/
│   └── prototype.html          # Standalone demo — no server required
│
├── package.json
└── README.md
```

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

> **No server?** Open `docs/prototype.html` directly in a browser for a fully interactive demo with hardcoded sample data.

---

## API Reference

### People

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/people` | List all people. Filter: `?market=Enterprise` `?role_type=ae` `?search=jordan` |
| `GET` | `/api/people/:id` | Single person with manager info and network connection |
| `GET` | `/api/people/:id/reports` | Direct reports for a given person |

### Markets & Combs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/markets` | All markets with headcounts |
| `GET` | `/api/combs` | All combs (business units). Filter: `?market=Enterprise` |

### Network

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/network` | Current user's connections. Filter: `?relationship=close_ally` |
| `POST` | `/api/network` | Add a connection `{ person_id, relationship, how_we_met, notes }` |
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
markets          — Enterprise / Strategic / Horizon / Territory
combs            — Portfolio pillars; belong to a market
people           — Every person (bee) in the org; self-referencing manager_id
network_connections — Current user's personal connections with relationship metadata
accounts         — Sales accounts with stage, value, owner
account_collaborators — Many-to-many: people involved on an account
notes            — Free-text notes on any person or account
```

See [`db/schema.sql`](db/schema.sql) for the full DDL.

---

## Views

### Seller (My Hive)
- **Management Hierarchy** — chain from VP down to your peers; click any card for the detail panel
- **My Cell** — honeycomb of your day-to-day team

### My Network
- Personal connections with relationship type, how-we-met context, and open notes
- Add / edit / delete connections via modal; flag for follow-up

### Account Hive
- All your accounts as a color-coded honeycomb
- Filter by pipeline stage (Closed Won / Negotiation / Proposal / At Risk / Prospect)
- Click any cell for deal details, collaborators, and notes

### Exec View
- Every person in the org rendered as hexagonal cells, grouped by market
- Live search and market filter
