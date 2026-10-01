# LeadPilot AI 🚀
> **AI-Powered Lead Prioritization & Sales Action Assistant for Real-Estate**
> *Built for Masal AI — FDE Assignment (Round 2)*

---

## ⚡ 30-Second Elevator Pitch (Interview Quick Reference)

> **LeadPilot AI** solves the inbound lead qualification bottleneck for real-estate sales professionals. When a customer sends a raw property enquiry, LeadPilot AI uses **Google Gemini** (`gemini-2.0-flash`) and **Pydantic** structured JSON schemas to evaluate buyer intent, calculate a **0–100 Priority Score** (`HOT` / `WARM` / `COLD`), isolate contextual AI follow-up chat, and generate a **1-Click 7-Section AI Call Prep Brief** right before the phone call. It turns messy text into clear, prioritized, actionable sales pipeline intelligence without inventing unstated facts.

---

## 📸 Key Product Features & Visual UX Workflow

```
PRIORITIZE ──────────────► UNDERSTAND ──────────────► ACT
Lead Cards sorted by       2-Column Gemini AI         1-Click 7-Section
0–100 Priority Score       Intelligence & Intent      AI Call Prep & Chat
```

### 1. 🎯 Intake & Instant Priority Scoring
* **Mandatory Contact Validation**: Name, Mobile (Indian 10-12 digit regex), Email, Location, Requirement, Budget, Timeline, Message.
* **Instant Priority Categorization**:
  * 🔥 **HOT (80–100)**: Immediate timeline, clear high budget, ready buyer.
  * ☀️ **WARM (50–79)**: Moderate timeline, flexible budget.
  * ❄️ **COLD (0–49)**: Vague requirements, distant timeline.
* **One-Click Filtering & Search**: Interactive stat cards (`ALL`, `HOT`, `WARM`, `COLD`) and real-time multi-field search.

### 2. 🧠 Structured AI Lead Analysis
* **6 Mandatory Sales Outputs** generated natively via Gemini `response_schema`:
  1. **Lead Summary**: Concise buyer overview.
  2. **Customer Intent**: Core buying motivation (end-use vs investment).
  3. **Key Requirements**: Extracted preference list.
  4. **Objections & Concerns**: Identified financial, location, or timing gaps.
  5. **Recommended Next Action**: Tactical next step for the salesperson.
  6. **Suggested Response**: Draft WhatsApp / Email opening text.

### 3. 💬 Contextual Lead-Isolated AI Chat
* Salespeople can ask free-text questions (*"How should I handle their budget concern?"* or *"Draft a WhatsApp follow-up"*).
* **Interactive Quick Prompt Pills** in empty chat states for 1-click execution.
* **Strict Grounding Rules**: Prevents cross-lead leakage and refuses to hallucinate unstated customer details.

### 4. 📞 Signature Custom Feature: AI Call Prep Briefing
* Positioned in the **Right Sales Action Sidebar** for human-centered workflow.
* Generates a **7-Section Briefing** on demand:
  1. **Call Objective**: Single-sentence focus for the call.
  2. **Key Talking Points**: 3–6 tailored bullet points.
  3. **Likely Objection**: Grounded potential pushback.
  4. **Suggested Objection Handling**: Direct strategy to resolve objection.
  5. **Questions to Ask**: 3–4 natural discovery questions.
  6. **Suggested Opening Line**: Personal opening greeting incorporating lead facts.
  7. **Desired Outcome**: Specific call target.

---

## 🎙️ 30-Minute Technical & Product Interview Talking Points

