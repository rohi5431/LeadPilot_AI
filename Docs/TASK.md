# LeadPilot AI — System Workflow & Implementation Tasks

---

## ⚡ 30-Second System Workflow (Interview Quick Reference)
> **LeadPilot AI** executes a continuous multi-step lead processing workflow. Incoming leads enter via `LeadForm.tsx`, trigger server-side Pydantic regex validation, and get persisted to memory. The backend immediately dispatches the lead context to Google Gemini API via `ai_service.py`, returning a 6-part JSON analysis and a 0–100 Priority Score (`HOT`/`WARM`/`COLD`). Leads are served via `GET /api/leads` pre-sorted by score. Salespeople can navigate to any lead to engage in grounded, lead-isolated AI chat (`chat_service.py`) and generate a 1-click 7-section **AI Call Prep** brief (`call_prep_service.py`) prior to calling the client.

---

## 1. System Responsibilities

The system architecture divides operational responsibilities into ten core tasks:

1. **Lead Intake**: Capturing and validating 8 lead fields (*Name, Mobile, Email, Location, Requirement, Budget, Timeline, Message*).
2. **In-Memory Storage**: Managing thread-safe volatile storage (`leads_db` and `chat_db`).
3. **AI Lead Analysis**: Interfacing with Gemini API to extract intent, summary, requirements, objections, actions, and suggested replies.
4. **Priority Generation**: Computing a 0–100 score and assigning `HOT`, `WARM`, or `COLD` priority tags.
5. **Prioritized Lead Listing**: Rendering a responsive list pre-sorted by priority score.
6. **Lead Details Navigation**: Routing to individual lead pages (`/leads/:leadId`).
7. **Lead-Isolated Contextual Chat**: Processing user questions grounded in lead data and session history without cross-talk.
8. **AI Call Prep Generation**: Producing a 7-section structured briefing for sales call execution.
9. **Resilient Validation & Error Handling**: Gracefully handling missing data, invalid formats, 404s, and AI API downtime.
10. **Automated Testing & Build Verification**: Enforcing regression prevention with 47 unit tests and E2E suites.

---

## 2. Lead Creation Workflow

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

- **Frontend File**: `frontend/src/components/LeadForm.tsx`
- **API Endpoint**: `POST /api/leads`
- **Backend Router**: `backend/app/api/leads.py`
- **Service Module**: `backend/app/services/lead_service.py`
- **AI Module**: `backend/app/services/ai_service.py`

---

## 3. AI Analysis Workflow

1. **Input Payload**: `LeadCreate` data sent to `ai_service.generate_lead_analysis()`.
2. **Prompt Construction**: `build_lead_analysis_prompt()` formats lead information and injects strict grounding rules.
3. **Gemini Invocation**: `client.models.generate_content()` called with `response_mime_type="application/json"` and `response_schema=LeadAnalysis`.
4. **Structured JSON Output**: Model populates the 6 required outputs:
   - `lead_summary`: Overview of buyer persona.
   - `customer_intent`: Primary acquisition goal.
   - `key_requirements`: List of extracted preferences.
   - `objections_concerns`: Identified hesitations or information gaps.
   - `recommended_next_action`: Immediate step for representative.
   - `suggested_response`: Draft message for client.
   - `priority_score`: Integer `0–100`.
   - `priority`: Categorical enum (`HOT` / `WARM` / `COLD`).

---

## 4. Lead Prioritization Workflow

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

---

## 5. Lead Details Workflow

- **Route**: `/leads/:leadId` handled by `frontend/src/pages/LeadDetailsPage.tsx`.
- **API Call**: `GET /api/leads/{id}` fetches full lead payload.
- **Rendered Sub-components**:
  - `LeadCard`: Contact details (Name, Mobile, Email, Location), requirements, budget, timeline, customer message.
  - `LeadAnalysisCard`: Priority badge, score progress bar, 6-part AI breakdown.
  - `CallPrepCard`: Interactive button trigger and 7-section call preparation brief.
  - `LeadChatCard`: Interactive grounded conversational assistant widget.

---

## 6. Contextual Chat Workflow

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

- **Isolation Mechanism**: Chat histories are stored in `chat_db: dict[str, list[ChatMessage]]` keyed strictly by `lead_id`. E2E tests verify zero cross-lead leakage.

---

## 7. AI Call Prep Workflow

1. Salesperson clicks **"Prepare Me for Call"** in `CallPrepCard.tsx`.
2. Frontend dispatches `POST /api/leads/{leadId}/call-prep`.
3. Backend service `call_prep_service.generate_call_prep()` verifies lead exists (`404`) and `ai_analysis !== null` (`422`).
4. Prompt builder `app/prompts/call_prep.py` compiles lead info, analysis, priority score, and chat context.
5. Gemini API generates structured JSON enforcing the `CallPrep` Pydantic schema:
   - **Call Objective**
   - **Key Talking Points** (3–6 bullet points)
   - **Likely Objection**
   - **Suggested Objection Handling**
   - **Questions to Ask** (3–4 natural language questions)
   - **Suggested Opening**
   - **Desired Outcome**
