# IBM Hive

> Visualize everything — intuitive org structure, relationship tracking, and account management for IBM sellers.

## Concept

Everyone is a **bee** in the hive. The org maps to a honeycomb:

| Term | Meaning |
|------|---------|
| **Hive** | IBM — the entire organization |
| **Comb** | Portfolio pillar, division, or business unit |
| **Cell** | An individual team — one bee per cell |

## Views

### Seller Views
- **Hive View → Management Hierarchy** — where your role fits in the larger org (VP → Director → Manager → You → Peers)
- **Hive View → My Cell** — honeycomb of your day-to-day team
- **My Network** — personal connections with relationship context and open notes
- **Account Hive** — all your accounts as a color-coded honeycomb, filtered by pipeline stage

### Exec View
- Full org broken out by market segment (Enterprise / Strategic / Horizon / Territory)
- Every bee visible, sortable, searchable

## Stack

- **Frontend** — Vanilla HTML/CSS/JS (`public/`)
- **Backend** — Node.js + Express (`server/`)
- **Database** — SQLite via `better-sqlite3` (`db/`)

## Project Structure

```
ibm-hive/
├── public/
│   ├── index.html          # App shell
│   ├── css/
│   │   └── hive.css        # All styles
│   └── js/
│       ├── app.js          # Boot + navigation
│       ├── views/
│       │   ├── seller.js   # Hierarchy + Cell views
│       │   ├── network.js  # My Network view
│       │   ├── accounts.js # Account Hive view
│       │   └── exec.js     # Exec Hive view
│       ├── panel.js        # Detail slide-over panel
│       └── api.js          # Fetch wrappers for all API calls
├── server/
│   ├── index.js            # Express entry point
│   ├── db.js               # SQLite connection singleton
│   └── routes/
│       ├── people.js       # GET /api/people, /api/people/:id, /api/people/:id/reports
│       ├── accounts.js     # GET/POST/PATCH /api/accounts
│       ├── network.js      # GET/POST/PATCH /api/network
│       ├── markets.js      # GET /api/markets
│       └── notes.js        # GET/POST /api/notes
├── db/
│   ├── schema.sql          # Full schema
│   ├── seed.js             # Seed script (runs schema + inserts)
│   └── hive.db             # SQLite file (git-ignored, created by seed)
├── index.html              # Standalone prototype (no server required)
├── package.json
└── README.md
```

## Setup

```bash
# Install dependencies
npm install

# Create and seed the database
npm run seed

# Start the server (http://localhost:3000)
npm start

# Development with auto-reload
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/people` | All people (filterable by `?market=`, `?role_type=`) |
| GET | `/api/people/:id` | Single person with full details |
| GET | `/api/people/:id/reports` | Direct reports for a person |
| GET | `/api/markets` | All markets with headcounts |
| GET | `/api/network` | Current user's network connections |
| POST | `/api/network` | Add a connection |
| PATCH | `/api/network/:id` | Update notes / relationship |
| GET | `/api/accounts` | All accounts (filterable by `?stage=`, `?owner=`) |
| POST | `/api/accounts` | Create an account |
| PATCH | `/api/accounts/:id` | Update an account |
| GET | `/api/notes?entity_type=&entity_id=` | Notes for a person or account |
| POST | `/api/notes` | Add a note |

## Open Prototype

[`index.html`](./index.html) works standalone — no server needed. Open directly in a browser for a fully interactive demo with hardcoded sample data.