| Interview Topic | Key Technical / Product Answer |
|---|---|
| **Why FastAPI + Pydantic?** | Built-in async performance, automatic OpenAPI documentation, and seamless integration with Gemini `response_schema` for guaranteed JSON key rendering without regex parsing. |
| **Why Server-Side Key Isolation?** | `GEMINI_API_KEY` is loaded exclusively via `pydantic-settings` inside backend service modules (`ai_service.py`), preventing key leakage to the frontend bundle. |
| **How is AI Hallucination Prevented?** | Strict system prompts enforce grounding rules: if a detail (e.g. loan pre-approval) is missing, the AI explicitly states *"Information not available in lead details"* instead of making assumptions. |
| **How is Chat Context Isolated?** | Chat memory is stored in a dictionary keyed strictly by `lead_id` (`chat_db: dict[str, list[ChatMessage]]`). Lead A cannot view or bleed context into Lead B. |
| **Why Call Prep in the Sidebar?** | Placing the trigger and resulting brief in the right column creates a clear "Sales Action Hub", allowing salespeople to review the left main analysis while reading talking points during a call. |
| **What happens if Gemini is Down?** | Resilient fallback architecture: if Gemini times out, the lead is saved with `ai_analysis = None` (HTTP 201 partial success) so user data is never lost. |

---

## 🛠️ Technology Stack & System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Browser Client (React 18 SPA)              │
│  Vite · TypeScript · Tailwind CSS · React Router v6     │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP REST / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 FastAPI Backend Server                  │
│       Uvicorn ASGI · Pydantic Schemas · Python 3.12    │
├────────────────────────────┬────────────────────────────┤
│       Service Layer        │     Volatile Memory        │
│  - lead_service.py         │  - leads_db: list[Lead]    │
│  - ai_service.py           │  - chat_db: dict[id, Chat] │
│  - call_prep_service.py    │                            │
└────────────────────────────┴─────────────┬──────────────┘
                                           │ HTTPS (google-genai SDK)
                                           ▼
                             ┌────────────────────────────┐
                             │     Google Gemini API      │
                             │  gemini-2.0-flash / JSON   │
                             └────────────────────────────┘
```

---

## ⚙️ Quickstart & Local Setup

### Prerequisites
* **Python 3.10+** & `pip`
* **Node.js 18+** & `npm`
* **Google Gemini API Key** ([Get key here](https://aistudio.google.com/))

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
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
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_MODEL="gemini-2.0-flash"
```

Start backend:
```bash
uvicorn app.main:app --reload --port 8000
```
*Swagger API Docs available at:* `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL="http://localhost:8000"
```

Start frontend dev server:
```bash
npm run dev
```
*Access application at:* `http://localhost:5173`

---

## 🧪 Testing & Quality Assurance

### Automated Backend Test Suite (47/47 Passed)
```bash
python -m pytest backend/app/tests -v
```
* **`test_call_prep.py`**: Validates 7-section Pydantic payload parsing and `MissingAnalysisError` guard.
* **`test_contact_info.py`**: Tests Indian phone number regex, optional email validation, and backward compatibility.
* **`test_lead_analysis_schema.py`**: Verifies score boundaries (0–100) and strict priority category literals (`HOT`/`WARM`/`COLD`).

### E2E Live Integration Test
```bash
python backend/app/tests/test_e2e_live.py
```
*Executes an 11-step integration test against the running Uvicorn server and real Gemini API.*

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```
*Compiles TypeScript (`tsc -b`) and bundles static assets with Vite with **0 errors**.*

---

## 📂 Project Repository Navigation

* 📄 **[`PRD.md`](./PRD.md)**: Product Requirements Document, User Personas, Core Requirements, AI Grounding Rules, Non-Goals, Roadmap.
* 🏗️ **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: System Architecture, Pydantic Data Models, Prompt Builders, Service Layer, Trade-offs.
* 📋 **[`TASK.md`](./TASK.md)**: System Workflow Breakdown, Component Responsibilities, Error Matrix, Compliance Audits.

---

## 👤 Author & Assignment Context

* **Project**: LeadPilot AI
* **Assignment**: Masal AI — Forward Deployed Engineer (FDE) Round 2
* **Domain**: Real-Estate B2B SaaS / Sales Co-Pilot
* **Status**: 100% Complete & Production-Ready 🚀
