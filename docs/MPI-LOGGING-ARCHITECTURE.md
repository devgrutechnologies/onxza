---
title: "MPI Logging Architecture — Data Collection Specification"
version: 1.0.0
owner: DTP_ONXZA_Architect
created: 2026-03-19
status: APPROVED
tags: mpi, logging, architecture, data-collection, model-performance, onxza
summary: Complete specification for MPI data collection — logging hook system, data schema, storage architecture, CLI commands, dashboard integration, and implementation roadmap. Build-ready for Backend and CLI agents.
credit_line: present
---

# MPI Logging Architecture — Data Collection Specification

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0 | **Owner:** DTP_ONXZA_Architect | **Date:** 2026-03-19
**Status:** APPROVED — Backend and CLI agents build from this document.

---

## 1. Purpose

This document specifies how ONXZA collects, stores, and surfaces Model Performance Index (MPI) data. MPI is the system that tracks real-world model performance across autonomous agent tasks — which models succeed at which task types, how many FVP loops they need, how long they take, and what they cost.

**Audience:** DTP_ONXZA_Backend, DTP_ONXZA_CLI, DTP_ONXZA_ModelIndex, DTP_ONXZA_QA.

**Parent references:**
- `projects/onxza/faails/MPI-001.md` — what MPI measures and why
- `projects/onxza/faails/ROUTING-001.md` — routing decision log fields
- `projects/onxza/faails/FVP-001.md` — verification protocol that generates outcomes
- `projects/onxza/docs/ARCHITECTURE-v0.1.md` — v0.1 scope and constraints

---

## 2. Logging Hook Design

### 2.1 Trigger Point

MPI data is logged at **ticket close** — the moment an agent moves a ticket from any active status to `tickets/closed/`. This is the single trigger. No other event fires an MPI log.

**Why ticket close:** This is the only point where all outcome data is available — the task is complete, the FVP result is known, the loop count is final, and the elapsed time can be calculated from `created_at` to close timestamp.

### 2.2 Data Flow

```
Agent completes task
  → Agent writes completion note to ticket
  → Agent moves ticket to tickets/closed/
  → Ticket close hook fires (in @onxza/core)
  → Hook reads ticket frontmatter + completion note
  → Hook constructs MPI log entry
  → Hook appends entry to MPI log file
  → Hook returns (fire-and-forget)
  → Agent continues (zero blocking)
```

### 2.3 Fire-and-Forget Semantics

The MPI logging hook:
- **MUST NOT** block the ticket close operation
- **MUST NOT** throw errors that prevent ticket closure
- **MUST** catch and silently log any write failures to `logs/mpi-errors.log`
- **MUST** complete in under 50ms (append to file — no computation)
- **MUST** be idempotent — if the same ticket is closed twice (e.g., file moved back and re-closed), the second entry is written with a `duplicate: true` flag

### 2.4 Hook Registration

In `@onxza/core`, the hook is registered in the ticket module:

```typescript
// packages/core/src/ticket/close.ts
import { logMpiEntry } from '../mpi/logger';

export async function closeTicket(ticketPath: string, closedDir: string): Promise<void> {
  // Move ticket file
  await moveTicket(ticketPath, closedDir);
  
  // Fire-and-forget MPI log (non-blocking)
  logMpiEntry(ticketPath).catch((err) => {
    appendErrorLog('mpi-errors.log', err);
  });
}
```

### 2.5 What the Hook Reads

The hook extracts data from two sources:

**Source 1: Ticket YAML frontmatter**
- `id` → ticket ID
- `type` → task type classification
- `assigned_to` → agent ID
- `company` → company slug
- `project` → project slug
- `created_at` → task start time
- `priority` → task priority

**Source 2: Ticket body (completion note)**

The hook scans the completion note for structured fields. Agents write these in their completion notes using a standard format:

```markdown
## Completion Note
**Completed by:** <agent-id>
**Completed at:** <ISO-8601>
**Model used:** <model-ref>
**Router suggestion:** <model-ref or "none">
**FVP result:** pass | fail | escalated
**Confidence score:** <0-100>
**FVP loop count:** <1-3>
```

