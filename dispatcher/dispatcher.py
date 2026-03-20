#!/usr/bin/env python3
"""
ONXZA Dispatcher — Central ticket scan and agent notification engine.
Version: 1.1.0

Architecture §6.5: Runs every 5 minutes via OpenClaw cron.
Scans tickets/open/, resolves assigned_to, sends TICKET_ASSIGNED
notifications to each agent session. Tracks delivery state in
dispatcher/state.json to avoid duplicate notifications.

Fixes in v1.1.0:
  - Alias resolution: PascalCase, legacy IDs, and group addresses
  - Exit 0 on partial success (only exit 1 if ALL deliveries fail)
  - Workspace discovery: scan actual ~/.openclaw dirs for matching agent
  - Skip group addresses (all-mga-agents etc) with a WARN, not ERROR
  - Suppress repeated same-ticket errors in log (dedup per run)

Agent polling cadence (ARCHITECTURE.md §6.5):
  - marcus / mg-parent-marcus     : continuous (no cadence gate)
  - CEO Orchestrators             : session-start + every 15 min
  - Department PMs                : session-start + every 30 min
  - Specialists                   : session-start + on-task-completion
  - QualityDirector               : session-start + every 60 min

Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
Powered by DevGru US Inc. DBA DevGru Technology Products.
Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.
"""

import os
import sys
import json
import re
import time
import datetime
import subprocess
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

OPENCLAW_DIR     = Path.home() / ".openclaw"
WORKSPACE        = OPENCLAW_DIR / "workspace"
TICKETS_OPEN     = WORKSPACE / "tickets" / "open"
DISPATCHER_DIR   = WORKSPACE / "projects" / "onxza" / "dispatcher"
STATE_FILE       = DISPATCHER_DIR / "state.json"
LOG_FILE         = DISPATCHER_DIR / "dispatcher.log"

# ---------------------------------------------------------------------------
# Agent ID alias table
# ID normalization: map ticket assigned_to values → actual workspace directory suffix
# ---------------------------------------------------------------------------

AGENT_ALIASES = {
    # PascalCase → kebab-case
    "MG_Parent_Marcus":        "mg-parent-marcus",
    "MG_Parent_Orchestrator":  "mg-parent-orchestrator",
    "MG_Parent_AgentDeveloper": "mg-parent-agentdeveloper",
    "MG_Parent_Security":      "mg-parent-security",
    "WDC_Content_PM":          "wdc-content-pm",
    "WDC_Website_PM":          "wdc-website-pm",
    "WDC_Affiliate_PM":        "wdc-affiliate-pm",
    "WDC_CEO":                 "wdc-ceo",
    "WDC_COO":                 "wdc-coo",
    "DTP_ONXZA_PM":            "dtp-onxza-pm",
    "DTP_ONXZA_Router":        "dtp-onxza-router",
    "DTP_ONXZA_Architect":     "dtp-onxza-architect",
    "DTP_CEO":                 "dtp-ceo",
    "DTP_COO":                 "dtp-coo",
    # Legacy/short names
    "marcus":                  "mg-parent-marcus",
    "main":                    "mg-parent-marcus",
    "orchestrator":            "mg-parent-orchestrator",
    # Workspace variant names
    "mg-parent-marcus":        "mg-parent-marcus",
    "workspace":               "mg-parent-marcus",
}

# Group addresses — not deliverable to a single workspace; skip with info log
GROUP_ADDRESSES = re.compile(
    r"^(all-|everyone|broadcast|aaron.gear|Aaron.Gear)", re.I
)

# Human-only recipients — skip gracefully
HUMAN_RECIPIENTS = re.compile(
    r"^(aaron|Aaron Gear|aaron gear|aaron\.gear)$", re.I
)

# ---------------------------------------------------------------------------
# Cadence tier definitions
# ---------------------------------------------------------------------------
# interval_minutes = None  → continuous (always eligible)
# interval_minutes = 0     → on-task-completion (dispatcher always delivers;
#                             agent self-gates via TASK_STATE)

