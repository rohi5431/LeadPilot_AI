# LeadPilot AI

> AI-powered real-estate lead prioritization and sales assistant.

LeadPilot AI helps real-estate salespeople turn inbound lead information into structured sales intelligence. It uses Gemini to analyze customer intent, requirements, concerns, priority, and recommended actions, while providing a contextual AI assistant and AI-powered call preparation.

---

## 🔗 Demo & Repository

- **Live Demo:** `YOUR_LIVE_URL_HERE`
- **GitHub Repository:** `YOUR_GITHUB_REPOSITORY_URL`

> The final submission is intended to provide a public live URL that can be opened without local setup.

---

## 1. Overview

### Problem Statement
A real-estate salesperson receives multiple inbound property enquiries daily across web forms, emails, and messaging apps. Evaluating these enquiries manually is slow, inefficient, and leads to delayed responses. A salesperson needs to quickly understand:

- What the customer wants (property type, size, location)
- Their budget
- Their buying timeline
- Customer intent (end-use homebuyer vs investor)
- Explicit concerns or objections
- Which leads require urgent attention
- What tactical action should happen next

LeadPilot AI converts raw lead enquiry text into structured AI-generated sales intelligence, enabling sales representatives to prioritize high-intent buyers instantly and prepare effectively before dialing.

### Product Workflow

```text
Inbound Lead
     ↓
Lead Intake Form
     ↓
Gemini AI Analysis
     ↓
Structured Sales Intelligence
     ↓
AI Priority Score (0–100)
     ↓
Priority Classification (HOT / WARM / COLD)
     ↓
Prioritized Lead List
     ↓
Lead Detail View
     ├── 6-Point AI Analysis
     ├── AI Call Prep Briefing
     └── Contextual Grounded AI Assistant
     ↓
Salesperson Action & Phone Call
```

---

## 2. Features & Assignment Coverage

| Feature Requirement | Status | Implementation Details |
|---|---|---|
| **Multiple Lead Storage** | ✅ Complete | In-memory storage (`_leads: dict[str, LeadResponse]`) supporting multiple leads simultaneously. |
| **Dynamic Priority Scoring** | ✅ Complete | Quantitative `priority_score` (0–100) computed by Gemini based on budget clarity, timeline urgency, and requirement specificity. |
| **Priority Categorization** | ✅ Complete | Categorical tags: `HOT` (80–100), `WARM` (50–79), and `COLD` (0–49). |
| **Pre-Sorted Lead List** | ✅ Complete | `GET /api/leads` automatically pre-sorts leads by `priority_score` descending (highest priority first). |
| **Interactive Filtering & Search** | ✅ Complete | Client-side filter pills (`ALL`, `HOT`, `WARM`, `COLD`), search query matching, and multi-criteria sorting. |
| **6-Part AI Analysis Breakdown** | ✅ Complete | Returns Lead Summary, Customer Intent, Key Requirements, Objections/Concerns, Recommended Next Action, and Suggested Response. |
| **Contextual AI Chat Assistant** | ✅ Complete | Grounded Q&A chatbot isolated per lead ID (`chat_db: dict[str, list[ChatMessage]]`). |
| **Custom Feature: AI Call Prep** | ✅ Complete | 1-click **"Prepare Me for Call"** generating a 7-section structured briefing (objectives, talking points, objections, handling, discovery questions, opening line, outcome). |
| **Network Interrupt Resilience** | ✅ Complete | Preserves lead intake payload if AI drops offline (`ai_analysis = None`, HTTP 201) and exposes a 1-click `POST /api/leads/{id}/retry` endpoint. |

### Custom Signature Feature: AI Call Preparation Briefing
Before placing a phone call to a lead, sales representatives often spend time reviewing past notes and guessing what objections might arise. LeadPilot AI features a signature **AI Call Prep** generator that produces a 7-section structured briefing in under 2 seconds:

1. **Call Objective**: Single-sentence primary goal for the call.
2. **Key Talking Points**: 3–6 tailored bullet points referencing actual customer requirements.
3. **Likely Objection**: Grounded potential customer pushback based on their message.
4. **Suggested Objection Handling Strategy**: Direct tactical strategy to resolve the objection.
5. **Questions to Ask**: Exactly 3–4 natural discovery questions to clarify missing details.
6. **Suggested Opening Line**: Personalized greeting incorporating lead context.
7. **Desired Call Outcome**: Specific targeted result by call end.

### Network Interruption Resilience & 1-Click AI Retry
If network connectivity drops or the Gemini API times out during lead creation, LeadPilot AI ensures data integrity:
1. **Data Preservation**: The raw lead payload is stored in memory (`ai_analysis = None`) and returned with HTTP 201 Created.
2. **1-Click Retry UI**: The lead detail view detects missing analysis and displays a `🔄 Retry AI Analysis` banner, triggering `POST /api/leads/{id}/retry` once connectivity is restored.

---

## 3. Gemini Integration & AI Architecture

- **Official SDK**: Built using Google's official `google-genai` Python SDK (`google.genai`).
- **Configured Model**: Defaults to `gemini-3.5-flash-lite` (configurable via `GEMINI_MODEL` environment variable).
- **Native Structured JSON Output**: Utilizes Gemini's native `response_mime_type="application/json"` combined with Pydantic `response_schema` definitions (`LeadAnalysis` and `CallPrep`). This guarantees strict JSON output conforming to backend schemas without fragile regex markdown parsing.
- **Server-Side API Key Isolation**: The `GEMINI_API_KEY` is managed exclusively on the backend via `pydantic-settings` in `backend/app/config.py`. It is never exposed in API responses or frontend environment bundles.

---

## 4. System Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────┐
│              Browser Client (React 18 SPA)              │
│       Vite · React Router v6 · Tailwind CSS · TypeScript │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / JSON (REST)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 FastAPI Backend Server                  │
│        Uvicorn ASGI · Pydantic Schemas · Python 3.12    │
├────────────────────────────┬────────────────────────────┤
│       Service Layer        │      In-Memory State       │
│  - lead_service.py         │  - _leads: dict[str, Lead] │
│  - ai_service.py           │  - _chat_history: dict     │
│  - chat_service.py         │                            │
│  - call_prep_service.py    │                            │
└────────────────────────────┴─────────────┬──────────────┘
                                           │ HTTPS (google-genai SDK)
                                           ▼
                             ┌────────────────────────────┐
                             │      Google Gemini API     │
                             │   gemini-3.5-flash-lite    │
                             └────────────────────────────┘
