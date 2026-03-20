---
doc_id: ONXZA-DOC-010
title: Data Retention and Privacy
version: 1.0.0
status: stable
created: 2026-03-17
last_updated: 2026-03-17
tags: data, retention, privacy, gdpr, deletion, classification, compliance
summary: Data classification, retention schedules, privacy principles, and deletion procedures for ONXZA installations. How data is protected, how long it is kept, and how it is safely removed.
---

# ONXZA Data Retention and Privacy

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

**Version:** 1.0.0

---

## Data Classification and Retention Schedules

| Data Type | Classification | Retention | Storage | Deletion Method |
|---|---|---|---|---|
| `vision.md` files | CRITICAL | Indefinite | Local + encrypted backup | Never deleted |
| Owner personal data | CRITICAL | Indefinite | Local only | Only on owner's explicit instruction |
| Project plans and strategies | SENSITIVE | Indefinite | Local primary | On owner's instruction |
| Credentials / secrets | CRITICAL | Rotate every 90 days | Secrets manager only | Immediate on rotation |
| Agent memory (active) | INTERNAL | Indefinite | Local | Archive after 12 months of non-access |
| Agent memory (archived) | INTERNAL | 5 years | Local archive | After 5 years |
| Open tickets | INTERNAL | 2 years active | Local | Archive after closure + 2 years |
| Closed tickets | INTERNAL | 5 years | Local archive | After 5 years |
| Session logs | INTERNAL | 1 year active | Local | Archive after 1 year |
| Dashboard / operational logs | OPERATIONAL | 6 months active | Local | Rolling deletion |
| Code repositories | OPERATIONAL | Indefinite | Local + GitHub | On owner's instruction |
| Published content | OPERATIONAL | Indefinite | Deployment target | On owner's instruction |

---

## Privacy Principles

### Personal Data Minimization
No agent collects personal data from users of any project beyond what is required for that project's function. If a project requires user data collection, a privacy review is required before any data collection begins.

### Owner Data
The owner's conversations with agents, their preferences, and their business information are CRITICAL classification. Stored locally only. Never transmitted to external services. Never used to train any model.

### User Data in Managed Projects
For any project that collects end-user data:
1. Privacy policy must exist before launch.
2. Data collection must be disclosed to users.
3. Users must have the ability to request deletion.
4. Data must be stored securely per the [Security Protocols](security-protocols.md).
5. International compliance reviewed per the [Compliance and Legal](compliance-legal.md) document.

---

## Data Deletion Process

When data is to be deleted:

1. Create a `data_deletion_request` ticket with:
   - What data is being deleted
   - Why it is being deleted
   - Who authorized the deletion
2. Verify that backups referencing this data are also addressed.
3. Perform deletion.
4. Log the deletion: what was deleted, when, by whom, and why.
5. If sensitive data was ever committed to Git: purge from Git history using `git-filter-repo`.

**Deletion is logged even when the data itself is gone.** The record of what was deleted and when is permanent.

---

## Data Classification Definitions

| Classification | Description | Examples |
|---|---|---|
| **CRITICAL** | Loss or exposure causes irreversible harm | Credentials, financial data, owner personal data, `vision.md` |
| **SENSITIVE** | Loss or exposure causes significant harm | Business strategy, client data, project vision docs |
| **INTERNAL** | Operational data needed for system function | Agent memory, tickets, logs |
| **OPERATIONAL** | Code and content used in normal operations | Source code, blog posts, published assets |

---

## Backup and Recovery

- **Local filesystem** is the primary source of truth.
- **GitHub** is the backup — public repos contain only ONXZA/FAAILS code (no internal operational data).
- CRITICAL data never leaves local storage unencrypted.
- Git history retains all previous versions of non-sensitive files indefinitely.

---

## User Rights (for projects with end-user data)

Any project collecting user data must support:
- **Right to access:** Users can request a copy of their data.
- **Right to rectification:** Users can request corrections.
- **Right to erasure:** Users can request deletion.
- **Right to portability:** Users can request their data in a portable format.
- **Right to object:** Users can opt out of certain processing.

Implement these before launch, not after a user asks.

---

*Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*