CADENCE_RULES = [
    (re.compile(r"^(main|mg-parent-marcus|marcus|mg-parent-orchestrator|orchestrator)$", re.I),
     "continuous", None),
    (re.compile(r"-(ceo|coo)$", re.I),                    "ceo-coo",         15),
    (re.compile(r"-pm$", re.I),                            "pm",              30),
    (re.compile(r"(-qualitydirector|-quality-director)$", re.I), "quality",  60),
    (re.compile(r"-(verification|qa)$", re.I),             "quality",         60),
    (re.compile(r".*", re.I),                              "specialist",       0),
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def log(msg: str, level: str = "INFO") -> None:
    ts = datetime.datetime.now().isoformat(timespec="seconds")
    line = f"[{ts}] [{level}] {msg}"
    print(line, flush=True)
    try:
        DISPATCHER_DIR.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE) as f:
                return json.load(f)
        except Exception as e:
            log(f"State load error — starting fresh: {e}", "WARN")
    return {
        "last_run":            None,
        "run_count":           0,
        "notifications_sent":  {},
        "agent_last_notified": {},
        "errors":              [],
    }


def save_state(state: dict) -> None:
    DISPATCHER_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    try:
        with open(tmp, "w") as f:
            json.dump(state, f, indent=2)
        tmp.replace(STATE_FILE)
    except Exception as e:
        log(f"State save error: {e}", "ERROR")


# ---------------------------------------------------------------------------
# Workspace discovery
# ---------------------------------------------------------------------------

def build_workspace_index() -> dict[str, Path]:
    """
    Scan ~/.openclaw/ for workspace-* directories.
    Returns {agent-id: Path} index.
    The main Marcus workspace lives at ~/.openclaw/workspace (no suffix).
    """
    index = {}
    for d in OPENCLAW_DIR.iterdir():
        if not d.is_dir():
            continue
        if d.name == "workspace":
            # Main workspace — maps to mg-parent-marcus and aliases
            index["workspace"] = d
            index["mg-parent-marcus"] = d
            index["marcus"] = d
            index["main"] = d
        elif d.name.startswith("workspace-"):
            agent_id = d.name[len("workspace-"):]
            index[agent_id] = d
    return index


# ---------------------------------------------------------------------------
# Agent ID resolution
# ---------------------------------------------------------------------------

def resolve_agent_id(raw_id: str, workspace_index: dict) -> str | None:
    """
    Resolve a raw assigned_to value to an actual workspace key.
    Returns the resolved agent ID string, or None if unresolvable.
    """
    if not raw_id or not raw_id.strip():
        return None

    raw = raw_id.strip()

    # Skip group addresses
    if GROUP_ADDRESSES.match(raw):
        log(f"  ℹ  Group address skipped: {raw}")
        return None

    # Skip human recipients
    if HUMAN_RECIPIENTS.match(raw):
        log(f"  ℹ  Human recipient skipped (requires_aaron): {raw}")
        return None

    # 1. Direct alias lookup
    resolved = AGENT_ALIASES.get(raw)
    if resolved and resolved in workspace_index:
        return resolved

    # 2. Direct match in workspace index (already kebab-case)
    if raw in workspace_index:
        return raw

    # 3. Normalize PascalCase → kebab-case and retry
    # DTP_ONXZA_Architect → dtp-onxza-architect
    normalized = re.sub(r"[_\s]+", "-", raw).lower()
    if normalized in workspace_index:
        return normalized

    # 4. Underscore → hyphen variant
    hyphenated = raw.replace("_", "-").lower()
    if hyphenated in workspace_index:
        return hyphenated

    return None


# ---------------------------------------------------------------------------
# Ticket parsing
# ---------------------------------------------------------------------------

YAML_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)


def parse_frontmatter(content: str) -> dict:
    meta = {}
    m = YAML_FRONTMATTER.match(content)
    if not m:
        return meta
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    return meta


def extract_ticket_id(filename: str) -> str:
    name = Path(filename).stem
    m = re.match(r"(TICKET-[A-Z0-9\-]+|HC2-[A-Z0-9\-]+|[A-Z][A-Z0-9\-]+-[0-9]+)", name, re.I)
    return m.group(1).upper() if m else name.upper()


