# COMPLIANCE & LEGAL

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-012  
**Version:** 1.0.0 | **Last Updated:** 2025-03-17 | **Owner:** Marcus  

---

## DISCLAIMER
This document provides operational compliance guidance for the OpenClaw system. It is not legal advice. Aaron should consult qualified legal counsel for any specific legal question. This document is a framework for agents to flag and escalate compliance concerns — not to resolve them.

---

## SECTION 1 — COMPLIANCE TRIGGER EVENTS
Any of the following requires an immediate compliance review before proceeding:

- Project launches a product or service available to users in any country
- Project collects any personal data from users
- Project handles financial transactions
- Project creates or distributes content in regulated categories (health, finance, legal, food)
- Project operates under a brand or business entity in any jurisdiction
- Project employs or contracts with individuals in any jurisdiction
- Project uses AI-generated content in regulated contexts

## SECTION 2 — KEY REGULATORY FRAMEWORKS

### GDPR (European Union)
**Applies when:** Project handles personal data of EU residents, regardless of where the project operates.  
**Key requirements:**
- Lawful basis for data processing
- Privacy policy (clear, plain language)
- User rights: access, rectification, erasure, portability
- Data breach notification within 72 hours
- Data Processing Agreements with processors
- No transfer of personal data outside EU/EEA without appropriate safeguards

### CCPA (California, USA)
**Applies when:** For-profit business collecting personal data of California residents above certain thresholds.  
**Key requirements:**
- Right to know what data is collected
- Right to delete personal data
- Right to opt out of data sale
- Non-discrimination for exercising rights
- Privacy policy disclosures

### PIPEDA (Canada)
**Applies when:** Project collects personal data of Canadian residents for commercial purposes.  
**Key requirements:**
- Consent for collection, use, and disclosure
- Limiting collection to what's necessary
- Appropriate safeguards
- Right to access and correction

### CAN-SPAM / CASL (Email Marketing)
**Applies when:** Any project sends commercial email.  
**Key requirements:**
- CAN-SPAM (USA): Identify as commercial, include opt-out, honor opt-outs within 10 days
- CASL (Canada): Explicit or implied consent required, identify sender, easy unsubscribe

### AI Content Disclosure
**Emerging / applies now in some jurisdictions:**
- EU AI Act (in force): Certain AI-generated content must be labeled
- FTC guidance (USA): AI-generated endorsements and testimonials must be disclosed
- Platform policies (YouTube, Instagram, etc.): AI-generated content disclosure required

## SECTION 3 — COMPLIANCE REVIEW PROCESS

When a compliance trigger event is identified:
1. Agent flags it with ticket type `compliance_flag`
2. PM escalates to Orchestrator
3. Orchestrator notifies Marcus
4. Marcus surfaces to Aaron with: what the compliance issue is, which jurisdiction, what is required, risk of non-compliance
5. Aaron decides: address it, consult legal, or pause project
6. Resolution documented in project-context.md
7. Compliance checklist maintained per project in `/openclaw/agents/projects/[slug]/pm/compliance.md`

## SECTION 4 — INTELLECTUAL PROPERTY

### Content Created by OpenClaw Agents
- All content, code, designs produced by OpenClaw agents are Aaron's intellectual property
- When AI-generated content is published publicly, appropriate disclosure is made per platform requirements

### Third-Party Content
- No agent may reproduce copyrighted content without license or proper attribution
- Open source licenses must be tracked per project (LICENSE files maintained)
- If a project incorporates open source code, the license terms are honored

### Trademarks
- Brand names, logos, and trademarks created for projects are noted in project-context.md
- Before using any third-party brand name in project content, check for trademark implications
