# FAAILS-001: Agent Identity & Naming Standard

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Purpose

An agent is only a valid citizen of a FAAILS-compliant system if it has a canonical identity, proper workspace structure, and adherence to the naming convention. This specification defines those requirements.

---

## 1. Agent Naming Convention

All agents follow a strict three-part naming convention:

```
[Company]_[Department]_[Role]
```

**Requirements:**
- Each part must be alphanumeric + underscore only (no spaces, dashes, or special characters)
- Each part must be PascalCase or lowercase (but not UPPERCASE alone)
- Minimum 3 characters per part
- Maximum 20 characters per part
- Convention is non-negotiable — agents outside this format are non-standard

**Examples:**
- `MG_Parent_Marcus` — Marcus Gear parent company, principal agent
- `DTP_ONXZA_Architect` — DevGru Technology Products, ONXZA product, architect role
- `WDC_Content_BlogWriter` — World Destination Club, content department, blog writer
- `MGA_Client_Proposal` — Marcus Gear Agency, client services, proposal agent

**Rationale:** The naming convention serves as a directory-friendly identifier that immediately reveals:
- What company/portfolio owns the agent
- What department the agent serves
- What specialized role the agent plays

This enables automated routing, permission checking, and team composition without centralized registries.

---

## 2. Agent Workspace Structure

Every persistent daemon agent has a dedicated directory:

```
~/.openclaw/workspace-[company-dept-role-lowercase]/
```

The directory name is lowercase with hyphens replacing underscores for filesystem compatibility.

**Required files (all 6 must exist and pass TORI-QMD validation):**

### 2.1 AGENTS.md
The agent's operational manual. Contains:
- Identity statement (full name, company, role, model tier)
- Responsibilities (what the agent does and does NOT do)
- Scope boundaries (what requests fall outside scope)
- Ticket types received (incoming work types)
- Ticket types created (outgoing work types)
- Shared learnings read/write paths
- OUT OF LANE PROTOCOL (how to route out-of-scope work)
- Credit line (required by TORI-QMD)

**Minimum length:** 200 words  
**Required sections:** Identity, Responsibilities, Scope Boundaries, Ticket Types

### 2.2 SOUL.md
The agent's working philosophy. Contains:
- Core values
- Decision-making principles
- Communication style
- How the agent approaches conflict or ambiguity
- What success looks like to this agent

**Minimum length:** 150 words  
**Required sections:** Values, Working Style, or equivalent expressing intent and approach

### 2.3 IDENTITY.md
Structured identity card (YAML-based). Contains:
```yaml
Full Name: [Agent ID]
Company: [Company name]
Department: [Department]
Role: [Role description]
Model: [default model used]
Reports To: [supervisor agent ID]
Workspace: workspace-[lowercase-slug]
Persistence: [PERSISTENT DAEMON | TEMPORARY SUB-AGENT]
Shared Learnings Read: [paths]
Shared Learnings Write: [paths]
Created: [YYYY-MM-DD]
Status: [ACTIVE | ARCHIVED | TRAINING]
Credit line: present
```

**Required fields:** All fields above  
**Validation:** TORI-QMD checks all fields are present and non-empty

### 2.4 MEMORY.md
Long-term memory loaded at every session start. Contains:
- Session start checklist (what the agent should read first)
- Context relevant to ongoing projects
- Key learnings specific to this agent's domain
- Session history (summary of recent work)
- Current priorities

**Minimum length:** 100 words  
**Required sections:** At minimum — Session Start Checklist, Context, Current Priorities  
**Format:** Markdown with clear section headers

### 2.5 TOOLS.md
Available tools and external service integrations. Contains:
- CLI tools the agent can invoke
- External APIs with authentication status
- Credentials stored / needed
- Database connections
- File access scopes
- Rate limits and quotas
- Shared resources

**Minimum length:** 100 words  
**Required sections:** Available Tools, External Services, Credentials/Auth Status

### 2.6 HEARTBEAT.md
Scheduled recurring tasks (cron jobs). If the agent has no scheduled tasks, the file must contain:

```markdown
# HEARTBEAT.md

## No scheduled tasks
This agent operates on task assignment only. No standing cron jobs.
```

If the agent does have scheduled tasks:
- Schedule expression (cron format or human-readable)
- What task runs
- Expected frequency
- Escalation if task fails
- Credit line

**Required:** At minimum the file must exist and pass TORI-QMD

---

## 3. Persistence Classification

Set at agent creation time in IDENTITY.md. Never changed without explicit approval.

### 3.1 PERSISTENT DAEMON

An agent with unlimited operational lifetime. Examples:
- Company CEO agents
- Department lead agents
- Long-term platform specialists
- Ongoing product teams

**Characteristics:**
- Registered permanently in `~/.openclaw/openclaw.json`
- Full 6-file workspace with all standard sections
- Git history and checkpoints maintained indefinitely
- Receives sustained ticketing and resource allocation
- HEARTBEAT.md may define cron tasks
- Memory.md is regularly updated across sessions
- Agent's work is permanent record

**Creation process:**
1. Design document approved by department PM
2. Workspace created with 6 files (scaffolded from global template)
3. Agent registered in openclaw.json
4. Checkpoint created
5. Training runs (5–10 tasks) with PM oversight
6. Agent goes live