def load_open_tickets() -> list[dict]:
    tickets = []
    if not TICKETS_OPEN.exists():
        log(f"tickets/open/ not found at {TICKETS_OPEN}", "WARN")
        return tickets

    for path in sorted(TICKETS_OPEN.glob("*.md")):
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            log(f"Cannot read {path.name}: {e}", "WARN")
            continue

        meta = parse_frontmatter(content)
        ticket_id   = meta.get("id", "") or meta.get("ticket_id", "") or extract_ticket_id(path.name)
        assigned_to = (meta.get("assigned_to", "") or "").strip()
        priority    = (meta.get("priority", "medium") or "medium").strip()

        summary_m = re.search(r"^## Summary\s*\n+(.*?)(?:\n## |\Z)", content, re.DOTALL | re.MULTILINE)
        summary = summary_m.group(1).strip().replace("\n", " ")[:200] if summary_m else ""

        tickets.append({
            "id":          ticket_id,
            "assigned_to": assigned_to,
            "priority":    priority,
            "summary":     summary,
            "filename":    path.name,
            "path":        str(path),
        })

    return tickets


# ---------------------------------------------------------------------------
# Cadence gating
# ---------------------------------------------------------------------------

def cadence_interval(agent_id: str) -> int | None:
    for pattern, _label, interval in CADENCE_RULES:
        if pattern.search(agent_id):
            return interval
    return 0


def agent_is_eligible(agent_id: str, agent_last_notified: dict, now_ts: float) -> bool:
    interval = cadence_interval(agent_id)
    if interval is None:
        return True
    if interval == 0:
        return True
    last_str = agent_last_notified.get(agent_id)
    if not last_str:
        return True
    try:
        last_ts = datetime.datetime.fromisoformat(last_str).timestamp()
    except ValueError:
        return True
    return (now_ts - last_ts) / 60.0 >= interval


# ---------------------------------------------------------------------------
# Notification delivery
# ---------------------------------------------------------------------------

def deliver_notification(agent_id: str, ticket: dict, workspace_index: dict) -> bool:
    workspace = workspace_index.get(agent_id)
    if not workspace:
        log(f"  ✗ No workspace for resolved agent_id={agent_id}", "ERROR")
        return False

    inbox_dir = workspace / "inbox"
    inbox_dir.mkdir(exist_ok=True)

    # DEDUPLICATION: Check if a TICKET_ASSIGNED file for this ticket already exists
    # in the inbox. If so, skip — don't flood the inbox with duplicates.
    ticket_id = ticket['id']
    existing = list(inbox_dir.glob(f"TICKET_ASSIGNED-{ticket_id}-*.md"))
    if existing:
        log(f"  ⏭ Skipped (already in inbox): {agent_id} — {ticket_id}")
        return True  # Not an error — just already delivered

    ts_str = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    inbox_file = inbox_dir / f"TICKET_ASSIGNED-{ticket_id}-{ts_str}.md"

    payload = build_payload(ticket)
    try:
        inbox_file.write_text(payload, encoding="utf-8")
        log(f"  ✓ Delivered to {agent_id}: {inbox_file.name}")
        return True
    except Exception as e:
        log(f"  ✗ Write failed for {agent_id}: {e}", "ERROR")
        return False


def build_payload(ticket: dict) -> str:
    now = datetime.datetime.now().isoformat(timespec="seconds")
    return f"""# TICKET_ASSIGNED

**Ticket ID:** {ticket['id']}
**Priority:** {ticket['priority']}
**Assigned To:** {ticket['assigned_to']}
**File:** {ticket['filename']}

## Summary
{ticket['summary'] or '(no summary)'}

## Action Required
You have an open ticket assigned to you. Check TASK_STATE in your MEMORY.md.
- If TASK_STATE: IDLE → begin work immediately
- If TASK_STATE: ACTIVE → queue for your next available slot

---
*Dispatched by ONXZA Dispatcher v1.1.0 at {now}*
*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru Technology Products.*
"""


# ---------------------------------------------------------------------------
# Health status
# ---------------------------------------------------------------------------

def write_health_status(state: dict, run_summary: dict) -> None:
    DISPATCHER_DIR.mkdir(parents=True, exist_ok=True)
    status = {
        "dispatcher_version":  "1.1.0",
        "last_run":            state.get("last_run"),
        "run_count":           state.get("run_count", 0),
        "last_run_summary":    run_summary,
        "queue_depth":         0,
        "total_notifications": len(state.get("notifications_sent", {})),
        "agent_cadences": {
            "marcus/orchestrator":  "continuous",
            "ceo-orchestrator":     "every 15 min",
            "pm":                   "every 30 min",
            "quality-director":     "every 60 min",
            "specialist":           "on-task-completion",
        },
        "errors_recent": state.get("errors", [])[-10:],
    }
    tmp = (DISPATCHER_DIR / "status.json").with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(status, f, indent=2)
    tmp.replace(DISPATCHER_DIR / "status.json")


