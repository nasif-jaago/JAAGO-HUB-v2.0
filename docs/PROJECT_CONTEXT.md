# Project Context — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16

## Organization

**JAAGO Foundation** (legal entity: JAAGO Foundation Trust) is a non-profit / NGO operating in Bangladesh. It runs educational programmes, youth development, child welfare, and other social impact initiatives across multiple departments and offices.

**Current system:** Odoo-based internal system branded "JAAGO HUB" — being replaced by this custom ERP.

**Brand:** The "JAAGO HUB" brand is retained in v2.0.

## Why a Custom ERP

- Odoo's generic ERP model does not fit NGO-specific workflows (grant management, donor reporting, programme/project hierarchy, M&E framework)
- Field staff need a mobile-first, low-bandwidth-tolerant experience
- Data ownership and customization without Odoo licensing constraints
- Ability to integrate with Bangladesh-specific government/financial systems

## Default Org Settings (All Configurable)

| Setting | Default | Configurable? |
|---|---|---|
| Timezone | Asia/Dhaka | Yes, per org and per user |
| Currency | BDT (Bangladeshi Taka) | Yes, multi-currency supported |
| Locale | en-BD | Yes, Bangla localization prepared |
| Fiscal Year | July–June (TBC) | Yes, per org |
| Reference patterns | EMP-XXXXXX, PR-YYYY-XXXXXX, etc. | Yes, per org |
| Date format | DD MMM YYYY | Yes, per user |

## Departments (Current — Subject to Change)

From existing JAAGO HUB, the following departments are known:
- Admin & Procurement
- Child Welfare
- Digital & Creative (D&C / DKL)
- Founder's Office (FC)
- Fundraising & Grants
- Impact Investment
- Project Implementation
- Programmes
- Private Sector (PSE)
- Youth Development (YDF)
- MEAL (Monitoring, Evaluation, Accountability & Learning)
- Digital School Project
- JAAGO DIP

## Key Users (Identified from Current System)

- Nasif Kamal — Coordinator, Founder's Office
- IA (Intern Account) — Admin & Logistics Officer, Founder's Office
- Maasoor Rahman — Manager / HR
- F. Islam — Procurement
- I. Ahmed — Programmes
- Y. Ahmed (implied) — Programmes

## Technical Context

- **Current hosting:** Odoo Cloud
- **Target hosting:** Supabase Cloud (PostgreSQL + Auth + Storage) + managed Redis
- **Target deployment:** Docker (docker-compose for local; production TBD)
- **Target users:** 100–2,000 staff across offices in Bangladesh
- **Network reality:** Variable/low bandwidth (field staff on mid-range Android phones)

## MVP Scope

See `/TASKS.md` Phase 5 and the Architecture Package Section O for the full MVP definition.

The MVP must be usable as a **fully responsive PWA** installable on Android home screens before any pilot rollout.

## Out of Scope for MVP

- Odoo Discuss replacement (chat/messaging) — V2 stretch
- Native iOS/Android apps — revisit after 12 months PWA usage data
- Advanced accounting / general ledger / double-entry bookkeeping
- NGO Bureau automated regulatory submissions
- Bangla language UI (prepared, not activated in MVP)
- Biometric attendance hardware integration (manual/GPS only in MVP)
