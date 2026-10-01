"""
Prompt builder for AI Call Prep — Phase 7.

Constructs a single prompt string that gives Gemini full lead context
and instructs it to generate a structured, lead-specific call preparation brief.

Uses response_schema=CallPrep (structured JSON output), unlike the free-form
chat in Phase 6.
"""

from app.schemas.lead import LeadResponse
from app.schemas.chat import ChatMessage


def build_call_prep_prompt(
    lead: LeadResponse,
    history: list[ChatMessage],
) -> str:
    """
    Build the prompt sent to Gemini for Call Prep generation.

    Parameters:
        lead    — full LeadResponse including ai_analysis.
        history — existing Phase 6 chat history for this lead (may be empty).

    Returns:
        A single prompt string. Gemini is called with response_schema=CallPrep.
    """

    # ── 1. System instructions ────────────────────────────────────────────
    system_block = """\
You are LeadPilot AI's call-preparation assistant for a real-estate salesperson.

Your task:
Generate a concise, actionable call preparation brief for ONE specific lead.

Critical rules:
- Use ONLY the information provided in the lead context below.
- Do NOT invent customer preferences, history, previous visits, financial details, or commitments.
- Do NOT invent property names, specific localities, project names, or family details.
- If information is not present in the lead context, explicitly state that it is unavailable — do not guess.
- Every section must be directly connected to this specific lead's data.
- Keep all content practical and scannable — the salesperson reads this immediately before a call.
- Do NOT produce generic real-estate sales advice. Ground every point to this lead.
"""

    # ── 2. Lead information ───────────────────────────────────────────────
    mobile_val = lead.mobile_number if lead.mobile_number else "Not provided"
    email_val = lead.email if lead.email else "Not provided"

    lead_info_block = f"""\
=== LEAD INFORMATION ===
Name:                 {lead.name}
Mobile Number:        {mobile_val}
Email Address:        {email_val}
Location:             {lead.location}
Property Requirement: {lead.property_requirement}
Budget:               {lead.budget}
Buying Timeline:      {lead.buying_timeline}
Customer Message:     {lead.customer_message}
"""

    # ── 3. AI analysis (always present when Call Prep is invoked) ─────────
    a = lead.ai_analysis  # caller guarantees this is not None
    requirements_str = "\n  - ".join(a.key_requirements) if a.key_requirements else "None identified"
    objections_str   = "\n  - ".join(a.objections_concerns) if a.objections_concerns else "None identified"

    analysis_block = f"""\
=== AI ANALYSIS ===
Lead Summary:            {a.lead_summary}
Customer Intent:         {a.customer_intent}
Key Requirements:
  - {requirements_str}
Objections / Concerns:
  - {objections_str}
Recommended Next Action: {a.recommended_next_action}
Suggested Response:      {a.suggested_response}
"""

    # ── 4. Priority block ─────────────────────────────────────────────────
    priority_block = f"""\
=== PRIORITY ===
Priority Category: {a.priority}
Priority Score:    {a.priority_score} / 100

{"This is a HIGH-URGENCY lead. The salesperson should follow up promptly." if a.priority == "HOT" else
 "This lead shows genuine interest. Follow up soon." if a.priority == "WARM" else
 "This lead has low urgency. Approach methodically."}
"""

    # ── 5. Phase 6 chat history (if available) ────────────────────────────
    if history:
        history_lines = []
        for msg in history:
            label = "Salesperson" if msg.role == "user" else "AI Assistant"
            history_lines.append(f"{label}: {msg.content}")
        history_block = (
            "=== PREVIOUS CONVERSATION (from contextual chat) ===\n"
            + "\n\n".join(history_lines)
            + "\n"
        )
    else:
        history_block = "=== PREVIOUS CONVERSATION ===\n(No prior conversation for this lead)\n"

    # ── 6. Task instructions ──────────────────────────────────────────────
    task_block = """\
=== YOUR TASK ===
Generate a structured call preparation brief for the salesperson.
The brief must contain exactly these seven fields:

1. call_objective
   A single, specific sentence focusing on the highest-value missing information while confirming known needs.
   Example: "Understand {Name}'s preferred {Location} locations and key amenities while confirming that their {Property} requirement and {Budget} budget still fit their needs."
   Do NOT simply repeat all known fields.

2. key_talking_points
   A list of 3–5 concise talking points directly referencing known lead details and requirements.

3. likely_objection
   If the customer explicitly mentioned a concern, state it.
   If NO explicit objection was provided in the customer message, clearly state: "No explicit objection was provided."
   Do NOT invent customer concerns. You may note a key information gap (e.g. "Specific locality within {Location} has not been specified yet").

4. suggested_objection_handling
   If an explicit concern exists, provide a practical response.
   If no explicit objection was provided, explain how to address the key information gap naturally during the call.

5. questions_to_ask
   A list of EXACTLY 3 to 4 open-ended, natural, conversational questions.
   CRITICAL RULES FOR QUESTIONS:
   - Analyze: 1) What is already known? 2) What important info is missing? 3) Which missing info is most useful?
   - Ask ONLY about missing information (e.g. preferred micro-locations, ready-to-move vs open to new projects, key amenities/features, scheduling a visit).
   - DO NOT repeatedly ask for information that already exists! If Location, Budget, Property Type, or Timeline are already stated, DO NOT ask "What is your budget?" or "What type of property are you looking for?".
   - NATURAL LANGUAGE: Use simple, friendly salesperson language (e.g. "Which areas in {Location} are you considering?" rather than "What is your preferred micro-location?").
   - DO NOT ASSUME FINANCING: Do NOT ask about loans, pre-approval, or financing unless the customer explicitly mentioned home loan, EMI, or financing in their message.

6. suggested_opening
   A natural, warm salesperson opening sentence referencing the customer's name and enquiry detail.

7. desired_outcome
   A realistic next step (e.g. shortlist suitable properties, collect missing requirements, or schedule a property visit).

Base all seven sections strictly on the lead context. Return a JSON object matching the required structure.
"""

    return "\n".join([
        system_block,
        lead_info_block,
        analysis_block,
        priority_block,
        history_block,
        task_block,
    ])
