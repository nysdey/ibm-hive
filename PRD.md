# IBM Hive — Product Requirements Document (v2)

> Supersedes the original PRD. Rewritten after the first build cycle (Job View, Connections, Accounts) to reflect what actually shipped, what we learned, and what "ideal" now looks like with real design decisions locked in.

## Executive Summary

IBM Hive is a visual organizational intelligence platform that helps IBMers understand where they fit in the company, discover who does what, manage professional relationships, and organize account information through a hive-based visualization system — every person is a **bee**, every hex you see on screen represents someone or something in the org.

The product reduces cognitive overload by transforming org structure, account portfolios, and networking into a single dark, high-contrast, hexagon-first interface instead of scattered spreadsheets, CRM tabs, and org-chart PDFs.

## One-Sentence Pitch

IBM Hive turns IBM's people, teams, accounts, and resources into an interactive hive — every bee a hexagon, every relationship a connection you own, every account a cell you manage.

---

## Vision & Mission

**Mission** — help every IBMer understand:
- Where they fit in the organization (Job View)
- Who to contact for any need and how that relationship started (Connections)
- What accounts they own and how healthy each one is (Accounts)
- How the roles around them complement their own (role taxonomy)

**Vision statement** — a navigable, living hive where every employee visualizes people, teams, accounts, and relationships in one unified, unmistakably-IBM interface.

---

## Problem Statement

Unchanged from v1 — still the core motivation:

1. **Organizational visibility** — unclear what other roles do, how teams interact, who owns what.
2. **Relationship management** — people forget who they met, lose deal context, can't track advocates.
3. **Account management** — sellers juggle dozens of accounts with no visual prioritization.
4. **Resource fragmentation** — Slack, Teams, Outlook, SharePoint, SalesLoft, ISC, no single hub.

---

## Target Users & View Architecture

The product is three views, one per audience. **Only the Seller view is built today.** Manager and Exec reuse the same data model and visual system — they are new lenses on the same hive, not new products.

| View | Audience | Status |
|---|---|---|
| **Seller View** | Brand Technical Sales Specialists, AEs, Client Engineering, Technical Specialists | ✅ Shipped |
| **Manager View** | Frontline/2nd-line managers — team visibility, org understanding, relationship mapping across their reports | 🔜 Next |
| **Exec View** | VPs and above — org health, geographic coverage, reporting hierarchy at scale | ⏸ Parked (code exists, unwired, from v1 prototype) |

New hires and executives consume Manager/Exec views rather than getting a bespoke fourth view — a new hire is just a Seller with an empty Connections list and a short tenure, which the design should surface (e.g. an onboarding nudge), not a separate product surface.

---

## Hive Information Architecture

| Term | Meaning |
|---|---|
| **Hive** | IBM — the entire organization |
| **Comb** | A market or business-unit grouping (Enterprise, Strategic, Horizon, Territory) |
| **Cell** | One team — a manager and their direct reports |
| **Bee** | One employee. One bee = one person, always. A cell contains many bees. |
| **Swarm** | A temporary working group (deal pursuit, tiger team) — not yet modeled |
| **Nectar** | Knowledge, resources, documentation, expertise — not yet modeled (see Resource Hive) |

This settles the ambiguity the original PRD flagged ("updated recommendation: one bee = one employee") — it's no longer a recommendation, it's the shipped data model (`people` table, one row per person, `manager_id` self-reference for hierarchy).

---

## Design System

This is new to v2 — the original PRD had no visual spec. These rules are now non-negotiable across every view:

- **Dark by default.** Near-black background (`#0a0a0c`), neutral charcoal card surfaces (`#18181b`/`#232326`) — no light theme, no toggle, until explicitly requested.
- **Blue → purple accent spectrum only.** No red/green/orange/yellow anywhere, including "danger" states. Risk/urgency is communicated by *position on the blue→magenta spectrum* (magenta = most urgent), not by hue family. Every color-coding system (role type, account stage, market) is a 4–6 stop gradient within this spectrum.
- **Every person and every hex-tile is a hexagon with a thin white (~90% opacity) stroke.** This includes avatars — topnav, org cards, connection cards, detail panel — not just the big team-cell tiles. Circles are not used for people anywhere in the product.
- **Role taxonomy markers.** Where roles are grouped (Job View → My Cell), each hex additionally carries a small corner glyph: circle = Sales roles, diamond = Technical roles, triangle = Ecosystem/support roles. A legend with italic labels accompanies any view that uses these.
- **Footer attribution is permanent chrome**, not a feature — every full-page shell carries a footer identifying who built it and why (currently: *Built by Sydney Chin for Intern Bobathon 2026*). Treat this as boilerplate to update per deployment/owner, not content to remove.
- **Logo is swappable, never hardcoded art.** The topnav brand mark is an `<img>` pointing at a real asset path with a graceful CSS-gradient hex fallback when that asset is missing — so design can drop in real branding without touching markup.

---

## Core Product Features

### 1. Job View *(shipped)*
Replaces the original "Executive Hive View" and "Management Hierarchy View" for the Seller audience — combined into one tab set:
- **Management Hierarchy** — chain from VP down to you, your manager highlighted once (not duplicated), peer row alongside you.
- **My Cell** — your immediate working team as a hex grid, each hex tagged with a role-category glyph, legend explaining the taxonomy.

