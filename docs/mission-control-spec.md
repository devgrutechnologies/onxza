# ONXZA Mission Control — Product Specification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

Mission Control is a core ONXZA feature. Not an add-on. Ships with every installation.

---

## Architecture — Hierarchical

### Master Dashboard (Top Level)

Shows all companies this installation manages.

- **DevGru deployment:** DevGru US → Marcus Gear → all sub-companies in one view
- **ONXZA customers:** their company hierarchy
- **Consultants / MSPs:** all client companies in one pane of glass

### Company Dashboard (Per Company)

Full visibility into one company. All agents, all projects, all tickets, all metrics.

### Project Dashboard (Per Project)

All agents assigned, tasks, progress, blockers, FVP metrics.

### Remote Access (Future)

Read-only access granted per session. Session-based. Revocable instantly.

---

## Dashboard Components

### Agent Status Board
- Every agent listed with live status
- Current task, configured model, last activity
- FVP pass rate and average loop count per agent

### Ticket Queue — Visual Kanban
- Columns: Open / In-Progress / Pending-Approval / Blocked / Closed
- Filter by: company, project, agent, priority

### Vision Docs Viewer
- Read-only, immutable display
- Shows approval status for each vision document

### Shared Learnings Browser
- Searchable across all companies
- Filter by type (pattern, correction, escalation, etc.)

### Skill Library Manager
- View all installed skills with version history
- Install from marketplace
- Submit skills for publication

### Script Library
- Tier classification (Tier 1 / 2 / 3)
- Run history and success rate per script

### Model Usage and Cost Tracker
- Usage breakdown per agent, company, and day
- Router suggestion vs. actual model used
- FVP outcome by model
- Cost per task type

### FVP Loop Tracker
- Tasks broken down by loop count
- Which agents loop most frequently
- Trending over time

### Real-Time Log Viewer
- Live feed of all agent activity
- Filterable and searchable history

### Company and Project Switcher
- One-click switching between companies and projects
- Breadcrumb navigation throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Data layer | Local API reads `~/.openclaw/` directly |
| Database | None — files ARE the database |
| Real-time updates | File system watching |
| Connectivity | Local-first, works offline |
| Remote access | Optional ONXZA cloud sync |
