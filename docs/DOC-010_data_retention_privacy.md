# DATA RETENTION & PRIVACY

> *Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator). Powered by DevGru US Inc. DBA DevGru Technology Products. Using Powerful Anthropic Models, OpenAI Models, and Local LLMs.*

---

**Document ID:** DOC-010  
**Version:** 1.0.0 | **Last Updated:** 2025-03-17 | **Owner:** Marcus  

---

## DATA CLASSIFICATION & RETENTION SCHEDULES

| Data Type | Classification | Retention | Storage | Deletion Method |
|---|---|---|---|---|
| vision.md files | CRITICAL | Indefinite | Local + encrypted backup | Never deleted |
| Aaron's personal data | CRITICAL | Indefinite | Local only | Only on Aaron's instruction |
| Project plans & strategies | SENSITIVE | Indefinite | Local primary | On Aaron's instruction |
| Credentials / secrets | CRITICAL | Rotate every 90 days | Secrets manager only | Immediate on rotation |
| Agent memory (active) | INTERNAL | Indefinite | Local | Archive after 12mo non-access |
| Agent memory (archived) | INTERNAL | 5 years | Local archive | After 5 years |
| Open tickets | INTERNAL | 2 years active | Local | Archive after closure + 2yr |
| Closed tickets | INTERNAL | 5 years | Local archive | After 5 years |
| Session logs | INTERNAL | 1 year active | Local | Archive after 1yr |
| Dashboard logs | OPERATIONAL | 6 months active | Local | Rolling deletion |
| Code repositories | OPERATIONAL | Indefinite | Local + GitHub | On Aaron's instruction |
| Published content | OPERATIONAL | Indefinite | Deployment target | On Aaron's instruction |

## PRIVACY PRINCIPLES

### Personal Data Minimization
No agent collects personal data from users of any project beyond what is required for that project's function. If a project requires user data collection, a privacy review is required before any data collection begins.

### Aaron's Data
Aaron's iMessage conversations with Marcus, his preferences, and his business information are CRITICAL classification. They are stored locally only, never transmitted to external services, and never used to train any model.

### User Data in Managed Projects
For any project that collects end-user data:
1. Privacy policy must exist before launch
2. Data collection must be disclosed
3. Users must have ability to request deletion
4. Data must be stored securely per DOC-004
5. International compliance must be reviewed per DOC-012

## DATA DELETION PROCESS
When data is to be deleted:
1. Ticket type: `data_deletion_request` with: what data, why, who authorized
2. Backup verified (if data has a backup that should also be deleted)
3. Deletion performed
4. Deletion logged with: what was deleted, when, by whom, why
5. Git history purged if sensitive data was ever committed (using BFG or git-filter-repo)