If any field is missing from the completion note, the hook writes `null` for that field. Missing fields are not errors — they reduce data quality but do not block logging.

### 2.6 Fields NOT Extracted Automatically

Two fields cannot be extracted from the ticket alone:

- **Time to complete:** Calculated as `completed_at - created_at` (both available in ticket)
- **Approximate cost:** NOT available from the ticket. This requires integration with the model provider's usage API or OpenClaw's session cost tracking. In v0.1, this field is `null` unless the agent manually includes it. In v0.5, this integrates with OpenClaw's cost tracking.

---

## 3. MPI Log Entry Schema

### 3.1 Schema Version

```
MPI Log Schema v1.0.0
```

Schema versioning follows the same SemVer rules as `openclaw.json` (see SCHEMA-VERSIONING.md).

### 3.2 Entry Structure

```json
{
  "$schemaVersion": "1.0.0",
  "entryId": "mpi-20260319-001",
  "timestamp": "2026-03-19T00:01:00.000Z",
  "ticketId": "TICKET-20260318-DTP-027",
  "taskType": "task",
  "agentId": "dtp-onxza-architect",
  "company": "DTP",
  "project": "onxza",
  "priority": "high",
  "modelUsed": "anthropic/claude-opus-4-6",
  "routerSuggestion": null,
  "fvpResult": "pass",
  "confidenceScore": 90,
  "loopCount": 1,
  "timeToCompleteMs": 3600000,
  "approximateCostUsd": null,
  "duplicate": false,
  "metadata": {}
}
```

### 3.3 Field Reference

| Field | Type | Required | Source | Description |
|---|---|---|---|---|
| `$schemaVersion` | string | yes | constant | Schema version of this entry |
| `entryId` | string | yes | generated | Unique entry ID: `mpi-YYYYMMDD-NNN` |
| `timestamp` | string (ISO 8601) | yes | system clock | When the log entry was written |
| `ticketId` | string | yes | frontmatter | Ticket ID that triggered this entry |
| `taskType` | string | yes | frontmatter | Ticket type (task, escalation, etc.) |
| `agentId` | string | yes | frontmatter | Agent that completed the task |
| `company` | string | yes | frontmatter | Company slug |
| `project` | string | yes | frontmatter | Project slug |
| `priority` | string | yes | frontmatter | Task priority |
| `modelUsed` | string \| null | no | completion note | Provider/model reference used |
| `routerSuggestion` | string \| null | no | completion note | Model the router suggested |
| `fvpResult` | string \| null | no | completion note | `pass`, `fail`, or `escalated` |
| `confidenceScore` | number \| null | no | completion note | Agent's confidence 0–100 |
| `loopCount` | number \| null | no | completion note | FVP verification loops (1–3) |
| `timeToCompleteMs` | number \| null | no | calculated | Milliseconds from created_at to completed_at |
| `approximateCostUsd` | number \| null | no | completion note | Cost in USD (v0.1: usually null) |
| `duplicate` | boolean | yes | system | True if ticket was closed previously |
| `metadata` | object | yes | extensible | Empty object for future fields |

**Total fields: 18** (12 core data fields + schemaVersion + entryId + timestamp + duplicate + metadata + project).

### 3.4 Entry ID Generation

Format: `mpi-YYYYMMDD-NNN`

`NNN` is a zero-padded 3-digit sequence, unique per day. Generated by scanning the current day's entries in the log file. If no entries exist for today, start at `001`.

### 3.5 TypeScript Interface

```typescript
interface MpiLogEntry {
  $schemaVersion: string;
  entryId: string;
  timestamp: string;
  ticketId: string;
  taskType: string;
  agentId: string;
  company: string;
  project: string;
  priority: string;
  modelUsed: string | null;
  routerSuggestion: string | null;
  fvpResult: 'pass' | 'fail' | 'escalated' | null;
  confidenceScore: number | null;
  loopCount: number | null;
  timeToCompleteMs: number | null;
  approximateCostUsd: number | null;
  duplicate: boolean;
  metadata: Record<string, unknown>;
}
```

---