# ---------------------------------------------------------------------------
# Main dispatch loop
# ---------------------------------------------------------------------------

def run_dispatch(dry_run: bool = False) -> dict:
    log("─" * 60)
    log(f"ONXZA Dispatcher v1.1.0 {'[DRY RUN] ' if dry_run else ''}starting")

    state   = load_state()
    now_ts  = time.time()
    now_iso = datetime.datetime.now().isoformat(timespec="seconds")

    state["run_count"] = state.get("run_count", 0) + 1
    state["last_run"]  = now_iso

    # Build workspace index once
    workspace_index = build_workspace_index()
    log(f"Workspace index: {len(workspace_index)} entries")

    tickets = load_open_tickets()
    log(f"Found {len(tickets)} open ticket(s)")

    assigned      = [t for t in tickets if t["assigned_to"]]
    unassigned    = len(tickets) - len(assigned)
    if unassigned:
        log(f"{unassigned} ticket(s) with no assigned_to — skipping")

    delivered    = 0
    skipped      = 0
    errors       = 0
    unresolvable = 0

    notifications_sent  = state.setdefault("notifications_sent", {})
    agent_last_notified = state.setdefault("agent_last_notified", {})

    # Dedup errors within this run (avoid log spam for same broken agent)
    seen_unresolvable = set()

    for ticket in assigned:
        tid      = ticket["id"]
        raw_id   = ticket["assigned_to"]

        resolved = resolve_agent_id(raw_id, workspace_index)
        if resolved is None:
            if raw_id not in seen_unresolvable:
                log(f"  ⚠  Cannot resolve agent_id '{raw_id}' — no workspace found", "WARN")
                seen_unresolvable.add(raw_id)
            unresolvable += 1
            continue

        # Cadence gate
        if not agent_is_eligible(resolved, agent_last_notified, now_ts):
            interval = cadence_interval(resolved)
            log(f"  ⏳ Cadence skip: {resolved} (next in {interval}min) — {tid}")
            skipped += 1
            continue

        log(f"  → Dispatching {tid} to {resolved} (raw: {raw_id}) [{ticket['priority']}]")

        if dry_run:
            delivered += 1
            continue

        ok = deliver_notification(resolved, ticket, workspace_index)
        if ok:
            delivered += 1
            agent_last_notified[resolved] = now_iso
            notifications_sent[tid] = {
                "sent_at":         now_iso,
                "agent_id":        resolved,
                "raw_agent_id":    raw_id,
                "priority":        ticket["priority"],
                "delivery_status": "delivered",
            }
        else:
            errors += 1
            err_msg = f"Delivery failed: {tid} → {resolved}"
            errs = state.setdefault("errors", [])
            errs.append(f"{now_iso}: {err_msg}")
            state["errors"] = errs[-50:]

    run_summary = {
        "run_at":            now_iso,
        "tickets_scanned":   len(tickets),
        "tickets_assigned":  len(assigned),
        "delivered":         delivered,
        "skipped_cadence":   skipped,
        "unresolvable":      unresolvable,
        "errors":            errors,
        "unassigned":        unassigned,
        "dry_run":           dry_run,
    }

    log(f"Run complete — delivered:{delivered} cadence_skip:{skipped} "
        f"unresolvable:{unresolvable} write_errors:{errors}")

    if not dry_run:
        save_state(state)
        write_health_status(state, run_summary)

    return run_summary


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(
        description="ONXZA Dispatcher v1.1.0 — scan open tickets and notify assigned agents"
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Scan and report without sending notifications")
    parser.add_argument("--status", action="store_true",
                        help="Print health status JSON and exit")
    args = parser.parse_args()

    if args.status:
        status_path = DISPATCHER_DIR / "status.json"
        if status_path.exists():
            print(status_path.read_text())
        else:
            print(json.dumps({"error": "No dispatcher status yet. Run dispatcher once first."}, indent=2))
        sys.exit(0)

    summary = run_dispatch(dry_run=args.dry_run)

    if args.dry_run:
        print(json.dumps(summary, indent=2))

    # Exit 0 unless all deliveries failed (hard error). Partial success = ok.
    total_attempted = summary["delivered"] + summary["errors"]
    if total_attempted > 0 and summary["errors"] == total_attempted:
        sys.exit(1)
    sys.exit(0)