6. UI renders structured brief in `CallPrepCard.tsx`.

---

## 8. Validation & Error Workflow

| Scenario | Trigger / Condition | Handled By | Outcome / Status Code |
|---|---|---|---|
| **Invalid Mobile/Email** | Non-Indian number or malformed email regex | Pydantic `LeadCreate` | `HTTP 422 Unprocessable Entity` |
| **Missing Lead ID** | Requesting invalid UUID | API Router `get_lead_by_id` | `HTTP 404 Not Found` |
| **Call Prep Without Analysis** | `ai_analysis` is `None` | `call_prep_service.py` | `HTTP 422` ("AI analysis required first") |
| **Gemini Timeout / Error** | Network outage or bad API key | `ai_service.py` try...except | Partial Success: Lead saved with `ai_analysis=None` |
| **Chat API Downtime** | Gemini service failure during chat | `chat_service.py` | `HTTP 503` ("AI assistant temporarily unavailable") |

---

## 9. Frontend Component Responsibilities

- `LeadForm.tsx`: Input form for 8 lead fields with inline regex validation and error states.
- `LeadCard.tsx`: Displays lead contact details, requirement attributes, and budget/timeline badges.
- `LeadAnalysisCard.tsx`: Visual priority score progress bar, priority badge, and 6-section AI analysis display.
- `LeadChatCard.tsx`: Interactive chat widget supporting contextual follow-up Q&A and message history.
- `CallPrepCard.tsx`: Action button and 7-section structured call preparation brief container.
- `AppHeader.tsx`: Responsive navigation bar displaying app title and primary route links.

---

## 10. Backend Module Responsibilities

- `backend/app/main.py`: FastAPI app initialization, CORS middleware configuration, route mounting.
- `backend/app/config.py`: Environment configuration loading (`GEMINI_API_KEY`, `GEMINI_MODEL`, `BACKEND_CORS_ORIGINS`).
- `backend/app/schemas/`: Pydantic schema declarations (`lead.py`, `lead_analysis.py`, `chat.py`, `call_prep.py`).
- `backend/app/services/`: Core logic modules (`lead_service.py`, `ai_service.py`, `chat_service.py`, `call_prep_service.py`).
- `backend/app/prompts/`: System prompt template generators (`lead_analysis.py`, `lead_chat.py`, `call_prep.py`).

---

## 11. AI Prompt Responsibilities

- **`lead_analysis.py`**: Instructs model to analyze raw lead message, extract buyer requirements, highlight explicit hesitations, and compute a 0–100 Priority Score.
- **`lead_chat.py`**: Instructs model to answer salesperson questions strictly using available lead details and session history; enforces refusal to hallucinate unstated facts.
- **`call_prep.py`**: Instructs model to format a 7-section briefing, enforcing 3–4 natural discovery questions and prohibiting financing assumptions unless explicitly requested.

---

## 12. Testing & Verification Tasks

- **Backend Pytest Suite** (`python -m pytest backend/app/tests -v`):
  - `test_contact_info.py`: Validates mobile number regex, email regex, and backward compatibility.
  - `test_call_prep.py`: Tests Call Prep schema generation and missing analysis exception handling.
  - `test_lead_analysis_schema.py`: Tests 0–100 priority score constraints and priority category validation.
  - Total: 47 passed unit tests.
- **E2E Live Suite** (`python backend/app/tests/test_e2e_live.py`):
  - Validates 11-step end-to-end integration against live FastAPI server and Gemini API.
- **Frontend Build Validation** (`npm run build`):
  - Enforces TypeScript compilation (`tsc -b`) and Vite production bundling (`0 errors`).

---

## 13. Current System Limitations

- **Volatile Storage**: Storage uses python memory lists (`leads_db`) and dictionaries (`chat_db`). Rebooting the backend wipes active session data.
- **API Network Dependency**: AI features require internet connectivity and valid Gemini API credentials.
- **Prerequisite Sequential Step**: Call Prep requires prior AI analysis generation on the lead.

---

## 14. Future Extensions *(Planned / Not Implemented)*

- **Persistent Database**: Integration with PostgreSQL or MongoDB via SQLAlchemy / Motor.
- **Authentication & RBAC**: JWT-based user authentication for sales managers and reps.
- **CRM Integrations**: Two-way synchronization with HubSpot, Salesforce, or LeadSquared.
- **Multi-channel Communication**: Automated WhatsApp Webhooks and IVR calling triggers.

---

*Cross-references*:
- Product & Business requirements: see [`PRD.md`](./PRD.md)
- System Architecture details: see [`ARCHITECTURE.md`](./ARCHITECTURE.md)