## 4. Storage Architecture

### 4.1 v0.1 — Append-Only JSONL

**Choice:** JSONL (JSON Lines) — one JSON object per line, appended to a single file.

**Location:**
```
~/.openclaw/workspace/logs/mpi/mpi-data.jsonl
```

**Why JSONL:**

| Criterion | JSONL | SQLite | Supabase |
|---|---|---|---|
| Zero dependencies | ✅ | ❌ (needs better-sqlite3) | ❌ (needs network) |
| Filesystem only | ✅ | ✅ | ❌ |
| Append performance | O(1) — file append | O(log n) — index update | Network latency |
| Human readable | ✅ (one line per entry) | ❌ (binary) | ❌ (remote) |
| Git friendly | ✅ (text diff) | ❌ | ❌ |
| Query performance | O(n) — full scan | O(log n) — indexed | O(log n) — indexed |
| v0.1 constraints | ✅ zero deps, zero cloud | ❌ new dep | ❌ cloud |

**Trade-off:** JSONL queries require full file scan. At DevGru's current volume (~50 tasks/day), the file grows ~5KB/day. After a full year: ~1.8MB. Full-scan query on 1.8MB completes in under 100ms. Query performance is not a concern until thousands of tasks per day.

### 4.2 File Rotation (v0.1)

No rotation in v0.1. Single file. If the file exceeds 10MB (estimated ~3 years of operation at current volume), `onxza mpi report` prints a warning: `"MPI log file is large (>10MB). Consider running 'onxza mpi archive' (available in v0.5)."`.

### 4.3 v0.5 Migration Path — SQLite

When query performance matters (high-volume installations, complex aggregations, dashboard real-time):

```
~/.openclaw/workspace/logs/mpi/mpi-data.db
```

Migration: `onxza mpi migrate` reads `mpi-data.jsonl`, inserts all entries into SQLite with proper indexes, renames the JSONL to `mpi-data.jsonl.archived`. New entries go to SQLite.

**Indexes for v0.5:**
- `idx_mpi_agent` — agentId
- `idx_mpi_model` — modelUsed
- `idx_mpi_company` — company
- `idx_mpi_date` — timestamp (date portion)
- `idx_mpi_fvp` — fvpResult

### 4.4 Backup

MPI data is included in ONXZA checkpoints. The `create-checkpoint.py` script copies `logs/mpi/mpi-data.jsonl` into the checkpoint directory.

---

## 5. CLI Command Specification — `onxza mpi`

### 5.1 Command Tree

```
onxza mpi
├── report [options]          Generate MPI report
├── log <ticket-id>           Show MPI entry for a specific ticket
└── stats [options]           Quick summary statistics
```

**Note:** `onxza mpi` is a **v0.5 command** per ARCHITECTURE-v0.1.md (MPI automated pipeline is deferred). However, the data collection hook ships in v0.1 as part of the ticket close flow. The CLI commands are specced here for Backend/CLI agents to implement when the milestone arrives.

### 5.2 `onxza mpi report`

```bash
onxza mpi report [options]
```

| Flag | Default | Description |
|---|---|---|
| `--model <ref>` | all | Filter by model |
| `--agent <id>` | all | Filter by agent |
| `--company <slug>` | all | Filter by company |
| `--task-type <type>` | all | Filter by task type |
| `--since <date>` | 30 days ago | Start date (ISO date) |
| `--until <date>` | now | End date (ISO date) |
| `--sort <field>` | timestamp | Sort field |
| `--limit <n>` | 50 | Maximum entries |
| `--json` | false | JSON output |

**Default output:**

```
MPI Report — Last 30 days

Model                          Tasks  Pass%  Avg Loops  Avg Time    Avg Cost
─────────────────────────────  ─────  ─────  ─────────  ──────────  ────────
anthropic/claude-opus-4-6         12   92%    1.1        45m         $0.82
anthropic/claude-sonnet-4-6       87   89%    1.3        22m         $0.14
anthropic/claude-haiku-4-5        34   85%    1.5        8m          $0.02

Total: 133 tasks | Overall pass rate: 88% | Avg loops: 1.3
```

