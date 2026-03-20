# SECURITY PROTOCOLS

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-004  
**Classification:** CRITICAL — ALL AGENTS MUST COMPLY  
**Version:** 1.0.0  
**Last Updated:** 2025-03-17  
**Owner:** Marcus + Security Agent (per project)  
**Review Cycle:** Monthly  

---

## PURPOSE

Security is not a department — it is a system-wide posture. Every agent at every level is a security actor. This document defines the complete security framework for OpenClaw: how threats are identified, classified, reported, and resolved; how code and skills are vetted; how data is protected; and how the system defends itself at scale.

---

## SECTION 1 — SECURITY PRINCIPLES

### 1.1 Zero Trust Architecture
No agent, skill, or external input is trusted by default. Every integration is verified. Every permission is explicit. Trust is earned through verification, not assumed through familiarity.

### 1.2 Least Privilege
Every agent has access only to what it needs to do its job. No more. A frontend agent does not have access to the backend database. A content agent does not have network permissions. Permissions are scoped to role, project, and task.

### 1.3 Defense in Depth
Security is layered. No single control is relied upon. Code review + skill vetting + network restrictions + access controls + monitoring all operate simultaneously.

### 1.4 Security by Design
Security is not bolted on after something is built. Every agent considers security implications during the REASON phase of its P→R→P→E loop. Security Agent is involved before deployment, not after problems arise.

### 1.5 Transparency
Every security event, concern, flag, and resolution is logged. Nothing is hidden. Security logs are readable by Marcus and Aaron at any time.

---

## SECTION 2 — THREAT CLASSIFICATION

### 2.1 Severity Levels

| Level | Definition | Examples | Response Time | Escalation Path |
|---|---|---|---|---|
| SEV-1 CRITICAL | Active or imminent harm to data, system, or people | Credential exposure in live system, active breach, data exfiltration | Immediate — interrupt all other work | Agent → Marcus directly |
| SEV-2 HIGH | Significant vulnerability that could be exploited | Exposed API key in codebase, SQL injection vector, XSS vulnerability | Within 1 cycle | Agent → Security PM → PM → Orchestrator |
| SEV-3 MEDIUM | Vulnerability with limited exploit path | Insecure dependency with known CVE, weak authentication | Within 3 cycles | Agent → Security PM → PM |
| SEV-4 LOW | Best practice violation with no immediate risk | Missing security headers, verbose error messages | Next maintenance cycle | Agent → Security PM |
| SEV-5 INFO | Informational — no vulnerability | Logging improvement opportunity, hardening suggestion | Next review cycle | Security PM log |

### 2.2 Automatic CRITICAL Escalation Triggers
The following are always SEV-1, no classification needed, escalate immediately to Marcus:
- Any credentials, API keys, tokens, passwords, or secrets found in any file tracked by Git
- Evidence of unauthorized access to any OpenClaw directory or system
- Any agent attempting to modify vision.md without Marcus's authorization
- Any agent attempting to communicate with Aaron directly
- Any agent attempting to install unapproved software
- Data exfiltration patterns (large data writes to external endpoints)
- Any child-related, illegal, or genuinely harmful content encountered in any project

---

## SECTION 3 — SECURITY REVIEW PROCESSES

### 3.1 Code Security Review
All code produced by any agent must pass security review before deployment to any live environment.

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
- [ ] Rate limiting implemented on all public endpoints
- [ ] Logging implemented (without logging sensitive data)

### 3.2 Skill Security Vetting
Before any new skill (library, tool, API, framework) is installed:

**Vetting checklist:**
- [ ] Source verified (official package registry or trusted GitHub repo)
- [ ] Maintainer reputation checked (active maintenance, response to issues)
- [ ] License reviewed (compatible with commercial use)
- [ ] Network access requirements audited (what does this skill call home to?)
- [ ] Permission requirements reviewed (what does it need access to?)
- [ ] Known vulnerabilities checked (npm audit, pip check, etc.)
- [ ] Size and dependency tree reviewed (avoid bloated dependency chains)
- [ ] Sandboxed test run performed (test in isolated environment first)
- [ ] Security Agent approval confirmed in ticket

**Red flags that require Marcus/Aaron approval regardless of PM approval:**
- Skill makes network calls to external servers
- Skill requires root/admin access
- Skill accesses filesystem outside agent's designated directory
- Skill has fewer than 6 months of maintenance history
- Skill's author has no verifiable identity
- Skill has >30% of its code in minified or obfuscated form

### 3.3 New Agent Security Review
Before any new agent goes live:
- [ ] Skill set reviewed for excessive permissions
- [ ] Memory directory access scope confirmed (agent can only write to its own memory)
- [ ] Ticket types agent can create are limited to what it needs
- [ ] Agent cannot modify foundational documents
- [ ] Agent cannot access other projects' directories
- [ ] Agent cannot communicate with Aaron
- [ ] Test run reviewed for unexpected behavior

---

## SECTION 4 — CREDENTIAL & SECRET MANAGEMENT

### 4.1 No Secrets in Code
Absolute rule: credentials, API keys, tokens, passwords, and secrets are NEVER written in code, markdown documents, vision files, or any file tracked by Git.

