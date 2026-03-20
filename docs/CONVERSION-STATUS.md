---
title: Documentation Conversion Status
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-18
status: in-progress
credit_line: present
---

# Documentation Conversion Status

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

## Overview

This document tracks the conversion of 14 internal governance documents (DOC-001 through DOC-014) from internal reference to public ONXZA developer documentation.

**Task:** Convert all internal governance docs to developer-friendly formats for:
- README and docs site
- GitHub wiki and discussions
- Community reference
- External implementors

**Status:** In Progress  
**Started:** 2026-03-18  
**Target Completion:** 2026-03-19 (end of PHASE 2)

---

## Completed Conversions ✅

### 1. Master README & Index
- **Source:** Vision document + multiple sources
- **Output:** `README.md`
- **Status:** ✅ COMPLETE
- **Description:** Master index linking all docs

### 2. Introduction Guide
- **Source:** Vision + general context
- **Output:** `guides/introduction.md`
- **Status:** ✅ COMPLETE
- **Description:** What is ONXZA, core principles, how it works

### 3. System Architecture
- **Source:** ARCHITECTURE.md (existing)
- **Output:** `architecture.md`
- **Status:** ✅ COMPLETE (already published)
- **Description:** Full technical design, stack, subsystems

### 4. FAAILS Specifications (All 10)
- **Sources:** DOC-003, DOC-005, DOC-006, DOC-007, DOC-008, DOC-009, DOC-010, DOC-013 + protocol specs
- **Outputs:** `faails/FAAILS-001.md` through `faails/FAAILS-010.md`
- **Status:** ✅ COMPLETE (previous session)
- **Description:** Complete FAAILS open protocol specification

### 5. Quickstart Guide
- **Source:** Internal onboarding procedures
- **Output:** `quickstart.md`
- **Status:** ✅ COMPLETE (previous task)
- **Description:** 10-minute zero-to-agent walkthrough

---

## Pending Conversions ⏳

### Reference Documents (reference/)

**REF-001: Model Selection & Routing**
- **Source:** `DOC-001_model_selection_index.md`
- **Output:** `reference/models.md`
- **Content:**
  - Model tiers (Frontier, General, Local)
  - Task-to-model routing matrix
  - Override procedures
  - Cost management principles
  - Known limitations
  - Future model considerations
- **Effort:** Medium (technical reference)
- **Priority:** HIGH (frequently referenced)

**REF-002: CLI Reference**
- **Source:** ARCHITECTURE.md §12 CLI Architecture
- **Output:** `reference/cli.md`
- **Content:**
  - All commands with examples
  - Expected output for each
  - Flags and options
  - Common errors and fixes
- **Effort:** Medium
- **Priority:** HIGH (users reference frequently)

**REF-003: Ticket System Reference**
- **Source:** DOC-006_agent_communication_standards.md + FAAILS-002
- **Output:** `reference/tickets.md`
- **Content:**
  - Ticket types with definitions
  - Lifecycle and directory structure
  - YAML schema
  - Example tickets
- **Effort:** Low (largely covered in FAAILS-002)
- **Priority:** MEDIUM

**REF-004: Agent Registry**
- **Source:** `AGENT-REGISTRY.md` (existing)
- **Output:** `reference/agent-registry.md`
- **Content:**
  - All system agents listed
  - Roles and responsibilities
  - Model assignments
  - Reporting structure
- **Effort:** Low (copy with formatting)
- **Priority:** MEDIUM

---

### Guide Documents (guides/)

**GUIDE-001: Agent Creation**
- **Source:** `DOC-008_agent_onboarding_lifecycle.md` + FAAILS-008
- **Output:** `guides/agent-creation.md`
- **Content:**
  - Five-phase creation process
  - Design document template
  - Workspace scaffolding
  - Testing and validation
  - Training period
  - Checklist
- **Effort:** Medium
- **Priority:** HIGH (core workflow)

**GUIDE-002: Skill Creation**
- **Source:** `DOC-005_skill_creation_guide.md` + FAAILS-006
- **Output:** `guides/skill-creation.md`
- **Content:**
  - What is a skill (not code, is markdown)
  - File format and structure
  - Lifecycle (creation through deprecation)
  - Versioning
  - Installation and use
  - Examples
- **Effort:** Medium
- **Priority:** MEDIUM

**GUIDE-003: Deployment**
- **Source:** `DOC-002_policies_and_procedures.md` §Deployment section
- **Output:** `guides/deployment.md`
- **Content:**
  - Installation methods (one-line, npm, source)
  - Post-installation setup
  - Configuration options
  - Multi-machine deployment
  - Scaling considerations
  - Troubleshooting
- **Effort:** Medium
- **Priority:** MEDIUM

**GUIDE-004: Security & Hardening**
- **Source:** `DOC-004_security_protocols.md`
- **Output:** `guides/security.md`
- **Content:**
  - Authentication and authorization
  - Credential management
  - Network hardening
  - Audit logging
  - Data protection
  - Compliance checklist
- **Effort:** Medium-High
- **Priority:** MEDIUM

**GUIDE-005: Monitoring & Observability**
- **Source:** `DOC-014_performance_metrics_quality.md`
- **Output:** `guides/monitoring.md`
- **Content:**
  - Key metrics (uptime, task success, cost)
  - Logging and log analysis
  - Dashboards and visualization
  - Alerts and thresholds
  - Performance optimization
- **Effort:** Medium
- **Priority:** LOW

