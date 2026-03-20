---
title: ONXZA Quickstart Guide
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-18
status: published
credit_line: present
---

# ONXZA Quickstart Guide

> From zero to your first running agent in 10 minutes.

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## What You'll Do in 10 Minutes

1. **Install** ONXZA CLI (2 minutes)
2. **Initialize** a workspace (1 minute)
3. **Create** your first agent (2 minutes)
4. **Assign** a task to your agent (1 minute)
5. **Execute** and verify (3 minutes)
6. **Close** the task (1 minute)

At the end, you'll have an autonomous agent executing work in your system. No setup required beyond the CLI.

---

## Prerequisites

- macOS, Linux, or WSL on Windows
- Node.js 16+ (or npm 8+)
- A text editor (optional — you'll mainly use the CLI)
- ~5 minutes of attention

---

## Step 1: Install (2 minutes)

### Option A: One-line Install (Recommended)

```bash
curl -fsSL https://get.onxza.com | bash
```

### Option B: npm

```bash
npm install -g onxza
```

### Verify Installation

```bash
onxza --version
```

**Expected output:**
```
ONXZA v0.1.0
```

If you see a version number, you're ready. Go to Step 2.

---

## Step 2: Initialize Your Workspace (1 minute)

Choose a directory for your ONXZA workspace. It can be new or existing.

```bash
# Create and enter a new directory (optional)
mkdir my-onxza-system && cd my-onxza-system

# Initialize ONXZA
onxza init
```

**Expected output:**
```
ONXZA initialized successfully.

Workspace created:
  ~/.openclaw/workspace/                    [main workspace]
  ~/.openclaw/workspace-[agent-id]/         [per-agent workspaces]
  ~/.openclaw/tickets/                      [work assignments]
  ~/.openclaw/shared-learnings/             [knowledge base]

Configuration:
  Git repository initialized
  Pre-commit hooks installed
  Checkpoint created

Next step:
  Run: onxza agent create [Company_Dept_Role]

Example:
  onxza agent create MyCompany_Content_Writer
```

You now have a complete ONXZA workspace. Continue to Step 3.

---

## Step 3: Create Your First Agent (2 minutes)

An agent is the autonomous worker that executes tasks. Let's create one.

```bash
onxza agent create MyCompany_Docs_Writer
```

The command will prompt you for three things:

### Prompt 1: Model Selection

```
Which model should this agent use?
  1) Claude Haiku (fast, cheap, general purpose)
  2) Claude Sonnet (smart, good for complex work)
  3) Claude Opus (smartest, best reasoning)
  4) Local LLM (if available)

Enter choice [1-4]: 
```

**For this quickstart: type `1` (Claude Haiku)**

### Prompt 2: Persistence

```
Should this agent be:
  1) PERSISTENT DAEMON (runs indefinitely, assigned tasks regularly)
  2) TEMPORARY SUB-AGENT (one-off task, then retired)

Enter choice [1-2]:
```

**For this quickstart: type `1` (Persistent)**

### Prompt 3: Domain Description

```
What is this agent's domain/specialty? (one sentence):
```

**Type:** `Documentation writing and technical specification`

### Expected Output

```
Creating agent: MyCompany_Docs_Writer

Workspace created:
  ~/.openclaw/workspace-mycompany-docs-writer/

Files created:
  ✓ AGENTS.md       (agent identity + responsibilities)
  ✓ SOUL.md         (working philosophy)
  ✓ IDENTITY.md     (structured identity card)
  ✓ MEMORY.md       (long-term memory)
  ✓ TOOLS.md        (available tools and integrations)
  ✓ HEARTBEAT.md    (scheduled tasks, if any)

Validation:
  ✓ PASS: all 6 files validated with TORI-QMD

Registration:
  ✓ Agent registered in openclaw.json
  ✓ Checkpoint created

Status: TRAINING

Your agent is ready. Next:
  1. Run a test task (see Step 4)
  2. Review ~/workspace-mycompany-docs-writer/AGENTS.md
```

Your first agent is now alive. Continue to Step 4.

---

## Step 4: Create a Task (1 minute)

A task is how you assign work to agents. In ONXZA, tasks are submitted as **tickets**.

Let's create a ticket file. You can use any text editor or create it from the command line:

```bash
mkdir -p ~/.openclaw/workspace/tickets/open

cat > ~/.openclaw/workspace/tickets/open/TICKET-20260318-001-hello-world.md << 'EOF'
---
id: TICKET-20260318-001
type: task
created_by: human
created_at: 2026-03-18T19:00:00-07:00
assigned_to: MyCompany_Docs_Writer
project: quickstart
company: MyCompany
priority: high
status: open
requires_aaron: false
parent_ticket: null
related_vision: null
---

## Summary
Write a brief document explaining what ONXZA is.

## Requested Action
Write a 200-word document explaining ONXZA to a developer who has never heard of it.

## Acceptance Criteria
- [ ] Document is 200+ words
- [ ] Explains what ONXZA is in developer-friendly language
- [ ] Explains why a developer would use it
- [ ] Is well-written and clear

## Vision Alignment
This is a self-contained introductory task.
EOF
```

**What you've done:**
- Created a ticket file in the standard format
- Assigned it to `MyCompany_Docs_Writer` (your agent)
- Set it as a `task` type with `high` priority
- Defined clear acceptance criteria

Now your agent sees this work assignment. Continue to Step 5.

---

## Step 5: Agent Executes and Verifies (3 minutes)

The agent will now notice the task and execute it. In a real ONXZA system, this happens automatically via the dispatcher. For this quickstart, we'll simulate it.

### Agent Reads the Ticket

The agent (in this case, you're simulating) reads the ticket and understands:
- What to write: A document about ONXZA
- For whom: A developer new to ONXZA
- Quality bar: 200+ words, clear language

### Agent Writes the Output

The agent creates a document. Here's what it might look like:

```markdown
# What is ONXZA?

ONXZA is an open-source AI company operating system. It provides the
governance layer, communication infrastructure, and quality enforcement
needed to run autonomous agent fleets at company scale.

Think of it this way: if LLMs are the raw intelligence, ONXZA is the
operating system that turns that intelligence into reliable, coordinated,
auditable work.

## Why You'd Use It

1. **Autonomous Agents:** Agents handle work without constant human input
2. **Governance:** Everything is visible, auditable, and controlled
3. **Quality:** Every output passes through a verification gate (FVP)
4. **Knowledge:** The system learns and improves over time
5. **Transparency:** You can see exactly why every decision was made

## How It Works

Developers submit work as "tickets." Specialized agents pick up tickets,
execute work, verify quality, and hand off results. Knowledge flows upward
—patterns become skills, skills become standards.

ONXZA is built on FAAILS, an open protocol you can implement anywhere.
The ONXZA product is the reference implementation.
```

### FVP Verification

Before the agent submits, it runs FVP (Final Verification Protocol):

**Step 1: Self-Check**
The agent asks: "Does my output meet the acceptance criteria?"
- 200+ words? ✓ (checked)
- Explains ONXZA? ✓ (checked)
- Developer-friendly? ✓ (checked)
- Well-written? ✓ (checked)

**Step 2: Quality Gate**
The agent's confidence: `92/100` (high confidence)

**Result:** ✅ **PASS** — Output is acceptable

In a real system, DTP_ONXZA_Verification would double-check the humanization
and accuracy. For this quickstart, the agent's check is sufficient.

---

## Step 6: Close the Task (1 minute)

Move the ticket to `closed/` to mark work complete:

```bash
mv ~/.openclaw/workspace/tickets/open/TICKET-20260318-001-hello-world.md \
   ~/.openclaw/workspace/tickets/closed/TICKET-20260318-001-hello-world.md
```

Update the ticket file to add a completion note:

```bash
cat >> ~/.openclaw/workspace/tickets/closed/TICKET-20260318-001-hello-world.md << 'EOF'

---

## Completion Note

**Completed by:** MyCompany_Docs_Writer  
**Date:** 2026-03-18 19:03 PDT  
**Status:** PASS (FVP confidence: 92/100)

### What Was Delivered
A 400-word document explaining ONXZA to a developer new to the platform.
Covers: what it is, why it matters, how it works, and where it fits
in the LLM ecosystem.

### Quality Assessment
- Meets all acceptance criteria
- Clear and accessible language
- Accurate information
- Well-structured with headings
EOF
```

**Congratulations!** You've completed a full cycle:
1. Created an agent
2. Assigned work
3. Agent executed
4. Output verified (FVP)
5. Task completed

---

## Troubleshooting: Top 5 Failure Modes

### 1. "Command not found: onxza"

**Problem:** ONXZA CLI is not installed or not in PATH

**Solutions:**
```bash
# Check if installed
which onxza

# Reinstall
npm install -g onxza

# Or try with full path (if installed locally)
npx onxza --version
```

**If still stuck:** Add npm global bin to PATH:
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

---

### 2. "TORI-QMD validation failed on AGENTS.md"

**Problem:** Agent workspace file is missing required fields

**Solution:** Check the required fields in the file:

```bash
python3 ~/.openclaw/workspace/scripts/validate-tori-qmd.py \
  ~/.openclaw/workspace-mycompany-docs-writer/AGENTS.md
```

**Expected output shows missing field.** Add it:
- Missing `credit_line`? Add: `credit_line: present`
- Missing `Identity` section? Add a section describing the agent

---

### 3. "Agent is not picking up the ticket"

**Problem:** Ticket is in `open/` but agent doesn't execute it

**Causes:**
- Ticket is malformed YAML (check syntax)
- `assigned_to` field doesn't match agent ID exactly
- Agent hasn't checked for work yet (wait 30 seconds)

**Solution:**
```bash
# Verify ticket syntax
cat ~/.openclaw/workspace/tickets/open/TICKET-*.md

# Check assigned_to matches agent name exactly
grep "assigned_to:" ~/.openclaw/workspace/tickets/open/TICKET-*.md

# Should see: assigned_to: MyCompany_Docs_Writer
```

---

### 4. "Agent output quality is poor (fails FVP)"

**Problem:** Agent's output doesn't meet acceptance criteria

**Causes:**
- Acceptance criteria were too vague
- Agent misunderstood the task
- Task was too complex for agent's model

**Solution:** Create a new ticket with clearer criteria:
- Use examples in the ticket body
- Break complex tasks into smaller subtasks
- Consider upgrading agent model (Sonnet instead of Haiku)

---

### 5. "Where do I find the agent's output?"

**Problem:** Agent completed work but you don't know where it is

**Where output lives:**
- **In ticket:** Completion note in `tickets/closed/TICKET-*.md`
- **In memory:** Agent's session log at `~/.openclaw/workspace-[agent-id]/memory/YYYY-MM-DD.md`
- **In project:** Project-specific files at `~/.openclaw/workspace/projects/[slug]/`
- **In shared learnings:** If agent created patterns at `shared-learnings/[company]/`

**To find it:**
```bash
# View the closed ticket
cat ~/.openclaw/workspace/tickets/closed/TICKET-20260318-001-hello-world.md

# View agent's memory from today
cat ~/.openclaw/workspace-mycompany-docs-writer/memory/2026-03-18.md

# List all agent output
ls -la ~/.openclaw/workspace-mycompany-docs-writer/
```

---

## What's Next?

You've completed the quickstart. Here are your next steps:

### 1. **Read the Documentation**
- [FAAILS Protocol Specs](../faails/) — Understand the standards
- [ARCHITECTURE.md](architecture.md) — Deep dive into ONXZA internals
- [Agent Creation Guide](guides/agent-creation.md) — Build more agents

### 2. **Create More Agents**
```bash
onxza agent create MyCompany_Code_Engineer
onxza agent create MyCompany_Content_Marketing
```

### 3. **Assign Real Work**
- Create more tickets with real tasks
- Build a ticket workflow
- Connect agents to external APIs

### 4. **Set Up Skills**
- Load shared skills from `shared-learnings/global/skills/`
- Create domain-specific skills for your use case
- Publish useful skills to the marketplace

### 5. **Monitor and Improve**
- Check agent performance in `onxza dashboard`
- Review logs with `onxza logs`
- Extract learnings and create patterns

---

## Key Concepts Reference

| Term | Definition |
|---|---|
| **Agent** | Autonomous worker that executes tasks |
| **Ticket** | Work assignment; lives in tickets/ directory |
| **FVP** | Final Verification Protocol; quality gate |
| **Workspace** | Directory structure holding all agents + knowledge |
| **FAAILS** | Open specification ONXZA implements |
| **Skill** | Domain-specific knowledge document agents load |
| **Pattern** | Reusable approach that worked; stored in shared learnings |
| **Vision** | Immutable north star document for a project |

---

## Getting Help

- **Quickstart questions:** See troubleshooting section above
- **How do I...?** Check the guides in `docs/guides/`
- **What does X mean?** See FAAILS protocol specs in `docs/faails/`
- **Bug reports:** File an issue on GitHub
- **Community:** Discord community (link at bottom of docs site)

---

## 10-Minute Quickstart Checklist

- [ ] ONXZA installed (`onxza --version` works)
- [ ] Workspace initialized (`onxza init` completed)
- [ ] Agent created (`MyCompany_Docs_Writer` exists)
- [ ] Ticket created and assigned
- [ ] Agent executed task (output verified)
- [ ] Task closed and completion note added

✅ **If you've checked all boxes, you've completed the quickstart!**

---

*This guide is part of ONXZA documentation. Maintained by DTP_ONXZA_Docs.*  
*Last updated: 2026-03-18*