### 4.2 Approved Secret Storage
Secrets are stored in:
- Environment variables loaded at runtime (never in `.env` files committed to Git)
- A local secrets manager (e.g., pass, 1Password CLI, system keychain)
- The specific storage method is configured per system and documented in the system's setup guide

### 4.3 Secret Rotation Policy
- API keys are rotated every 90 days or immediately upon suspected exposure
- Rotations are logged (not the key itself — just that rotation occurred)
- Any exposed secret is considered compromised and rotated immediately, even if exposure was brief

### 4.4 Git History Scanning
- On every Git commit, a pre-commit hook scans for potential secrets (using gitleaks or equivalent)
- Any commit that contains a potential secret is rejected
- If a secret has already been committed, it is considered exposed: rotate immediately, rewrite Git history

---

## SECTION 5 — NETWORK SECURITY

### 5.1 Outbound Network Policy
Agents have no outbound network access by default. Network access is granted explicitly:
- Marcus: iMessage (Apple), Telegram API (approval bot), GitHub (backup)
- Agents with web research capability: approved list of domains only
- Deployment agents: approved deployment targets only
- No agent makes arbitrary outbound connections

### 5.2 API Integration Security
When any project integrates with an external API:
1. API documentation reviewed for data handling practices
2. Minimum required permissions requested (never request more than needed)
3. API key stored per Section 4.2 (never in code)
4. Rate limiting implemented to prevent unexpected charges
5. Response data validated before processing
6. Failure modes handled gracefully (API downtime doesn't crash the system)

### 5.3 Inbound Security (For Web Projects)
All web projects managed by OpenClaw must implement:
- TLS 1.2+ (TLS 1.3 preferred)
- HSTS headers
- CSP headers configured
- Input validation on all forms and API endpoints
- Authentication brute-force protection
- Session management best practices
- Regular dependency updates

---

## SECTION 6 — INCIDENT RESPONSE

### 6.1 Incident Response Procedure

**Step 1 — Detect & Classify**
Any agent detecting a security concern classifies it using Section 2.1. If uncertain, classify higher.

**Step 2 — Contain**
For SEV-1 and SEV-2: Immediately stop all work on the affected component. Do not attempt to fix yet — contain first.
- SEV-1: Revoke affected credentials immediately if possible
- SEV-2: Isolate the vulnerable component from production

**Step 3 — Escalate**
Create security ticket with:
- Severity classification
- What was found
- Where it was found
- When it was found
- What was affected
- Immediate containment actions taken

Route per Section 2.1 escalation path.

**Step 4 — Investigate**
Security Agent leads investigation with PM and Orchestrator support:
- How did this happen?
- What is the full scope of impact?
- What data, if any, was exposed?
- What other systems could be affected?

**Step 5 — Remediate**
Fix the vulnerability with proper review. For SEV-1/SEV-2, Marcus and potentially Aaron are briefed before remediation is deployed.

**Step 6 — Review & Learn**
After resolution:
- Post-incident report written
- Root cause documented
- Process improvement identified
- P&P and/or S&P updated if protocol was insufficient
- All agents updated with learnings

### 6.2 Incident Log
All security incidents are logged in `/openclaw/logs/security/incidents/` with the full incident report. Never deleted.

---

## SECTION 7 — DATA SECURITY

### 7.1 Data at Rest
- CRITICAL classification data: encrypted at rest using AES-256 minimum
- All other data: filesystem permissions restrict access to OpenClaw processes only
- Backups (GitHub): sensitive data is never pushed to GitHub unencrypted

### 7.2 Data in Transit
- All external communications use TLS
- Internal agent communications over local filesystem (no network required)
- Any data leaving the local system must be encrypted

### 7.3 Data Minimization
Agents collect and store only what they need. No agent accumulates data beyond its task requirements. See DOC-010 for full data retention policy.

---

## SECTION 8 — SECURITY AGENT RESPONSIBILITIES

The Security Agent for each project:
- Reviews all code before deployment
- Vets all new skills before installation
- Monitors project for new vulnerabilities
- Conducts monthly security review of the project
- Maintains a security log for the project
- Is the first recipient of all security_flag tickets in the project
- Escalates anything SEV-2 or above to PM immediately

The Security Agent is NOT responsible for:
- Writing code (code security yes, writing code no)
- Making product decisions based on security preferences
- Blocking all work indefinitely — it provides assessment and recommendations, PM makes final call except on SEV-1 where work stops automatically

---

## SECTION 9 — SECURITY FOR INTERNATIONAL OPERATIONS

Since OpenClaw manages projects that may operate internationally:

### 9.1 Jurisdiction Awareness
Every project that handles user data must identify:
- What jurisdictions its users are in
- What data protection laws apply (GDPR, CCPA, PIPEDA, LGPD, etc.)
- What specific requirements those laws impose

### 9.2 Minimum International Security Requirements
Regardless of jurisdiction, all projects with user data must have:
- Privacy policy
- Data processing disclosure
- User data deletion capability
- Incident notification process
- Data residency clarity

### 9.3 Escalation
Any project with significant user data in regulated jurisdictions must have a compliance review per DOC-012 before going live.

