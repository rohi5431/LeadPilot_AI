# LeadPilot AI — System Workflow & Implementation Tasks

## Contents

1. [Overview](#1-overview)
2. [Core Tasks](#2-core-tasks)
3. [Workflows](#3-workflows)
4. [Validation & Error Handling](#4-validation--error-handling)
5. [Module Responsibilities](#5-module-responsibilities)
6. [Testing & Verification](#6-testing--verification)
7. [Limitations](#7-limitations)
8. [Future Extensions](#8-future-extensions-planned--not-implemented)
9. [Cross-references](#9-cross-references)

---

## 1. Overview

LeadPilot AI runs a continuous lead-processing workflow:

1. A lead is submitted through `LeadForm.tsx`.
2. The backend validates it (Pydantic) and stores it in memory.
3. The lead is sent to the Gemini API (`ai_service.py`), which returns a 6-part JSON analysis plus a 0–100 priority score (`HOT` / `WARM` / `COLD`).
4. `GET /api/leads` returns leads sorted by score.
5. From a lead's page, the salesperson can chat with a lead-isolated AI assistant (`chat_service.py`) and generate a 7-section **AI Call Prep** brief (`call_prep_service.py`).

---

## 2. Core Tasks

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
| 10 | Testing & Build Verification | 47 unit tests, E2E suite, frontend build check | `backend/app/tests/` |

---

## 3. Workflows

### 3.1 Lead Creation

```
User Fills Form ──► Frontend Validation (LeadForm.tsx) ──► POST /api/leads
                                                                │
                                                                ▼
                                                   Pydantic Schema Validation
                                                   (app/schemas/lead.py)
                                                                │
                                                                ▼
                                                   Store in leads_db
                                                   (app/services/lead_service.py)
                                                                │
                                                                ▼
                                                   Trigger Gemini AI Analysis
                                                   (app/services/ai_service.py)
                                                                │
                                           ┌────────────────────┴───────────────────┐
                                           ▼                                        ▼
                                [ Success: Gemini JSON ]                 [ Exception: Timeout ]
                                           │                                        │
                                           ▼                                        ▼
                                Attach LeadAnalysis to Lead              Set ai_analysis = None
                                           │                                        │
                                           └────────────────────┬───────────────────┘
                                                                ▼
                                                    Return LeadResponse (201)
```

- **Frontend**: `frontend/src/components/LeadForm.tsx`
- **Endpoint**: `POST /api/leads` (router: `backend/app/api/leads.py`)
- **Services**: `lead_service.py`, `ai_service.py`

### 3.2 AI Analysis

1. `LeadCreate` data is passed to `ai_service.generate_lead_analysis()`.
2. `build_lead_analysis_prompt()` formats the lead information and injects strict grounding rules.
3. `client.models.generate_content()` is called with `response_mime_type="application/json"` and `response_schema=LeadAnalysis`.
4. The model returns a 6-part analysis plus score and priority:

| Field | Description |
|-------|-------------|
| `lead_summary` | Overview of buyer persona |
| `customer_intent` | Primary acquisition goal |
| `key_requirements` | List of extracted preferences |
| `objections_concerns` | Identified hesitations or information gaps |
| `recommended_next_action` | Immediate step for the representative |
| `suggested_response` | Draft message for the client |
| `priority_score` | Integer `0–100` |
| `priority` | Enum: `HOT` / `WARM` / `COLD` |

### 3.3 Prioritization

```
Gemini Evaluates Budget, Timeline & Requirements ──► Computes priority_score (0–100)
                                                             │
                                                             ▼
                                                Assigns Priority Category:
                                                - HOT  (80–100)
                                                - WARM (50–79)
                                                - COLD (0–49)
                                                             │
                                                             ▼
                                                GET /api/leads sorts leads_db
                                                by priority_score DESCENDING
                                                             │
                                                             ▼
                                                Salesperson sees highest priority
                                                leads at top of LeadsPage.tsx
```

### 3.4 Lead Details

- **Route**: `/leads/:leadId` → `frontend/src/pages/LeadDetailsPage.tsx`
- **API**: `GET /api/leads/{id}`
- **Sub-components**:
  - `LeadCard`: contact details, requirements, budget, timeline, customer message
  - `LeadAnalysisCard`: priority badge, score progress bar, 6-part AI breakdown
  - `CallPrepCard`: trigger button and 7-section brief
  - `LeadChatCard`: grounded conversational assistant

### 3.5 Contextual Chat

```
Salesperson Types Question ──► POST /api/leads/{id}/chat
                                     │
                                     ▼
                      Fetch Lead & Existing Chat History from chat_db[lead_id]
                                     │
                                     ▼
                      Construct Grounded Prompt (app/prompts/lead_chat.py)
                                     │
                                     ▼
                      Execute Gemini Model Request ──► Receive Response
                                     │
                                     ▼
                      Append User & Assistant Messages to chat_db[lead_id]
                                     │
                                     ▼
                      Return ChatResponse JSON ──► Render in LeadChatCard.tsx
```

- **Isolation**: `chat_db: dict[str, list[ChatMessage]]` is keyed strictly by `lead_id`. E2E tests verify zero cross-lead leakage.

### 3.6 AI Call Prep

1. Salesperson clicks **"Prepare Me for Call"** in `CallPrepCard.tsx`.
2. Frontend sends `POST /api/leads/{leadId}/call-prep`.
3. `call_prep_service.generate_call_prep()` verifies the lead exists (`404`) and `ai_analysis` is not null (`422`).
4. `app/prompts/call_prep.py` compiles lead info, analysis, priority score, and chat context.
5. Gemini returns structured JSON matching the `CallPrep` Pydantic schema:
   - Call Objective
   - Key Talking Points (3–6 bullets)
   - Likely Objection
   - Suggested Objection Handling
   - Questions to Ask (3–4 natural-language questions)
   - Suggested Opening
   - Desired Outcome
6. `CallPrepCard.tsx` renders the brief.

---

## 4. Validation & Error Handling

| Scenario | Trigger | Handled By | Outcome |
|----------|---------|------------|---------|
| Invalid mobile/email | Non-Indian number or malformed email | Pydantic `LeadCreate` | `422 Unprocessable Entity` |
| Missing lead | Invalid or unknown lead ID | `get_lead_by_id` in router | `404 Not Found` |
| Call Prep without analysis | `ai_analysis` is `None` | `call_prep_service.py` | `422` ("AI analysis required first") |
| Gemini timeout / interruption | Network outage or bad API key | `ai_service.py` try/except | Partial success: lead saved with `ai_analysis=None` |
| Re-run AI analysis | User clicks "Retry AI Analysis" | `POST /api/leads/{id}/retry` | `200`: Gemini retried, analysis attached |
| Chat API downtime | Gemini failure during chat | `chat_service.py` | `503` ("AI assistant temporarily unavailable") |

---

## 5. Module Responsibilities

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
| `config.py` | Environment config (`GEMINI_API_KEY`, `GEMINI_MODEL`, `BACKEND_CORS_ORIGINS`) |
| `schemas/` | Pydantic schemas: `lead.py`, `lead_analysis.py`, `chat.py`, `call_prep.py` |
| `services/` | Core logic: `lead_service.py`, `ai_service.py`, `chat_service.py`, `call_prep_service.py` |
| `prompts/` | Prompt generators (see below) |

### Prompts (`backend/app/prompts/`)

| File | Instructs the model to |
|------|------------------------|
| `lead_analysis.py` | Analyze the raw lead message, extract buyer requirements, highlight explicit hesitations, compute a 0–100 priority score |
| `lead_chat.py` | Answer strictly from lead details and session history; refuse to hallucinate unstated facts |
| `call_prep.py` | Format a 7-section briefing with 3–4 natural discovery questions; no financing assumptions unless explicitly requested |

---

## 6. Testing & Verification

| Suite | Command | Coverage |
|-------|---------|----------|
| Backend unit tests | `python -m pytest backend/app/tests -v` | 47 passing tests (below) |
| E2E live | `python backend/app/tests/test_e2e_live.py` | 11-step integration against live FastAPI server and Gemini API |
| Frontend build | `npm run build` | TypeScript compile (`tsc -b`) and Vite bundle, 0 errors |

Backend test files:
- `test_call_prep.py`: mobile number regex, email regex, backward compatibility
- `test_contact_info.py`: Call Prep schema generation, missing-analysis exception handling
- `test_lead_analysis_schema.py`: 0–100 score constraints, priority category validation

---

## 7. Limitations

- **Volatile storage**: data lives in Python memory (`leads_db`, `chat_db`); restarting the backend wipes all session data.
- **Network dependency**: AI features need internet access and valid Gemini API credentials.
- **Sequential prerequisite**: Call Prep requires AI analysis to exist first.

---

## 8. Future Extensions *(Planned / Not Implemented)*

- **Persistent database**: PostgreSQL or MongoDB via SQLAlchemy / Motor
- **Authentication & RBAC**: JWT-based auth for sales managers and reps
- **CRM integrations**: two-way sync with HubSpot, Salesforce, or LeadSquared
- **Multi-channel communication**: WhatsApp webhooks and IVR calling triggers

---

## 9. Cross-references

- Product & business requirements: [`PRD.md`](./PRD.md)
- System architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
