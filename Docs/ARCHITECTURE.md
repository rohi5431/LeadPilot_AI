# LeadPilot AI — System Architecture

---

## ⚡ 30-Second Technical Explanation (Interview Quick Reference)
> **LeadPilot AI** is built on a modern decoupled web architecture featuring a **React 18 + TypeScript + Vite** frontend and a high-performance **FastAPI** Python backend. The backend manages request validation via **Pydantic** schemas, isolates lead data and chat histories in memory, and integrates with the **Google Gemini API** (`google-genai` SDK) using native structured JSON output (`response_schema`). All Gemini API keys remain strictly server-side. The API is modularly structured into dedicated services and prompts for Lead Analysis, Priority Scoring, Contextual Chat, and AI Call Preparation.

---

## 1. Architecture Overview

The system follows a clean client-server architecture with clear separation of concerns:

```
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
│  - lead_service.py         │  - leads_db: list[Lead]    │
│  - ai_service.py           │  - chat_db: dict[id, Chat]  │
│  - chat_service.py         │                            │
│  - call_prep_service.py    │                            │
└────────────────────────────┴─────────────┬──────────────┘
                                           │ HTTPS (Native JSON)
                                           ▼
                             ┌────────────────────────────┐
                             │      Google Gemini API     │
                             │  gemini-3.5-flash-lite /   │
                             │      gemini-2.0-flash      │
                             └────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose | Why Selected |
|---|---|---|---|---|
| **Frontend UI** | React | `18.3.1` | Component-based UI library | Enables interactive lead management and reactive UI state updates. |
| **Frontend Language**| TypeScript | `5.5.3` | Type safety | Ensures strict type safety between frontend models and backend responses. |
| **Build & Dev Server**| Vite | `5.4.1` | Fast frontend bundler | Extremely fast HMR development and lightweight production builds. |
| **Styling** | Tailwind CSS | `3.4.10` | Utility-first CSS framework | Rapid styling with consistent visual hierarchy and responsive layouts. |
| **Routing** | React Router | `6.26.1` | Client-side routing | Single-page application navigation (`/leads`, `/leads/:id`, `/add-lead`). |
| **Backend Framework**| FastAPI | `0.112.2` | High-performance API | Automatic OpenAPI docs, high performance, and native Pydantic integration. |
| **Data Validation** | Pydantic | `2.8.2` | Data schemas & AI validation | Enforces strict payload validation and guaranteed Gemini JSON outputs. |
| **ASGI Server** | Uvicorn | `0.30.6` | Asynchronous web server | Fast production-ready server hosting the FastAPI application. |
| **AI SDK** | `google-genai` | `1.5.0` | Official Gemini Python SDK | Native support for Gemini models and `response_schema` structured outputs. |
| **Testing** | pytest | `7.4.4` | Automated backend testing | Comprehensive unit and integration testing suite (47 passed tests). |

---

## 3. Why These Technologies

### FastAPI
- **Why Selected**: Lightweight, asynchronous Python framework with built-in Pydantic support.
- **Problem Solved**: Eliminates boilerplate validation code and provides seamless async integration with LLM APIs.
- **Trade-off**: Requires careful async call management to avoid blocking the main event loop.

### React + TypeScript
- **Why Selected**: Industry-standard SPA framework with strong static typing.
- **Problem Solved**: Prevents runtime type mismatch errors between frontend and backend endpoints.
- **Trade-off**: Client-side rendering requires handling initial load and loading/error states explicitly.

### Pydantic
- **Why Selected**: Native integration with both FastAPI and Gemini API `response_schema`.
- **Problem Solved**: Guarantees that LLM outputs match the exact JSON keys required by the frontend UI components.
- **Trade-off**: Schema changes must be synchronized across Pydantic models and TypeScript interfaces.

### Google Gemini API (`google-genai` SDK)
- **Why Selected**: Required AI provider with fast latency and native structured JSON output capability.
- **Problem Solved**: Eliminates fragile regex parsing of raw markdown LLM responses.
- **Trade-off**: Requires external internet connectivity and valid API credentials.

---

## 4. System Architecture Diagram

```
                             ┌───────────────────────────────┐
                             │       Salesperson Browser     │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │     React 18 Frontend SPA     │
                             │  LeadsPage / LeadDetailsPage  │
                             └───────────────┬───────────────┘
                                             │ HTTP REST
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend Application                             │
│                                                                                        │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │   Leads API Router   │    │   Chat API Router    │    │  Call Prep API Router    │  │
│  │  (POST/GET /api/leads│    │ (POST/GET /chat)     │    │  (POST /call-prep)       │  │
│  └──────────┬───────────┘    └──────────┬───────────┘    └────────────┬─────────────┘  │
│             │                           │                             │                │
│             ▼                           ▼                             ▼                │
│  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐  │
│  │     lead_service     │    │     chat_service     │    │    call_prep_service     │  │
│  └──────────┬───────────┘    └──────────┬───────────┘    └────────────┬─────────────┘  │
│             │                           │                             │                │
│             └───────────────────────────┼─────────────────────────────┘                │
│                                         ▼                                              │
│                              ┌──────────────────────┐                                  │
│                              │      ai_service      │                                  │
│                              └──────────┬───────────┘                                  │
└─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                          │ HTTPS (google-genai SDK)
                                          ▼
                               ┌──────────────────────┐
                               │   Google Gemini API  │
                               └──────────────────────┘
```

---

## 5. Request & Data Flow

### Lead Creation & Analysis Flow
```
User Submits Form ──► Frontend Validation ──► POST /api/leads
                                                   │
                                                   ▼
                                         Pydantic Schema Validation
                                                   │
                                                   ▼
                                         Save Lead to Memory (leads_db)
                                                   │
                                                   ▼
                                         Call Gemini API (ai_service)
                                                   │
                         ┌─────────────────────────┴────────────────────────┐
                         ▼                                                  ▼
             [ Success: Gemini Returns JSON ]                    [ Exception / Timeout ]
                         │                                                  │
                         ▼                                                  ▼
             Attach LeadAnalysis to Lead                        Save Lead with ai_analysis=None
                         │                                                  │
                         └─────────────────────────┬────────────────────────┘
                                                   ▼
                                        Return LeadResponse (HTTP 201)
```

---

## 6. AI Architecture & Security

- **Server-Side Key Isolation**: The `GEMINI_API_KEY` is loaded exclusively inside `backend/app/config.py` using `pydantic-settings`. It is never exposed in API responses or frontend environment variables.
- **Structured Schema Enforcement**: All prompt requests pass Pydantic schema classes (`LeadAnalysis`, `CallPrep`) to Gemini via `response_schema`.

```
FastAPI Server ──( GEMINI_API_KEY + Prompt + Schema )──► Gemini API ──( Structured JSON )──► Pydantic Model
```

---

## 7. Prompt Architecture

The system uses three modular prompt builders located in `backend/app/prompts/`:

1. **`lead_analysis.py`**:
   - **Context**: Captures lead details (*Name, Mobile, Email, Location, Requirement, Budget, Timeline, Message*).
   - **Rules**: Explicitly distinguishes customer objections from missing info. Bans unsupported market claims.
   - **Output**: 6-section breakdown + Priority Score (`0–100`) + Priority Category (`HOT/WARM/COLD`).

2. **`lead_chat.py`**:
   - **Context**: Injects full lead details, AI analysis, and historical chat messages.
   - **Rules**: Strict grounding. For missing details, explicitly forces the AI to reply *"The customer's phone number/email/preference is not available in the lead details"* rather than inventing values.

3. **`call_prep.py`**:
   - **Context**: Injects lead details, AI analysis, priority score, and chat history.
   - **Rules**: Enforces exactly 3–4 discovery questions. Prohibits repeating questions for known details. Bans automatic financing/loan assumptions.

---

## 8. Contextual Chat Architecture

```
Salesperson Question ──► POST /api/leads/{id}/chat
                              │
                              ▼
                Retrieve Lead & Existing Chat History from chat_db[lead_id]
                              │
                              ▼
                Build Grounded Prompt (lead_chat.py)
                              │
                              ▼
                Call Gemini API ──► Receive Grounded Text Response
                              │
                              ▼
                Append User & Assistant Messages to chat_db[lead_id]
                              │
                              ▼
                Return ChatResponse JSON
```

- **Lead Isolation**: `chat_db` is a dictionary keyed by `lead_id` (`dict[str, list[ChatMessage]]`). This guarantees that Lead A's conversation cannot leak into Lead B.

---

## 9. AI Call Prep Architecture

```
Click "Prepare Me for Call" ──► POST /api/leads/{id}/call-prep
                                      │
                                      ▼
                        Check Lead & ai_analysis Exist (422 if missing)
                                      │
                                      ▼
                        Build Call Prep Prompt (call_prep.py)
                                      │
                                      ▼
                        Call Gemini API with CallPrep response_schema
                                      │
                                      ▼
                        Return 7-Section CallPrep JSON
```

---

## 10. Data Model (Pydantic Schemas)

1. `LeadCreate`: Incoming lead creation payload (*name, mobile_number, email, location, property_requirement, budget, buying_timeline, customer_message*).
2. `LeadResponse`: Complete lead object including `id` UUID, timestamp, and nested `ai_analysis`.
3. `LeadAnalysis`: Structured AI analysis model (*lead_summary, customer_intent, key_requirements, objections_concerns, recommended_next_action, suggested_response, priority_score, priority*).
4. `ChatMessage`: Single chat entry (*role: "user"|"model", message, timestamp*).
5. `ChatRequest` / `ChatResponse`: Endpoint payloads for contextual chat.
6. `CallPrep`: 7-section structured preparation brief (*call_objective, key_talking_points, likely_objection, suggested_objection_handling, questions_to_ask, suggested_opening, desired_outcome*).

---

## 11. API Architecture

| Method | Endpoint | Router Module | Purpose | Status Codes |
|---|---|---|---|---|
| `GET` | `/` | `app/main.py` | Root status message | `200` |
| `GET` | `/api/health` | `app/api/health.py` | Service health check | `200` |
| `GET` | `/api/leads` | `app/api/leads.py` | Get all leads (priority sorted) | `200` |
| `POST` | `/api/leads` | `app/api/leads.py` | Create lead & trigger AI analysis | `201`, `422`, `500` |
| `GET` | `/api/leads/{id}` | `app/api/leads.py` | Fetch single lead by ID | `200`, `404` |
| `GET` | `/api/leads/{id}/chat` | `app/api/chat.py` | Fetch lead chat history | `200`, `404` |
| `POST` | `/api/leads/{id}/chat` | `app/api/chat.py` | Send message to contextual AI chat | `200`, `404`, `503` |
| `POST` | `/api/leads/{id}/call-prep` | `app/api/call-prep.py` | Generate 7-section AI Call Prep | `200`, `404`, `422`, `503` |

---

## 12. Error Handling & Resiliency

- **Validation Errors (`HTTP 422`)**: Triggered automatically by Pydantic when required fields or field formats (e.g. invalid mobile number) fail validation.
- **Resource Not Found (`HTTP 404`)**: Returned when requesting an invalid `lead_id`.
- **Precondition Failed (`HTTP 422`)**: Triggered by Call Prep service if attempting to generate prep for a lead without prior AI analysis (`MissingAnalysisError`).
- **AI Service Unavailable (`HTTP 503`)**: Gracefully caught when Gemini API calls encounter timeouts or API issues. During lead creation, the lead is saved with `ai_analysis=None` so user data is never lost.

---

## 13. Security Considerations

- **Zero Secret Exposure**: `GEMINI_API_KEY` is never included in client-side bundles or frontend requests.
- **Strict Input Sanitization**: Mobile numbers and emails are validated via server-side regex.
- **CORS Restricted**: Configured via `BACKEND_CORS_ORIGINS` to accept requests only from trusted frontend domains.

---

## 14. Testing Architecture

- **Unit Test Suite**: 47 automated backend unit tests in `backend/app/tests/`:
  - `test_call_prep.py`: Tests CallPrep schema validation and `MissingAnalysisError` guard.
  - `test_contact_info.py`: Tests mobile/email regex validation and backward compatibility.
  - `test_lead_analysis_schema.py`: Tests priority score boundaries (0–100) and priority category literals (`HOT/WARM/COLD`).
- **E2E Live Suite**: `test_e2e_live.py` executes an 11-step integration test against the running FastAPI server and real Gemini API.
- **Frontend Build**: Verified type safety via `npm run build` (`tsc -b && vite build`).

---

## 15. Planned Deployment Architecture

```
┌─────────────────────────┐               ┌─────────────────────────┐
│     Vercel / Netlify    │               │  Render / Railway / HF  │
│  Static React Frontend  │ ────────────► │     FastAPI Backend     │
│   (VITE_API_BASE_URL)   │   HTTP/REST   │   (GEMINI_API_KEY env)  │
└─────────────────────────┘               └────────────┬────────────┘
                                                       │ HTTPS
                                                       ▼
                                          ┌─────────────────────────┐
                                          │    Google Gemini API    │
                                          └─────────────────────────┘
```

---

## 16. Architectural Trade-offs

| Choice | Benefit | Trade-off / Mitigation |
|---|---|---|
| **In-Memory Storage** | Zero database dependency; fast setup | Data resets on backend restart; acceptable for assignment evaluation scope. |
| **Server-Side LLM Orchestration** | Secures API keys and standardizes prompt formatting | Adds small HTTP hop latency between client and Gemini API. |
| **Structured Output Schemas** | Guaranteed JSON structures for UI components | Strict validation fails if model produces malformed keys; mitigated by Pydantic validators. |

---

*Cross-references*:
- Product & Business requirements: see [`PRD.md`](./PRD.md)
- Implementation & Workflow specifications: see [`TASK.md`](./TASK.md)