### 5.3 `onxza mpi log <ticket-id>`

Shows the raw MPI log entry for a specific ticket:

```bash
onxza mpi log TICKET-20260318-DTP-027
```

Output: Pretty-printed JSON of the log entry. Exit 1 if not found.

### 5.4 `onxza mpi stats`

Quick summary — no filters, last 7 days:

```bash
onxza mpi stats
```

```
MPI Quick Stats (last 7 days)

  Tasks completed:     47
  FVP pass rate:       89%
  Avg confidence:      84
  Avg loops:           1.3
  Top model:           anthropic/claude-sonnet-4-6 (32 tasks)
  Most loops:          anthropic/claude-haiku-4-5 (avg 1.8)
  Fastest:             anthropic/claude-haiku-4-5 (avg 6m)
  Most expensive:      anthropic/claude-opus-4-6 (avg $0.91/task)
```

With `--json`: outputs as JSON object.

---

## 6. Dashboard Integration Specification

### 6.1 Target Panel

**Mission Control → "Model Usage and Cost Tracker"** (per ARCHITECTURE.md §13.2)

### 6.2 Data Requirements

The dashboard panel needs these pre-computed aggregations:

```typescript
interface MpiDashboardData {
  // Summary row
  totalTasks: number;
  overallPassRate: number;
  overallAvgLoops: number;
  periodStart: string;
  periodEnd: string;

  // Per-model breakdown
  models: Array<{
    modelRef: string;
    taskCount: number;
    passRate: number;
    avgLoops: number;
    avgTimeMs: number;
    avgCostUsd: number | null;
    taskTypes: Record<string, number>; // task type → count
  }>;

  // Per-agent breakdown (top 10 by volume)
  topAgents: Array<{
    agentId: string;
    taskCount: number;
    passRate: number;
    primaryModel: string;
  }>;

  // Per-company breakdown
  companies: Array<{
    slug: string;
    taskCount: number;
    passRate: number;
    avgCostUsd: number | null;
  }>;

  // Trend data (daily for last 30 days)
  dailyTrend: Array<{
    date: string;
    taskCount: number;
    passRate: number;
    avgLoops: number;
  }>;
}
```

### 6.3 API Shape (v0.5 — Dashboard)

```
GET /api/mpi/dashboard?period=30d
→ Returns MpiDashboardData JSON

GET /api/mpi/entries?model=anthropic/claude-opus-4-6&since=2026-03-01&limit=50
→ Returns MpiLogEntry[] JSON

GET /api/mpi/stats
→ Returns quick stats JSON (same as onxza mpi stats --json)
```

### 6.4 Refresh Cadence

- Dashboard polls every 60 seconds for summary data
- Detail views (drill-down) fetch on demand
- No WebSocket/SSE in v0.5 — polling is sufficient for the volume

### 6.5 v0.1 Dashboard Status

Mission Control is deferred to v0.5. In v0.1, `onxza mpi stats --json` provides the same data programmatically. Any agent or script can read it.

---

## 7. Implementation Roadmap

### 7.1 v0.1 Scope (Ships Now)

| Component | Owner | What Ships |
|---|---|---|
| MPI log entry schema | @onxza/core | TypeScript interface + JSON Schema |
| Ticket close hook | @onxza/core (ticket module) | Fire-and-forget append to JSONL |
| JSONL writer | @onxza/core (mpi module) | Append entry, generate entryId, handle errors |
| Error logging | @onxza/core (mpi module) | Write failures to `logs/mpi-errors.log` |
| Completion note format | Documentation | Standard fields agents include in completion notes |
| Checkpoint integration | @onxza/core (checkpoint module) | Include `logs/mpi/` in checkpoints |

**What does NOT ship in v0.1:** CLI commands (`onxza mpi *`), dashboard API, SQLite migration, cost tracking integration.

### 7.2 v0.5 Scope

