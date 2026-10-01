"""
Prompt builder for the contextual lead chat — Phase 6.

Constructs a single text prompt that includes:
    1. System instructions (role + grounding rules)
    2. Full lead context (lead info + AI analysis)
    3. Previous conversation history
    4. Current user question

Gemini is called with generate_content (plain text response),
not with response_schema, since chat replies are free-form text.
"""

from app.schemas.lead import LeadResponse
from app.schemas.chat import ChatMessage


def build_lead_chat_prompt(
    lead: LeadResponse,
    history: list[ChatMessage],
    user_message: str,
) -> str:
    """
    Build a single prompt string that gives Gemini full lead context
    and the current user question, grounded to only the available data.
    """

    # ── 1. System instructions ────────────────────────────────────────────
    system_block = """\
You are the AI assistant for a real-estate salesperson using LeadPilot AI.

Your role:
- You are answering questions about ONE specific real-estate lead.
- Use the provided lead information, AI analysis, and conversation history as your primary context.
- Keep your answers concise, professional, and useful for the salesperson.

Strict grounding rules:
- Do NOT invent facts or contact details about the customer that are not present in the lead context.
- If the salesperson asks for contact details (such as phone number or email) or preferences (such as preferred area):
  * If provided in the lead info: state the exact value.
  * If NOT provided or unavailable in the lead info: state clearly that it is not available (e.g. "The customer's phone number is not available in the lead information."). Do NOT invent a fake value.
- If information is not available in the lead context, clearly say it is not available.
- Keep all recommendations grounded in this specific lead only.
- Answer in plain text. Do not use markdown formatting in your response.
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

    # ── 3. AI analysis (if available) ─────────────────────────────────────
    if lead.ai_analysis is not None:
        a = lead.ai_analysis
        requirements_str = "\n  - ".join(a.key_requirements) if a.key_requirements else "None identified"
        objections_str = "\n  - ".join(a.objections_concerns) if a.objections_concerns else "None identified"
        analysis_block = f"""\
=== AI ANALYSIS ===
Lead Summary:           {a.lead_summary}
Customer Intent:        {a.customer_intent}
Key Requirements:
  - {requirements_str}
Objections / Concerns:
  - {objections_str}
Recommended Next Action: {a.recommended_next_action}
Suggested Response:      {a.suggested_response}
Priority Score:          {a.priority_score} / 100
Priority Category:       {a.priority}
"""
    else:
        analysis_block = """\
=== AI ANALYSIS ===
AI analysis is not available for this lead.
"""

    # ── 4. Previous conversation history ─────────────────────────────────
    if history:
        history_lines = []
        for msg in history:
            label = "Salesperson" if msg.role == "user" else "AI Assistant"
            history_lines.append(f"{label}: {msg.content}")
        history_block = "=== PREVIOUS CONVERSATION ===\n" + "\n\n".join(history_lines) + "\n"
    else:
        history_block = "=== PREVIOUS CONVERSATION ===\n(No previous messages)\n"

    # ── 5. Current question ───────────────────────────────────────────────
    question_block = f"""\
=== CURRENT QUESTION FROM SALESPERSON ===
{user_message}

Answer the question based only on the lead context above.
"""

    return "\n".join([
        system_block,
        lead_info_block,
        analysis_block,
        history_block,
        question_block,
    ])