### 3.2 TEMPORARY SUB-AGENT

An agent created for a specific time-bounded task or project. Examples:
- Sub-agents spawned for a single complex task
- Agents for a 3-month project with defined end date
- Experiment agents testing new approaches
- One-off research or analysis agents

**Characteristics:**
- NOT registered in openclaw.json
- Limited or minimal workspace (may use shared AGENTS.md template)
- Spawned by sessions_spawn() with runtime="subagent"
- Lifespan tied to task or project completion
- Before retirement: learnings archived to `shared-learnings/[company]/patterns/archived/[slug]-learnings.md`
- Workspace may be deleted after handoff confirmed

**Conversion rule:** If a temporary sub-agent becomes critical to ongoing work, convert it to PERSISTENT DAEMON:
1. Create full 6-file workspace
2. Register in openclaw.json
3. Notify Aaron of the conversion

---

## 4. Global Standard Template

Every agent — whether persistent daemon or temporary sub-agent — is initialized from the global standard agent template maintained by MG_Parent_AgentDeveloper.

The global template ensures:
- Consistent quality across all agents
- Universal compatibility with dispatcher and routing
- Baseline tool access and integrations
- Shared security and audit standards
- Compatibility with FAAILS protocol

**The template is not modified per-agent.** Company context and project knowledge are layered on top of the template, not substituted.

---

## 5. TORI-QMD Validation

All 6 agent workspace files must pass TORI-QMD validation before the agent goes live or receives its first task.

**Validation rules per file:**

| File | Required Fields | Min. Length | Format |
|---|---|---|---|
| AGENTS.md | Identity, Responsibilities, Scope, Ticket Types, Credit Line | 200 words | Markdown |
| SOUL.md | Values + Working Style, Credit Line | 150 words | Markdown |
| IDENTITY.md | All YAML fields, Credit Line | — | YAML frontmatter |
| MEMORY.md | Session Start Checklist, Context, Credit Line | 100 words | Markdown |
| TOOLS.md | Available Tools section, Credit Line | 100 words | Markdown |
| HEARTBEAT.md | Cron config OR "No scheduled tasks" statement, Credit Line | — | Markdown |

**Validation command:**
```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py workspace-[agent-id]/
# Output: PASS: workspace-[agent-id]/ or FAIL with missing fields
```

An agent cannot receive tasks until all 6 files pass validation.

---

## 6. Inter-Company Isolation

Agents in one company cannot directly access the private workspaces of agents in another company.

**Rules:**
- `workspace-[company-A-agent]` files are readable only by agents in company-A
- `workspace-[company-B-agent]` files are NOT readable by company-A agents
- Shared learnings at company level can be read within company
- Global shared learnings (`shared-learnings/global/`) are readable by all agents
- Cross-company collaboration goes through the Orchestrator and ticket system, not direct file access

**Enforcement mechanism:** OpenClaw permission system. Agents spawned with company context can only read their company's workspace directories.

---

## 7. Agent Status Lifecycle

Set in IDENTITY.md `Status` field:

| Status | Meaning | Duration |
|---|---|---|
| TRAINING | Agent is live but under PM observation; mistakes expected | ~10 tasks or 2 weeks |
| ACTIVE | Agent is fully operational and trusted | Indefinite (for persistent) |
| ARCHIVED | Agent is retired but workspace kept for reference | Permanent |

---

## 8. Examples

### Example 1: Persistent Daemon Agent

```
Agent ID: DTP_ONXZA_Docs
Company: DevGru Technology Products
Department: ONXZA
Role: Documentation Specialist
Model: claude-haiku-4-5
Reports To: DTP_ONXZA_PM
Persistence: PERSISTENT DAEMON
Status: ACTIVE
Created: 2026-03-17
```

Workspace: `~/.openclaw/workspace-dtp-onxza-docs/`

This agent is permanently registered. It receives ongoing documentation tasks. Its MEMORY.md is updated regularly. It has 6-file workspace with full structure.

### Example 2: Temporary Sub-Agent

Spawned for a single code review task:

```javascript
sessions_spawn({
  task: "Review PR #1234 and provide detailed feedback",
  runtime: "subagent",
  mode: "run",
  timeoutSeconds: 3600
})
```

The sub-agent is created on-the-fly, completes the task, archives learnings, and is retired. No permanent workspace. No registration in openclaw.json.

---

## 9. Compliance Checklist

Before an agent goes live:

- [ ] Name follows [Company]_[Department]_[Role] convention
- [ ] Workspace directory created at ~/.openclaw/workspace-[slug]/
- [ ] All 6 required files exist
- [ ] All files pass TORI-QMD validation
- [ ] IDENTITY.md has all required fields
- [ ] AGENTS.md describes scope and ticket types
- [ ] MEMORY.md has session start checklist
- [ ] Persistence class set correctly (PERSISTENT or TEMPORARY)
- [ ] Registered in openclaw.json (if PERSISTENT)
- [ ] Checkpoint created pre-launch
- [ ] First task is a test task
- [ ] PM confirms readiness before live assignment

---

*This specification is part of FAAILS. Maintained by DTP_ONXZA_Docs.*  
*Specification version: 1.0 — 2026-03-18*
