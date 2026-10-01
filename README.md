# LeadPilot AI

> **Current phase: Phase 7 — AI Call Preparation**

## Overview

LeadPilot AI is an AI-powered real-estate lead prioritization and salesperson assistant application. It helps real-estate sales professionals capture inbound leads, understand customer intent through AI analysis, prioritize follow-up efforts, ask contextual questions, and prepare for sales calls with structured AI Call Prep briefs.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI component library |
| TypeScript | Type safety |
| Vite | Dev server & bundler |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Python | Language |
| FastAPI | REST API framework |
| Pydantic | Data validation & structured output schemas |
| Uvicorn | ASGI server |
| google-genai | Gemini API SDK |

---

## Phases

### Phase 1 — Project Foundation ✅
React + Vite + TypeScript + Tailwind, FastAPI backend, health endpoint, CORS, env config.

### Phase 2 — Lead Intake ✅
6-field lead capture form, Pydantic validation, `POST /api/leads` (HTTP 201), in-memory storage.

### Phase 3 — AI Lead Analysis ✅
Real Gemini API call on every lead creation. Structured JSON output via `response_schema`. Six AI outputs: Lead Summary, Customer Intent, Key Requirements, Objections/Concerns, Recommended Next Action, Suggested Response.

### Phase 4 — Multiple Leads & Navigation ✅
Full lead list (`/leads`), detail route (`/leads/:leadId`), status badges, and navigation.

### Phase 5 — AI Lead Prioritization ✅
Calculates priority score (0–100) and priority category (HOT / WARM / COLD) based on lead requirements, budget, timeline, and customer message. Automatically sorts lead list by priority.

### Phase 6 — Contextual AI Lead Chat ✅
Lead-isolated AI chat allowing salespeople to ask specific follow-up questions about a selected lead. Chat history is preserved per lead in memory.

### Phase 7 — AI Call Prep (LeadPilot Custom Feature) ✅

LeadPilot AI's signature feature is **AI Call Prep**. It converts the selected lead's existing context (lead info, customer message, AI analysis, priority score, and contextual chat history) into a concise, lead-specific preparation brief for the salesperson immediately before a call.

#### Generated Sections:
1. **Call Objective**: Single sentence goal for the call.
2. **Key Talking Points**: 3–6 concise points referencing actual lead details.
3. **Likely Objection**: Most probable objection grounded in lead context.
4. **Suggested Objection Handling**: Practical response strategy for that objection.
5. **Questions to Ask**: 3–6 open-ended questions to clarify missing details.
6. **Suggested Opening**: Professional opening line incorporating lead details.
7. **Desired Outcome**: Specific result to target by the end of the call.

> **Note**: AI Call Prep uses only facts present in the lead context and does not invent missing customer details or guarantee conversion/sales outcomes.

---

## Architecture

```
React (BrowserRouter)
  /leads          → LeadsPage
  /leads/:leadId  → LeadDetailsPage (Priority + Lead Info + Call Prep + Analysis + Chat)
  /add-lead       → AddLeadPage
        │
        │  API calls via api.ts (VITE_API_BASE_URL)
        ▼
FastAPI (http://localhost:8000)
        │
        ├── GET  /api/health                     → Health check
        ├── GET  /api/leads                      → All leads (priority sorted)
        ├── GET  /api/leads/{id}                 → One lead details
        ├── POST /api/leads                      → Create lead + AI analysis
        ├── GET  /api/leads/{id}/chat            → Fetch lead chat history
        ├── POST /api/leads/{id}/chat            → Contextual AI chat message
        └── POST /api/leads/{id}/call-prep       → Structured AI Call Prep brief
        │
        ▼
Lead & Chat Services (In-memory storage)
        │
        └── Gemini API (Structured output with CallPrep Pydantic schema)
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root endpoint |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/leads` | All leads, sorted by priority score descending |
| `GET` | `/api/leads/{lead_id}` | Details for one lead by UUID (404 if missing) |
| `POST` | `/api/leads` | Create lead + AI analysis & priority score (HTTP 201) |
| `GET` | `/api/leads/{lead_id}/chat` | Get Phase 6 contextual chat history for lead |
| `POST` | `/api/leads/{lead_id}/chat` | Post message to Phase 6 contextual AI chat |
| `POST` | `/api/leads/{lead_id}/call-prep` | Generate Phase 7 structured AI Call Prep brief |

Swagger docs: http://localhost:8000/docs

---

## Local Setup

### Prerequisites
- Python 3.10+, pip
- Node.js 18+, npm
- Gemini API key → https://aistudio.google.com

### Backend Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Set GEMINI_API_KEY in backend/.env
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `APP_NAME` | Application name |
| `ENVIRONMENT` | `development` |
| `BACKEND_CORS_ORIGINS` | `http://localhost:5173` |
| `GEMINI_API_KEY` | Your Gemini API key — never commit |
| `GEMINI_MODEL` | `gemini-2.0-flash` |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` |

---

## Known Limitations

- Lead data, chat history, and priority scores are stored in memory and will reset if the backend restarts.
- AI Call Prep requires a successful prior AI analysis on the lead (`ai_analysis !== null`).
- Priority scoring and call prep recommendations do not guarantee sales performance or conversion outcomes.
- No authentication or database persistence (out of scope for current phases).
