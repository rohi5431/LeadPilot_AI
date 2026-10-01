# LeadPilot AI — Product Requirements Document (PRD)

---

## ⚡ 30-Second Product Explanation (Interview Quick Reference)
> **LeadPilot AI** is an AI-powered lead intelligence assistant designed specifically for real-estate salespeople. It automates inbound lead intake, uses Google Gemini to evaluate buyer intent and calculate a 0–100 priority score (HOT / WARM / COLD), provides a lead-isolated contextual AI chat assistant, and features a signature **AI Call Prep** generator that delivers a 7-section structured briefing before phone calls. It turns raw enquiry messages into prioritized, actionable sales opportunities without inventing missing facts.

---

## 1. Product Overview

LeadPilot AI was built to solve the operational bottleneck faced by real-estate sales professionals who receive high volumes of inbound customer enquiries daily. In traditional workflows, salespeople spend significant time reading unstructured lead messages, attempting to identify buyer intent, deciding which leads to contact first, and preparing for follow-up calls without consolidated context.

The application captures inbound lead details and instantly processes them through Google Gemini using structured Pydantic schemas. Rather than presenting generic text summaries, LeadPilot AI extracts actionable sales insights: customer intent, key requirements, explicit objections, recommended next actions, and an AI-calculated priority score.

Beyond initial lead analysis, LeadPilot AI acts as a continuous co-pilot during the sales lifecycle. Salespeople can query a lead-isolated contextual AI chatbot to answer specific follow-up questions and generate a 7-section **AI Call Prep** brief before contacting a buyer.

---

## 2. Problem Statement

Real-estate sales teams face several critical operational challenges when handling inbound leads:

1. **High Inbound Volume & Friction**: Sales representatives receive dozens of property enquiries daily across web forms and portals, making manual review slow and error-prone.
2. **Prioritization Blindness**: Unstructured enquiry forms fail to highlight urgent buyers. Reps often call low-intent leads first while high-budget, immediate buyers wait.
3. **Information Overload & Missing Context**: Reps must manually synthesize location preferences, budget constraints, timeline urgency, and specific requirements from free-text customer notes.
4. **Call Preparation Fatigue**: Before contacting a customer, a representative needs clear talking points, objection handling strategies, and relevant questions. Creating these manually for every lead is time-prohibitive.
5. **Generic AI Hallucinations**: Standard LLM tools frequently invent missing customer details (e.g., fabricating family size or financing status), leading reps to make incorrect assumptions on calls.

---

## 3. Target User

- **Primary Persona**: Real-Estate Salesperson / Account Executive / Property Advisor.
- **Context & Responsibilities**: Receives inbound enquiries for residential/commercial properties, evaluates buyer qualification, conducts discovery calls, schedules site visits, and manages client relationships.
- **Key Decisions**:
  - Which lead should I call first right now?
  - What does this customer actually want, and what is their budget/timeline?
  - What objections should I expect on the phone?
  - What specific questions should I ask to qualify their missing requirements?

---

## 4. User Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Inbound Lead   │ ──► │   Lead Intake   │ ──► │   AI Analysis   │
│  Enquiry        │     │  (Form / API)   │     │  & Priority     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              ▼
│  AI Call Prep   │ ◄── │ Lead Details &  │ ◄── ┌─────────────────┐
│  7-Section Brief│     │ Contextual Chat │     │ Priority Sorted │
└────────┬────────┘     └─────────────────┘     │    Lead List    │
         │                                      └─────────────────┘
         ▼
