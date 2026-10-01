from app.schemas.lead import LeadCreate


def build_lead_analysis_prompt(lead: LeadCreate) -> str:
    """
    Builds the prompt sent to Gemini for structured lead analysis + prioritization.
    """
    email_val = lead.email if lead.email else "Not specified"
    return f"""You are an AI assistant helping a real-estate salesperson understand and prioritize an inbound lead.

Analyse ONLY the following lead information. Do not invent any details not explicitly provided.
If information is missing or ambiguous, say so clearly rather than making assumptions.

--- LEAD INFORMATION ---
Name:                 {lead.name}
Mobile Number:        {lead.mobile_number}
Email Address:        {email_val}
Location:             {lead.location}
Property Requirement: {lead.property_requirement}
Budget:               {lead.budget}
Buying Timeline:      {lead.buying_timeline}
Customer Message:     {lead.customer_message}
--- END OF LEAD INFORMATION ---

Provide a complete analysis with exactly these eight fields:

1. lead_summary         — A concise summary of this lead in 2–3 sentences.
2. customer_intent      — What the customer is trying to achieve based on the message.
3. key_requirements     — A list of specific requirements identified from the lead.
4. objections_concerns  — Potential concerns or objections explicitly raised by the customer.
5. recommended_next_action — The single most important action the salesperson should take now.
6. suggested_response   — A professional, natural response the salesperson can send to the customer.
7. priority_score       — An integer from 0 to 100 representing the urgency and quality of this lead.
8. priority             — Exactly one of: "HOT", "WARM", or "COLD" — derived from the priority_score.

=== CRITICAL GROUNDING & OBJECTION RULES ===
- EXPLICIT CONCERN vs INFORMATION GAP:
  If the customer did NOT mention an explicit objection or concern in their message, state clearly:
  "No explicit objection was provided."
  Missing information (e.g. "Preferred locality within city not specified") is an INFORMATION GAP, NOT a customer objection.
- NO UNSUPPORTED MARKET CLAIMS:
  Do NOT make external market assumptions or claims such as "₹1.5 crore is unrealistic for a 3 BHK in Mumbai" unless explicit market data is provided. Reason ONLY from the submitted lead information.

=== PRIORITY SCORING RULES ===

Score range to category mapping (MANDATORY — do not deviate):
  HOT  = 80 to 100  (high urgency, strong intent, follow up immediately)
  WARM = 50 to 79   (genuine interest, worth nurturing)
  COLD = 0  to 49   (low urgency or insufficient information)

The priority_score MUST be consistent with the priority category:
  - If priority is "HOT",  priority_score MUST be between 80 and 100 (inclusive).
  - If priority is "WARM", priority_score MUST be between 50 and 79  (inclusive).
  - If priority is "COLD", priority_score MUST be between 0  and 49  (inclusive).

Signals that INCREASE the score:
  - Short buying timeline (e.g. "Immediately", "Within 1 month", "Within 2 months")
  - Clear, specific property requirements
  - Specific budget stated
  - Strong, detailed customer message indicating real intent

Signals that DECREASE the score:
  - Long or unclear buying timeline (e.g. "Not decided", "More than 6 months")
  - Vague or absent property requirements
  - Generic message with little specific intent

=== GENERAL ANALYSIS RULES ===
- Base every point strictly on the provided lead information.
- Do not invent property names, exact localities, project names, or contact details.
- Do not invent family details, income, or lifestyle assumptions.
- If a piece of information is not stated, say 'Not specified' rather than guessing.
- Return the result as a JSON object matching the required structure.
"""
