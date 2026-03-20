---
doc_id: ONXZA-DOC-004
title: Security Protocols
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: security, threat-classification, credentials, incident-response, code-review, all-agents
summary: Complete security framework for ONXZA. How threats are identified, classified, reported, and resolved. Code and skill vetting checklists. Incident response procedures. Data protection standards.
---

# ONXZA Security Protocols

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0 | **Review cycle:** Monthly

---

## Core Principle

Security is not a department — it is a system-wide posture. **Every agent at every level is a security actor.** This document defines the complete security framework: how threats are identified, classified, reported, and resolved; how code and skills are vetted; how data is protected; and how the system defends itself at scale.

---

## Section 1 — Security Principles

### 1.1 Zero Trust Architecture
No agent, skill, or external input is trusted by default. Every integration is verified. Every permission is explicit. Trust is earned through verification, not assumed through familiarity.

### 1.2 Least Privilege
Every agent has access only to what it needs to do its job. A frontend agent does not have access to the backend database. A content agent does not have network permissions. Permissions are scoped to role, project, and task.

### 1.3 Defense in Depth
Security is layered. No single control is relied upon. Code review + skill vetting + network restrictions + access controls + monitoring all operate simultaneously.

### 1.4 Security by Design
Security is not bolted on after something is built. Every agent considers security implications during the REASON phase of its Perceive → Reason → Plan → Execute loop. The security agent is involved before deployment, not after problems arise.

### 1.5 Transparency
Every security event, concern, flag, and resolution is logged. Nothing is hidden. Security logs are readable by the primary agent and owner at any time.

---

## Section 2 — Threat Classification

### Severity Levels

| Level | Definition | Examples | Response Time | Escalation Path |
|---|---|---|---|---|
| **SEV-1 CRITICAL** | Active or imminent harm to data, system, or people | Credential in live system, active breach, data exfiltration | Immediate — interrupt all other work | Agent → primary agent directly |
| **SEV-2 HIGH** | Significant vulnerability that could be exploited | Exposed API key in codebase, SQL injection vector, XSS | Within 1 cycle | Agent → Security PM → PM → Orchestrator |
| **SEV-3 MEDIUM** | Vulnerability with limited exploit path | Insecure dependency with known CVE, weak auth | Within 3 cycles | Agent → Security PM → PM |
| **SEV-4 LOW** | Best practice violation with no immediate risk | Missing security headers, verbose error messages | Next maintenance cycle | Agent → Security PM |
| **SEV-5 INFO** | Informational — no vulnerability | Logging improvement, hardening suggestion | Next review cycle | Security PM log |

### Automatic SEV-1 Triggers

The following are **always SEV-1** — no classification needed. Escalate immediately:
- Any credentials, API keys, tokens, passwords, or secrets found in any file tracked by Git
- Evidence of unauthorized access to any system directory
- Any agent attempting to modify `vision.md` without primary agent authorization
- Any agent attempting to communicate with the owner directly
- Any agent attempting to install unapproved software
- Data exfiltration patterns (large data writes to external endpoints)
- Any child-related, illegal, or genuinely harmful content encountered in any project

---

## Section 3 — Security Review Processes

### 3.1 Code Security Review

All code produced by any agent must pass security review before deployment.

**Security review checklist:**
- [ ] No hardcoded credentials, tokens, or secrets
- [ ] All user inputs validated and sanitized
- [ ] No SQL injection vectors (parameterized queries only)
- [ ] No XSS vulnerabilities (output encoding applied)
- [ ] No insecure direct object references
- [ ] Authentication implemented correctly
- [ ] Authorization checks on all protected resources
- [ ] Error messages don't expose internal structure
- [ ] Dependencies checked against known CVE databases
- [ ] No unnecessary permissions requested
- [ ] HTTPS enforced (no HTTP in production)
- [ ] Content Security Policy headers present
- [ ] Rate limiting on all public endpoints
- [ ] Logging implemented (without logging sensitive data)

### 3.2 Skill Security Vetting

Before any new skill (library, tool, API, framework) is installed:

**Vetting checklist:**
- [ ] Source verified (official package registry or trusted GitHub repo)
- [ ] Maintainer reputation checked (active maintenance, response to issues)
- [ ] License reviewed (compatible with commercial use)
- [ ] Network access requirements audited (what does this skill call home to?)
- [ ] Permission requirements reviewed
- [ ] Known vulnerabilities checked (`npm audit`, `pip check`, etc.)
- [ ] Size and dependency tree reviewed (avoid bloated chains)
- [ ] Sandboxed test run performed
- [ ] Security agent approval confirmed in ticket

**Red flags that require primary agent / owner approval regardless of PM approval:**
- Skill makes network calls to external servers
- Skill requires root/admin access
- Skill accesses filesystem outside agent's designated directory
- Skill has less than 6 months of maintenance history
- Skill's author has no verifiable identity
- More than 30% of the skill's code is minified or obfuscated

### 3.3 New Agent Security Review