Manager View's version of Job View should add: team-wide hierarchy (not just your own chain), and the ability to see *your reports'* cells, not just your own.

### 2. Connections *(shipped, full CRUD)*
Personal CRM for internal relationships — replaces "Personal Hive Network." For each connection: relationship type (close ally / partner / cross-brand / client / peer), how-we-met, free-text notes, needs-follow-up flag.
- **Create** — add-connection modal, person picker auto-excludes yourself and existing connections.
- **Edit** — same modal, pre-filled, person field locked (you can't reassign a connection to someone else).
- **Delete** — icon on card or inside edit modal, confirm-gated.

This CRUD pattern (modal add/edit, icon-button edit/delete on cards, confirm-gated destructive actions) is the reference implementation every other entity should follow.

### 3. Accounts *(read-only today — highest-priority gap)*
Visual account portfolio as a hex honeycomb, color-coded by pipeline stage across the blue→magenta spectrum, filterable by stage, with per-account stats (closed won / active pipeline / at risk totals).

**Not yet at parity with Connections.** Backend supports create/update; there is no delete route and no create/edit modal in the UI. Bringing Accounts to full CRUD — including managing the collaborator list (who else at IBM is working the account) — is the next milestone.

### 4. Detail Panel *(shipped, shared across views)*
Slide-over panel for any person or account: contact info, relationship tags, notes feed with inline add. One component, reused by Job View, Connections, and Accounts — new views should extend this panel rather than building a bespoke one.

### 5. Manager View *(not started)*
Everything in Seller's Job View, scoped to a manager's full org rather than one chain — team roster, aggregate account health across reports, relationship coverage gaps ("who on your team has no connections in Strategic accounts").

### 6. Exec View *(parked)*
Full org broken out by market segment, every bee visible, sortable, searchable. Prototype exists from v1 (`exec.js`, unwired) — revive rather than rebuild when this view is prioritized.

### 7. Resource Hive *(not started)*
Centralized bookmark system — Sales Plays, Battlecards, Product Docs, Enablement, internal sites — categorized (Sales / Technical / Enablement / Operations / Personal). This is the one MVP-listed v1 feature with zero implementation so far.

### 8. Global Search & Filtering *(not started)*
Today, search is siloed per view (Connections has its own search box, Exec had its own). v2 ideal: one topnav search across people, accounts, and connections at once, plus a global filter bar (location, product, role, industry) that persists across view switches.

---

## Data & CRUD Principles

Learned the hard way building Connections vs. Accounts — codify it going forward:

1. **If a user can own it, a user can create/edit/delete it.** Read-only views on user-owned data (accounts, connections, notes) are a temporary state, not a design choice.
2. **Every entity needs a DELETE route from day one**, even if the UI ships read-only first — retrofitting deletion is what's currently blocking Accounts.
3. **Destructive actions are always confirm-gated**, never a single click.
4. **One modal pattern for the whole app** — add/edit share a component, edit pre-fills and locks fields that can't change (e.g. the person on a connection), create starts blank.

---

## User Stories

- *New hire*: "I want to see my management chain and my cell on day one so I understand who's around me." — served by Job View.
- *Seller*: "I want to visualize all my accounts in one place so I can prioritize my pipeline." — served by Accounts (pending CRUD parity).
- *Seller*: "I want to remember why I know someone and what to follow up on." — served by Connections.
- *Manager*: "I want to see how my team fits into the broader org so I can onboard people faster." — Manager View, not yet built.
- *Exec*: "I want org health and geographic coverage at a glance." — Exec View, parked.

---

## Future Integrations *(unchanged from v1, still explicitly out of scope)*

Microsoft Graph (Outlook/Teams/Copilot), Salesforce/SalesLoft, ISC, Slack, LinkedIn. None of these are wired; the data model (people, accounts, connections, notes) is designed to accept synced fields later without a schema rewrite.

## AI Features *(unchanged from v1, still explicitly out of scope)*

Bee Brief (AI profile summaries), Relationship Intelligence (staleness nudges), Hive Recommendations. Revisit only after Resource Hive and global search ship — those are the more valuable near-term bets.

---

## Success Metrics

Unchanged in spirit from v1, refined to be measurable against what's actually shipped:
- **Adoption** — MAU/DAU, onboarding completion (does a new hire open Job View in week 1?).
- **Network growth** — connections created per user, notes added per week.
- **Account hygiene** — % of accounts with a note in the last 30 days, once Accounts CRUD ships.
- **Time-to-expert** — self-reported reduction in time to find the right internal contact.

---

## Scope Snapshot

**Shipped**
- ✅ Job View (management hierarchy + my cell, role taxonomy)
- ✅ Connections (full CRUD)
- ✅ Accounts (visualization, read-only)
- ✅ Shared detail panel with notes
- ✅ Dark hex design system, footer, swappable logo

**Next (near-term ideal)**
- 🔜 Accounts full CRUD (add DELETE route, create/edit modal, collaborator management)
- 🔜 Global search + persistent filter bar
- 🔜 Manager View

**Later**
- ⏸ Exec View (revive parked prototype)
- ⏸ Resource Hive (bookmarks)
- ⏸ Swarms (temporary working groups)
- ⏸ Nectar (knowledge/expertise layer)

**Explicitly excluded**
- ❌ AI summaries / recommendations
- ❌ Teams, Outlook, LinkedIn, SalesLoft integrations
- ❌ Light theme
