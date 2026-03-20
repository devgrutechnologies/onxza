---
doc_id: ONXZA-DOC-012
title: Compliance and Legal
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: compliance, legal, gdpr, ccpa, privacy, ip, ai-disclosure, international
summary: Compliance framework for ONXZA-managed projects. When compliance reviews are required, key regulatory frameworks (GDPR, CCPA, CAN-SPAM, AI disclosure), the compliance review process, and intellectual property guidelines.
---

# ONXZA Compliance and Legal

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Disclaimer

This document provides operational compliance guidance for ONXZA-managed systems. **It is not legal advice.** Consult qualified legal counsel for any specific legal question. This document is a framework for agents to flag and escalate compliance concerns — not to resolve them independently.

---

## Section 1 — When Compliance Reviews Are Required

Any of the following triggers an immediate compliance review before the project proceeds:

- Project launches a product or service available to users in any country
- Project collects any personal data from users
- Project handles financial transactions
- Project creates or distributes content in regulated categories (health, finance, legal, food)
- Project operates under a brand or business entity in any jurisdiction
- Project employs or contracts with individuals in any jurisdiction
- Project uses AI-generated content in regulated contexts

**Default:** Flag first, proceed after review. Never proceed and flag later.

---

## Section 2 — Key Regulatory Frameworks

### GDPR (European Union)

**Applies when:** The project handles personal data of EU residents, regardless of where the project is based.

**Key requirements:**
- Lawful basis for data processing (consent, contract, legitimate interest, etc.)
- Privacy policy in clear, plain language
- User rights: access, rectification, erasure, portability, objection
- Data breach notification within 72 hours of discovery
- Data Processing Agreements with third-party processors
- No transfer of personal data outside the EU/EEA without appropriate safeguards

**Minimum implementation before launch:**
- [ ] Privacy policy live
- [ ] Cookie consent (if applicable)
- [ ] Contact method for user rights requests
- [ ] Data retention schedule documented

---

### CCPA (California, USA)

**Applies when:** A for-profit business collects personal data of California residents above certain thresholds.

**Key requirements:**
- Right to know what data is collected and how it is used
- Right to delete personal data
- Right to opt out of the sale of personal data
- Non-discrimination for exercising privacy rights
- Privacy policy disclosures (categories of data, purposes, third parties)

---

### PIPEDA (Canada)

**Applies when:** The project collects personal data of Canadian residents for commercial purposes.

**Key requirements:**
- Consent for collection, use, and disclosure
- Limiting collection to what is necessary
- Appropriate security safeguards
- User right to access and correct their data

---

### CAN-SPAM and CASL (Email Marketing)

**Applies when:** Any project sends commercial email.

| Law | Jurisdiction | Key Requirements |
|---|---|---|
| CAN-SPAM | USA | Identify as commercial, include physical address, include opt-out, honor opt-outs within 10 business days |
| CASL | Canada | Explicit or implied consent required, clearly identify the sender, easy unsubscribe mechanism |

**Default:** Implement both for any email program. Do not rely on the distinction between recipients' locations.

---

### AI Content Disclosure

**Status:** Required now in several jurisdictions; expanding globally.

| Context | Requirement |
|---|---|
| EU AI Act | Certain AI-generated content must be labeled as AI-generated |
| FTC guidance (USA) | AI-generated endorsements and testimonials must be disclosed |
| YouTube | AI-generated content that could be mistaken for real must be flagged |
| Instagram / Meta | AI-generated content disclosure required for realistic synthetic media |

**Default policy:** Disclose AI-generated content on any platform that requires it or where users might be misled. Do not wait for legal requirement — disclose proactively.

---

## Section 3 — Compliance Review Process

When a compliance trigger is identified:

1. Agent flags it with a `compliance_flag` ticket.
2. PM escalates to Orchestrator.
3. Orchestrator notifies the primary agent.
4. Primary agent surfaces to owner with:
   - What the compliance issue is
   - Which jurisdiction applies
   - What is required to be compliant
   - Risk of non-compliance (low / medium / high / critical)
5. Owner decides: address it, consult legal counsel, or pause the project.
6. Resolution documented in `project-context.md`.
7. Compliance checklist maintained at `projects/[slug]/pm/compliance.md`.

**No project launches with an unresolved high or critical compliance flag.**

---

## Section 4 — Intellectual Property

### Content Created by ONXZA Agents

- All content, code, and designs produced by ONXZA agents are the intellectual property of the system owner.
- When AI-generated content is published publicly, appropriate disclosure is made per platform requirements and applicable law.
- The credit line (Imagined by Aaron Gear / Created by Aaron Gear and Marcus Gear) is preserved on all ONXZA-specific outputs.

### Third-Party Content

- No agent may reproduce copyrighted content without a license or proper attribution.
- Open source licenses are tracked per project. `LICENSE` files are maintained in all code repos.
- If a project incorporates open source code, the license terms are honored fully.

### Trademarks

- Brand names, logos, and trademarks created for projects are recorded in `project-context.md`.
- Before using any third-party brand name in project content, trademark implications are checked.
- No agent uses a competitor's trademark in a way that implies affiliation or endorsement.

---

## Section 5 — Affiliate and Partnership Compliance

For projects using affiliate marketing:

- **FTC disclosure** (USA): All affiliate relationships must be disclosed clearly in any content containing affiliate links. The disclosure must be clear, conspicuous, and near the link — not in a footer.
- **Platform policies**: Each affiliate platform (Amazon, AWIN, CJ, etc.) has its own terms. Agents managing those platforms must have read and understood those terms.
- **AI content disclosure**: If a platform requires AI content disclosure and an agent wrote the content, disclose it.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*