| Component | Owner | What Ships |
|---|---|---|
| `onxza mpi report` | CLI agent | Full report with filters and aggregation |
| `onxza mpi log` | CLI agent | Single-entry lookup |
| `onxza mpi stats` | CLI agent | Quick summary |
| `onxza mpi migrate` | CLI agent | JSONL → SQLite migration |
| SQLite storage | Backend agent | Indexed storage with query performance |
| Dashboard API | Backend agent | REST endpoints for Mission Control |
| Cost tracking integration | Backend agent | OpenClaw session cost → MPI entry |

### 7.3 Implementation Order for Backend Agent (v0.1)

1. Define `MpiLogEntry` TypeScript interface in `packages/core/src/mpi/types.ts`
2. Write JSON Schema for MPI entry in `packages/core/schemas/mpi-entry.schema.json`
3. Implement JSONL writer in `packages/core/src/mpi/logger.ts` — `appendEntry(entry)`, `generateEntryId()`
4. Implement ticket parser in `packages/core/src/mpi/extractor.ts` — reads frontmatter + completion note, returns partial `MpiLogEntry`
5. Wire hook into `packages/core/src/ticket/close.ts` — call extractor, call logger
6. Implement error handler — catch write failures, append to `logs/mpi-errors.log`
7. Update checkpoint module to include `logs/mpi/` directory
8. Write unit tests: entry generation, JSONL append, frontmatter extraction, completion note parsing, error handling

### 7.4 Implementation Order for CLI Agent (v0.5)

1. Implement JSONL reader in `packages/core/src/mpi/reader.ts` — stream-parse, filter, aggregate
2. Implement `onxza mpi stats` — read all entries, compute aggregations
3. Implement `onxza mpi log <ticket-id>` — filter by ticketId, pretty-print
4. Implement `onxza mpi report` — full filter/sort/format pipeline
5. Implement `onxza mpi migrate` — JSONL → SQLite with progress bar

---

## 8. Completion Note Standard

To maximize MPI data quality, all agents should include these fields in their ticket completion notes. This is a convention, not a hard requirement — missing fields result in `null` in the MPI entry, not errors.

```markdown
## Completion Note
**Completed by:** dtp-onxza-architect
**Completed at:** 2026-03-19T00:01:00-07:00
**Model used:** anthropic/claude-opus-4-6
**Router suggestion:** none
**FVP result:** pass
**Confidence score:** 90
**FVP loop count:** 1
```

The hook parses these fields using regex matching on the `**Field:**` pattern. Field names are case-insensitive. The parser is forgiving — extra whitespace, missing fields, and additional content in the completion note are all handled gracefully.

**Parser implementation:**

```typescript
const COMPLETION_PATTERNS: Record<string, RegExp> = {
  modelUsed:        /\*\*Model used:\*\*\s*(.+)/i,
  routerSuggestion: /\*\*Router suggestion:\*\*\s*(.+)/i,
  fvpResult:        /\*\*FVP result:\*\*\s*(pass|fail|escalated)/i,
  confidenceScore:  /\*\*Confidence score:\*\*\s*(\d+)/i,
  loopCount:        /\*\*FVP loop count:\*\*\s*(\d+)/i,
  completedAt:      /\*\*Completed at:\*\*\s*(.+)/i,
};
```

---

## 9. Performance Guarantees

| Operation | Target | Mechanism |
|---|---|---|
| Log entry write | < 50ms | Single file append, no computation |
| Ticket close latency added | 0ms (async) | Fire-and-forget, non-blocking |
| Failed log impact on task | None | Errors caught and logged separately |
| JSONL query (1 year data, ~18K entries) | < 200ms | Stream parse, no full load into memory |
| Disk usage per entry | ~400 bytes | Compact JSON, one line |
| Disk usage per year (~18K entries) | ~7MB | Well within filesystem limits |

---

## 10. Security and Privacy

- MPI data is classified as **SHARED** (not PRIVATE) — it contains task metadata, not task content
- Agent IDs and model references are not sensitive
- Ticket content is NOT included in MPI entries — only frontmatter metadata
- MPI data is included in checkpoints (which are local-only)
- Future ONXZA-LLM training uses anonymized MPI data — agent IDs and company names are stripped before any external use
- The `metadata` field must NEVER contain PII, credentials, or task content

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*