┌─────────────────┐
│  Salesperson    │
│  Phone Call     │
└─────────────────┘
```

1. **Lead Intake**: Salesperson inputs a lead via a structured 8-field form (*Name, Mobile, Email, Location, Property Requirement, Budget, Timeline, Message*).
2. **AI Analysis & Priority Scoring**: Backend automatically sends the lead payload to Gemini AI, returning structured JSON with an analysis breakdown and a 0–100 Priority Score.
3. **Prioritized Lead List**: Leads are automatically sorted by priority score descending (`HOT` 80–100, `WARM` 50–79, `COLD` 0–49).
4. **Lead Details & Contextual Chat**: Salesperson opens a lead to view details and ask lead-isolated follow-up questions to the AI chatbot.
5. **AI Call Prep**: Clicking *"Prepare Me for Call"* generates a 7-section structured brief immediately before dialing.

---

## 5. Product Goals

- **Accelerate Lead Evaluation**: Enable sales representatives to scan lead intent, budget, timeline, and key requirements in under 10 seconds.
- **Dynamic AI Prioritization**: Rank all incoming leads by AI-computed urgency so representatives focus on high-intent buyers first.
- **Eliminate AI Hallucinations**: Enforce strict grounding rules where the AI explicitly acknowledges missing data rather than fabricating customer facts.
- **Streamline Call Readiness**: Provide a 1-click structured call preparation brief that equips representatives with tailored openings, talking points, objection responses, and discovery questions.

---

## 6. Core Requirements

### 6.1 Lead Intake
- **Assignment Required Fields**: Name, Location, Property Requirement, Budget, Buying Timeline, Customer Message.
- **LeadPilot AI Custom Added Fields**:
  - `Mobile Number` *(Required, validated Indian 10–12 digit format)*
  - `Email Address` *(Optional, validated standard email regex format)*

### 6.2 AI Analysis (6 Mandatory Outputs)
Every captured lead triggers a real-time Gemini API call returning:
1. **Lead Summary**: High-level overview of the buyer.
2. **Customer Intent**: Primary purchase/investment goal.
3. **Key Requirements**: Extracted preference bullet points.
4. **Objections / Concerns**: Explicit customer hesitations or gaps.
5. **Recommended Next Action**: Actionable next step for the rep.
6. **Suggested Response**: Draft response message for the client.

### 6.3 Conversational AI Interface
- Salespeople can submit free-text questions about a selected lead.
- Conversation history is maintained per lead (`chat_db`).
- Strict grounding rules prevent cross-lead leakage or hallucinating unstated facts.

### 6.4 Lead Prioritization
- **Priority Score**: Integer `0–100` generated by Gemini based on budget clarity, timeline urgency, and requirement specificity.
- **Priority Categories**:
  - `HOT` (`80–100`): Immediate timeline, clear budget, high intent.
  - `WARM` (`50–79`): Moderate timeline, reasonable requirements.
  - `COLD` (`0–49`): Long timeline, vague requirements, low intent.
- Leads are sorted descending by score in the Lead List UI.

### 6.5 Clear Display & Visual Scanning
- Color-coded badges: Red (`HOT`), Amber (`WARM`), Slate (`COLD`).
- Visual score progress bars (`0–100`).
- Clear visual hierarchy grouping contact details, property requirements, AI analysis cards, Call Prep cards, and Chat widgets.

---

## 7. Custom Feature — AI Call Prep

- **Problem**: Sales representatives lose productivity assembling talking points and anticipating objections prior to calling a buyer.
- **Solution**: A 1-click **"Prepare Me for Call"** feature generating a structured 7-section call brief grounded in lead details, past AI analysis, priority score, and chat history.

### The 7 Call Prep Sections:
1. **Call Objective**: Single-sentence goal for the phone call.
2. **Key Talking Points**: 3–6 concise points referencing actual lead requirements.
3. **Likely Objection**: Most probable customer concern grounded in the enquiry.
4. **Suggested Objection Handling**: Clear strategy to handle the objection.
5. **Questions to Ask**: Exactly 3–4 natural-language discovery questions targeting missing info.
6. **Suggested Opening**: Professional conversational opening line.
7. **Desired Outcome**: Specific targeted outcome by the end of the call.

---

## 8. AI Behavior Principles

- **Strict Grounding**: The AI must rely *only* on facts explicitly present in the lead payload or chat history.
- **Information Gap Acknowledgment**: If a salesperson asks for unstated details (e.g. preferred micro-locality or financing), the AI responds *"Information is not available in the lead details"* rather than inventing values.
- **No Financing Assumptions**: The AI does not assume a client requires a home loan unless explicitly stated in their message.
- **Context Isolation**: Chat conversations for Lead A are isolated from Lead B.

---

## 9. Non-Goals

To maintain strict project scope discipline, LeadPilot AI intentionally does **NOT** include:
- External relational database persistence (in-memory storage used per assignment scope).
- User authentication, multi-tenant roles, or ACLs.
- Automated outbound SMS, WhatsApp, or voice calling integrations.
- External MLS / property inventory searching.
- Third-party CRM synchronization (HubSpot, Salesforce).

---

## 10. Known Limitations

- **In-Memory Volatility**: Lead storage and chat history reset when the backend Uvicorn process restarts.
- **AI Service Availability**: Analysis and Call Prep require an active internet connection and valid `GEMINI_API_KEY`.
- **Prerequisite Dependency**: Call Prep requires prior successful AI analysis on the lead (`ai_analysis !== null`).

---

## 11. Product Decisions & Trade-offs

| Decision | Why Chosen | Trade-off / Mitigation |
|---|---|---|
| **In-Memory Storage** | Eliminates database setup complexity for assignment evaluation | Data resets on server restart; mitigated by clean seed/E2E test scripts. |
| **Google Gemini API** | Advanced reasoning & native structured output support | External network dependency; mitigated by graceful partial-success fallback. |
| **Structured Output (Pydantic)** | Ensures guaranteed JSON schema adherence for UI rendering | Requires strict schema validation; handled via Pydantic model definitions. |
| **Lead-Isolated Chat** | Prevents context leakage between different property buyers | History limited to current session memory per lead. |

---

## 12. Success Criteria

- Salesperson can create leads with mandatory contact validation.
- Every lead receives structured 6-point AI analysis and a 0–100 Priority Score.
- Leads are automatically ranked by priority score in the Lead List.
- Salesperson can ask contextual questions and receive grounded answers without hallucinations.
- Salesperson can generate a 7-section AI Call Prep brief on demand.
- All automated unit tests (`pytest`) and frontend builds (`npm run build`) pass cleanly.

---

*Cross-references*:
- System Architecture details: see [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- Implementation & Workflow specifications: see [`TASK.md`](./TASK.md)