Before any new agent goes live:
- [ ] Skill set reviewed for excessive permissions
- [ ] Memory directory access scope confirmed (agent can only write to its own memory)
- [ ] Ticket types agent can create are limited to what it needs
- [ ] Agent cannot modify foundational documents
- [ ] Agent cannot access other projects' directories
- [ ] Agent cannot communicate with the owner directly
- [ ] Test run reviewed for unexpected behavior

---

## Section 4 — Credential and Secret Management

### 4.1 Absolute Rule: No Secrets in Code

Credentials, API keys, tokens, passwords, and secrets are **never** written in code, markdown documents, vision files, or any file tracked by Git. No exceptions.

### 4.2 Approved Secret Storage

- Environment variables loaded at runtime (never in `.env` files committed to Git)
- A local secrets manager (e.g., 1Password CLI, system keychain, Supabase encrypted store)
- The storage method is configured per system and documented in the system's setup guide

### 4.3 Secret Rotation Policy
- API keys are rotated every 90 days or immediately upon suspected exposure.
- Rotations are logged (the rotation event, not the key value).
- Any exposed secret is considered compromised and rotated immediately.

### 4.4 Git History Scanning
- On every Git commit, a pre-commit hook scans for potential secrets.
- Any commit containing a potential secret is rejected.
- If a secret has already been committed, it is considered exposed: rotate immediately, rewrite Git history using `git-filter-repo`.

---

## Section 5 — Network Security

### 5.1 Outbound Network Policy
Agents have **no outbound network access by default**. Network access is granted explicitly per agent and per domain. No agent makes arbitrary outbound connections.

### 5.2 API Integration Security
When any project integrates with an external API:
1. API documentation reviewed for data handling practices.
2. Minimum required permissions requested (never more than needed).
3. API key stored per Section 4.2 (never in code).
4. Rate limiting implemented to prevent unexpected charges.
5. Response data validated before processing.
6. Failure modes handled gracefully (API downtime doesn't crash the system).

### 5.3 Inbound Security (Web Projects)
All web projects must implement:
- TLS 1.2+ (TLS 1.3 preferred)
- HSTS headers
- CSP headers configured
- Input validation on all forms and API endpoints
- Brute-force protection on authentication endpoints
- Session management best practices
- Regular dependency updates

---

## Section 6 — Incident Response

### Step 1 — Detect and Classify
Any agent detecting a security concern classifies it using Section 2. If uncertain, classify higher.

### Step 2 — Contain
**For SEV-1 and SEV-2:** Stop all work on the affected component immediately. Do not attempt to fix yet — contain first.
- SEV-1: Revoke affected credentials immediately if possible.
- SEV-2: Isolate the vulnerable component from production.

### Step 3 — Escalate
Create a security ticket with:
- Severity classification
- What was found, where, and when
- What was affected
- Immediate containment actions taken

Route per Section 2 escalation path.

### Step 4 — Investigate
Security agent leads investigation:
- How did this happen?
- What is the full scope of impact?
- What data, if any, was exposed?
- What other systems could be affected?

### Step 5 — Remediate
Fix the vulnerability with proper review. For SEV-1/SEV-2, the primary agent and owner are briefed before remediation is deployed.

### Step 6 — Review and Learn
After resolution:
- Post-incident report written.
- Root cause documented.
- Process improvement identified.
- Relevant governance documents updated.
- All agents updated with learnings.

### Incident Log
All security incidents are logged to `logs/security/incidents/` with the full incident report. Never deleted.

---

## Section 7 — Data Security

### Data at Rest
- CRITICAL classification data: encrypted at rest using AES-256 minimum.
- All other data: filesystem permissions restrict access to agent processes only.
- Backups (GitHub): sensitive data is never pushed to GitHub unencrypted.

### Data in Transit
- All external communications use TLS.
- Internal agent communications over local filesystem (no network required).
- Any data leaving the local system must be encrypted.

### Data Minimization
Agents collect and store only what they need. No agent accumulates data beyond its task requirements. See [Data Retention and Privacy](data-retention-privacy.md) for full policy.

---

## Section 8 — Security Agent Responsibilities

The security agent for each project:
- Reviews all code before deployment.
- Vets all new skills before installation.
- Monitors project for new vulnerabilities.
- Conducts monthly security review.
- Maintains a security log for the project.
- Is the first recipient of all `security_flag` tickets.
- Escalates anything SEV-2 or above to PM immediately.

The security agent is **not** responsible for:
- Writing code (code security review yes, writing code no).
- Making product decisions based on security preferences.
- Blocking all work indefinitely — it provides assessment and recommendations; PM makes final call except on SEV-1 where work stops automatically.

---

## Section 9 — Security for International Operations

### Jurisdiction Awareness
Every project that handles user data must identify:
- What jurisdictions its users are in.
- What data protection laws apply (GDPR, CCPA, PIPEDA, LGPD, etc.).
- What specific requirements those laws impose.

### Minimum International Security Requirements
Regardless of jurisdiction, all projects with user data must have:
- Privacy policy
- Data processing disclosure
- User data deletion capability
- Incident notification process
- Data residency clarity

Any project with significant user data in regulated jurisdictions must have a compliance review before going live.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*