```

### Request Lifecycle
1. **Lead Intake**: Client submits lead data via `POST /api/leads`. Pydantic validates input schemas (mobile number regex: 10–12 digits, email regex).
2. **Persistence**: Lead is stored in the volatile `_leads` dictionary.
3. **AI Orchestration**: `ai_service.py` constructs a grounded prompt and invokes `client.models.generate_content` with `response_schema=LeadAnalysis`.
4. **Analysis & Ranking**: The structured output (`priority_score`, `priority`, 6 analysis fields) is attached to the lead.
5. **Prioritized Retrieval**: `GET /api/leads` sorts stored leads by `priority_score` descending before returning JSON to the client.
6. **Contextual Operations**: `POST /api/leads/{id}/chat` loads lead history from `_chat_history[lead_id]`, sends full grounded context to Gemini, and appends user/assistant messages. `POST /api/leads/{id}/call-prep` checks analysis prerequisite and returns the 7-section briefing.

---

## 5. Technical Decisions & Trade-offs

| Decision | Selected Option | Alternative Considered | Rationale |
|---|---|---|---|
| **Backend Framework** | **FastAPI** | Django / Flask | High async performance, automatic OpenAPI documentation, and native Pydantic schema validation matching Gemini SDK requirements. |
| **Frontend Stack** | **React + TypeScript + Vite** | Next.js / Vanilla JS | Fast HMR dev loop, lightweight SPA bundling, and strict type alignment between backend models and frontend interfaces. |
| **Storage Architecture** | **In-Memory Volatile Storage** | PostgreSQL / SQLite | Zero database dependency for rapid evaluation setup; dictionary storage provides O(1) lookups by lead UUID. |
| **Structured AI Outputs** | **Pydantic `response_schema`** | Unstructured text parsing | Guarantees deterministic JSON output keys required by UI components, preventing frontend rendering errors. |
| **Resilience Model** | **Decoupled 1-Click Retry** | Background Task Queues | Avoids heavy infrastructure dependencies (Redis/Celery) while ensuring lead contact data is saved even during API outages. |

---

## 6. Contextual AI Grounding & Anti-Hallucination

LeadPilot AI enforces strict prompt engineering rules to prevent AI hallucinations and cross-lead data contamination:

1. **Information Gap Acknowledgment**: Prompts explicitly instruct Gemini: *"If information is missing (e.g. loan status or specific location preference), explicitly state 'Information not available in lead details' rather than inventing facts."*
2. **No Unwarranted Financial Assumptions**: Prompts forbid assuming a customer requires a home loan unless explicitly mentioned in their enquiry.
3. **Context Isolation**: Chat conversations are isolated per lead UUID (`_chat_history[lead_id]`). Lead A's conversation context is never passed into Lead B's prompt.
4. **Grounded Prompts**: Prompt builders in `backend/app/prompts/` explicitly inject the raw lead fields and existing analysis into every chat and call-prep API call.

---

## 7. Known Limitations

- **Volatile Storage**: Storage uses in-memory dictionaries (`_leads` and `_chat_history`). Rebooting the Uvicorn server resets active session data.
- **API Network Dependency**: AI lead analysis, contextual chat, and call prep require an active internet connection and valid Gemini API credentials.
- **Prerequisite Dependency**: Generating an AI Call Prep briefing requires a lead to have existing AI analysis (`ai_analysis !== null`).

---

## 8. Future Improvements

- **Persistent Database Storage**: Integration with PostgreSQL or SQLite via SQLAlchemy to preserve leads across server restarts.
- **User Authentication & RBAC**: Multi-user JWT authentication allowing sales managers to assign leads to specific representatives.
- **Channel Integrations**: Automated WhatsApp Webhooks and SMS triggers to send initial client responses directly.
- **Multi-Tenant CRM Sync**: Two-way synchronization with platforms like HubSpot or Salesforce.

---

## 9. How to Run the Project

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Google Gemini API Key** ([Get key from Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Activate Virtual Environment:
# On Windows:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:
```env
APP_NAME="LeadPilot AI"
ENVIRONMENT="development"
BACKEND_CORS_ORIGINS="http://localhost:5173"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
GEMINI_MODEL="gemini-3.5-flash-lite"
```

Start backend development server:
```bash
uvicorn app.main:app --reload --port 8000
```
*API documentation available at:* `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:8000"
```

Start frontend development server:
```bash
npm run dev
```
*Application available at:* `http://localhost:5173`

---

## 10. Test Results & Verification

### Automated Backend Test Suite (47 Passed Tests)
Run unit and schema validation tests:
```bash
python -m pytest backend/app/tests -v
```
- **`test_call_prep.py`**: Validates 7-section Pydantic payload parsing and `MissingAnalysisError` guards.
- **`test_contact_info.py`**: Validates Indian phone number regex, optional email formatting, and backward compatibility.
- **`test_lead_analysis_schema.py`**: Validates priority score boundaries (0–100) and strict priority category enum values (`HOT`/`WARM`/`COLD`).

```text
============================= 47 passed in 1.13s ==============================
```

### E2E Live Integration Test
Run live integration test against Uvicorn and Gemini API:
```bash
python backend/app/tests/test_e2e_live.py
```

### Frontend Production Build
Verify TypeScript compilation and asset bundling:
```bash
cd frontend
npm run build
```
- **Result**: `tsc -b && vite build` completed with **0 errors**.

---

## 11. AI Coding Tools Disclosure

During the development of LeadPilot AI, AI assistance (specifically Google Antigravity / DeepMind coding tools) was utilized for pair programming, generating test suite boilerplate, refining Tailwind CSS responsive layouts, and establishing Pydantic schema structures. All architectural decisions, prompt design rules, state isolation logic, and custom feature implementations were audited, verified, and tested for production readiness.