**GUIDE-006: Agent Communication & Conflict Resolution**
- **Source:** `DOC-009_inter_agent_conflict_resolution.md` + FAAILS-009
- **Output:** `guides/conflict-resolution.md`
- **Content:**
  - How disagreements are resolved
  - Escalation paths
  - Authority hierarchy
  - Decision-making examples
- **Effort:** Low (mostly covered in FAAILS-009)
- **Priority:** LOW

**GUIDE-007: System Processes & Operations**
- **Source:** `DOC-003_systems_and_processes.md` (large doc)
- **Output:** `guides/system-processes.md`
- **Content:**
  - Agent lifecycle
  - Ticket lifecycle
  - Vision governance
  - Knowledge management processes
- **Effort:** High (large source doc)
- **Priority:** MEDIUM

---

### Operations Documents (operations/)

**OPS-001: Data Retention & Privacy**
- **Source:** `DOC-010_data_retention_privacy.md`
- **Output:** `operations/data-retention.md`
- **Content:**
  - Data classification (public, private, sensitive)
  - Retention policies by type
  - Deletion procedures
  - Privacy compliance (GDPR, etc.)
  - Audit log retention
- **Effort:** Medium
- **Priority:** MEDIUM

**OPS-002: Disaster Recovery & Backup**
- **Source:** `DOC-011_disaster_recovery_resilience.md`
- **Output:** `operations/disaster-recovery.md`
- **Content:**
  - Backup strategy
  - Recovery procedures
  - RTO/RPO targets
  - Testing and validation
  - Failure scenarios
- **Effort:** Medium
- **Priority:** MEDIUM

**OPS-003: Compliance & Legal**
- **Source:** `DOC-012_compliance_legal.md`
- **Output:** `operations/compliance.md`
- **Content:**
  - Open source licensing (non-commercial free, commercial paid)
  - Legal obligations
  - Intellectual property
  - Export restrictions (if applicable)
  - Audit compliance
- **Effort:** Low
- **Priority:** MEDIUM

**OPS-004: Policies & Procedures**
- **Source:** `DOC-002_policies_and_procedures.md` (large doc)
- **Output:** `operations/policies.md`
- **Content:**
  - Response SLAs
  - Change management
  - Incident procedures
  - Release procedures
  - Escalation policies
- **Effort:** High (large source doc)
- **Priority:** MEDIUM

---

### Knowledge Management (root level)

**KB-001: Knowledge Base Governance**
- **Source:** `DOC-013_knowledge_base_governance.md` + FAAILS-010
- **Output:** `knowledge-base.md`
- **Content:**
  - Knowledge classification
  - Storage and organization
  - Access control
  - Versioning
  - Archival
  - Search and discovery
- **Effort:** Low (mostly covered in FAAILS-010)
- **Priority:** MEDIUM

---

## Conversion Approach

Each conversion follows this template:

```markdown
---
title: [Title]
version: 1.0
owner: DTP_ONXZA_Docs
created: 2026-03-18
status: published
credit_line: present
---

# [Title]

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear 
(AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology 
Products. Using Powerful Anthropic Models, OpenAI Models, and 
Local LLMs.*

---

[Developer-friendly content]

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear 
(AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology 
Products. Using Powerful Anthropic Models, OpenAI Models, and 
Local LLMs.*
```

**Key principles:**
- Clear, developer-friendly language (no internal jargon)
- Concrete examples wherever possible
- Actionable content (not just theory)
- Consistent formatting
- Cross-references to other docs
- Credit line at top and bottom

---

## Effort Estimation

| Category | Count | Effort | Est. Hours |
|---|---|---|---|
| Reference docs | 4 | Low-Medium | 6 |
| Guide docs | 7 | Medium-High | 14 |
| Operations docs | 4 | Medium | 8 |
| Knowledge base | 1 | Low | 2 |
| **TOTAL** | **16** | | **30** |

This assumes:
- 1.5–2 hours per medium-effort doc
- 2–3 hours per high-effort doc (especially DOC-002 and DOC-003 which are large and complex)
- 0.5–1 hour per low-effort doc

---

## Priority for Next Session

**HIGH PRIORITY (Next immediate tasks):**
1. REF-001: Model Selection — frequently referenced, high impact
2. GUIDE-001: Agent Creation — core workflow
3. REF-002: CLI Reference — user-facing, high impact

**MEDIUM PRIORITY (Then do these):**
4. GUIDE-002: Skill Creation
5. OPS-003: Compliance & Legal
6. KB-001: Knowledge Base Governance
7. GUIDE-003: Deployment
8. GUIDE-004: Security

**LOW PRIORITY (After core docs):**
9. GUIDE-005: Monitoring
10. GUIDE-006: Conflict Resolution
11. GUIDE-007: System Processes
12. OPS-001: Data Retention
13. OPS-002: Disaster Recovery
14. OPS-004: Policies & Procedures
15. REF-003: Ticket System Reference
16. REF-004: Agent Registry

---

## Validation

All converted docs must:
- ✅ Pass TORI-QMD validation
- ✅ Include credit line at top and bottom
- ✅ Have clear, developer-friendly language
- ✅ Include concrete examples
- ✅ Include cross-references to related docs
- ✅ Be listed in master README.md

---

## Completion Checklist

- [ ] All 16 conversions completed
- [ ] All files pass TORI-QMD validation
- [ ] All files listed in master README.md
- [ ] Directory structure created (guides/, reference/, operations/)
- [ ] Cross-references verified between all docs
- [ ] Ready for publication to GitHub and docs site

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*
