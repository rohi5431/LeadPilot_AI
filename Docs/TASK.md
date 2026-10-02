# LeadPilot AI: Implementation Tasks

This document lists the implementation tasks, the files that deliver them, and how each is verified. For product requirements see [`PRD.md`](./PRD.md); for system design, data contracts, API reference, and error handling see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Contents

1. [Core Tasks](#1-core-tasks)
2. [Implementation Steps](#2-implementation-steps)
3. [File Responsibilities](#3-file-responsibilities)
4. [Testing & Verification](#4-testing--verification)
5. [Future Extensions](#5-future-extensions-planned--not-implemented)

---

## 1. Core Tasks

| # | Task | Responsibility | Key Files |
|---|------|----------------|-----------|
| 1 | Lead Intake | Capture and validate 8 fields: Name, Mobile, Email, Location, Requirement, Budget, Timeline, Message | `LeadForm.tsx`, `schemas/lead.py` |
| 2 | In-Memory Storage | Thread-safe volatile storage in `leads_db` and `chat_db` | `lead_service.py` |
| 3 | AI Lead Analysis | Call Gemini to extract summary, intent, requirements, objections, next action, suggested reply | `ai_service.py`, `prompts/lead_analysis.py` |
| 4 | Priority Generation | Compute 0–100 score and assign `HOT` / `WARM` / `COLD` | `ai_service.py` |
| 5 | Prioritized Lead Listing | Render a responsive list sorted by priority score | `LeadsPage.tsx`, `GET /api/leads` |
| 6 | Lead Details Navigation | Route to individual lead pages | `/leads/:leadId`, `LeadDetailsPage.tsx` |
| 7 | Lead-Isolated Chat | Answer questions grounded in lead data and session history, with no cross-lead leakage | `chat_service.py`, `prompts/lead_chat.py`, `LeadChatCard.tsx` |
| 8 | AI Call Prep | Produce a 7-section briefing for the sales call | `call_prep_service.py`, `prompts/call_prep.py`, `CallPrepCard.tsx` |
| 9 | Validation & Retry | Handle missing data, invalid formats, 404s, API timeouts; offer 1-click AI retry | `POST /api/leads/{id}/retry` |
| 10 | Testing & Build Verification | Unit tests, E2E suite, frontend build check | `backend/app/tests/` |

---

## 2. Implementation Steps

### 2.1 Lead creation (Tasks 1–2)

1. `LeadForm.tsx` runs frontend validation and sends `POST /api/leads` (router: `backend/app/api/leads.py`).
2. `app/schemas/lead.py` validates the payload.
3. `lead_service.py` stores the lead in `leads_db`.
4. `ai_service.py` is triggered; on success the analysis is attached, on exception `ai_analysis` stays `None`.
5. The router returns `LeadResponse` (201).

### 2.2 AI analysis and priority (Tasks 3–4)

1. `LeadCreate` data is passed to `ai_service.generate_lead_analysis()`.
2. `build_lead_analysis_prompt()` formats the lead information and injects the grounding rules.
3. `client.models.generate_content()` is called with `response_mime_type="application/json"` and `response_schema=LeadAnalysis`.
4. The returned `priority_score` and `priority` are stored on the lead.

### 2.3 Listing and details (Tasks 5–6)

1. `GET /api/leads` sorts `leads_db` by `priority_score` descending; `LeadsPage.tsx` renders the result.
2. Route `/leads/:leadId` loads `LeadDetailsPage.tsx`, which calls `GET /api/leads/{id}` and composes:
   - `LeadCard`: contact details, requirements, budget, timeline, customer message
   - `LeadAnalysisCard`: priority badge, score progress bar, 6-part AI breakdown
   - `CallPrepCard`: trigger button and 7-section brief
   - `LeadChatCard`: grounded conversational assistant

### 2.4 Contextual chat (Task 7)

1. `LeadChatCard.tsx` sends `POST /api/leads/{id}/chat`.
2. `chat_service.py` fetches the lead and `chat_db[lead_id]`.
3. `app/prompts/lead_chat.py` builds the grounded prompt; Gemini is called.
4. User and assistant messages are appended to `chat_db[lead_id]` and the `ChatResponse` is rendered.

### 2.5 AI Call Prep (Task 8)

1. The salesperson clicks **"Prepare Me for Call"** in `CallPrepCard.tsx`, which sends `POST /api/leads/{leadId}/call-prep`.
2. `call_prep_service.generate_call_prep()` checks the lead exists (`404`) and `ai_analysis` is not null (`422`).
3. `app/prompts/call_prep.py` compiles lead info, analysis, priority score, and chat context.
4. Gemini returns JSON matching the `CallPrep` schema, and `CallPrepCard.tsx` renders it.

### 2.6 Validation and retry (Task 9)

1. Invalid input and missing-lead handling are implemented in `schemas/lead.py` and `get_lead_by_id` in the router.
2. `ai_service.py` wraps Gemini calls in try/except; `chat_service.py` returns `503` ("AI assistant temporarily unavailable") on chat failure.
3. `POST /api/leads/{id}/retry` re-runs the analysis and attaches it on success.

Status codes and resilience behavior are listed in [`ARCHITECTURE.md`](./ARCHITECTURE.md) section 8.

---

## 3. File Responsibilities

### Frontend (`frontend/src/`)

| File | Responsibility |
|------|----------------|
| `LeadForm.tsx` | Input form for 8 lead fields with inline regex validation and error states |
| `LeadCard.tsx` | Contact details, requirement attributes, budget/timeline badges |
| `LeadAnalysisCard.tsx` | Priority score bar, priority badge, 6-section AI analysis |
| `LeadChatCard.tsx` | Chat widget with contextual follow-up Q&A and message history |
| `CallPrepCard.tsx` | Action button and 7-section call prep container |
| `AppHeader.tsx` | Responsive navigation bar with app title and route links |

### Backend (`backend/app/`)

| Path | Responsibility |
|------|----------------|
| `main.py` | FastAPI init, CORS middleware, route mounting |
| `schemas/` | Pydantic schemas: `lead.py`, `lead_analysis.py`, `chat.py`, `call_prep.py` |

Services, prompts, and config responsibilities are in [`ARCHITECTURE.md`](./ARCHITECTURE.md) sections 3 and 5.

---

## 4. Testing & Verification

| Suite | Command | Coverage |
|-------|---------|----------|
| Backend unit tests | `python -m pytest backend/app/tests -v` | 47 passing tests |
| E2E live | `python backend/app/tests/test_e2e_live.py` | 11-step integration against the live FastAPI server and Gemini API; verifies zero cross-lead chat leakage |
| Frontend build | `npm run build` | TypeScript compile (`tsc -b`) and Vite bundle, 0 errors |

Backend test files (`backend/app/tests/`):

- `test_call_prep.py`: `CallPrep` schema validation, `MissingAnalysisError` guard
- `test_contact_info.py`: mobile number regex, email regex, backward compatibility
- `test_lead_analysis_schema.py`: 0–100 score bounds, priority category literals

---

## 5. Future Extensions *(Planned / Not Implemented)*

- **Persistent database:** PostgreSQL or MongoDB via SQLAlchemy / Motor
- **Authentication & RBAC:** JWT-based auth for sales managers and reps
- **CRM integrations:** two-way sync with HubSpot, Salesforce, or LeadSquared
- **Multi-channel communication:** WhatsApp webhooks and IVR calling triggers
