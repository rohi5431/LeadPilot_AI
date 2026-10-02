"""
Prompt builder for AI Multi-Channel Outreach Studio.

Constructs a contextual prompt for Gemini to generate tailored copy across 4 channels
(WhatsApp, Email, SMS, Follow-up Strategy Note) based on lead data, AI analysis, and tone.
"""

from app.schemas.lead import LeadResponse


def build_outreach_prompt(
    lead: LeadResponse,
    tone: str = "consultative",
) -> str:
    """
    Build the prompt sent to Gemini for Outreach Studio copy generation.

    Parameters:
        lead — full LeadResponse including ai_analysis.
        tone — 'consultative', 'urgent', 'friendly', or 'professional'.

    Returns:
        A single prompt string. Gemini is called with response_schema=OutreachChannelCopy.
    """

    system_block = f"""\
You are LeadPilot AI's Sales Outreach Copywriter for a premium real-estate advisory.

Your task:
Generate multi-channel outreach copy for ONE specific lead in the selected tone: "{tone.upper()}".

TONE GUIDELINES ({tone.upper()}):
- CONSULTATIVE: Empathetic, advisory, educational, focused on understanding their goals and matching the right property.
- URGENT: Highlighting active market demand, exclusive property availability, and time-sensitive opportunity.
- FRIENDLY: Warm, approachable, casual, conversation-starter style with relatable framing.
- PROFESSIONAL: Executive, structured, data-driven, concise corporate real-estate tone.

CRITICAL Anti-Hallucination & Framing Rules:
- Ground every message in the lead details provided below (Name, Location, Budget, Timeline, Property Requirement).
- Reference their explicit concerns if available.
- Do NOT invent specific unit numbers, false developer guarantees, or fake discount percentages.
- Do NOT use any emojis, icons, or special symbols in any generated copy. Keep text clean, professional, and plain text.
- Format WhatsApp text with short lines and clear bullet points for mobile reading without emojis.
- Format Email with a compelling Subject Line and clear structured body with call-to-action.
- Format SMS to be punchy, direct, and under 200 characters.
- Produce a strategic follow_up_note for the salesperson outlining the optimal follow-up timing and approach.
"""

    mobile_val = lead.mobile_number if lead.mobile_number else "Not provided"
    email_val = lead.email if lead.email else "Not provided"

    lead_info_block = f"""\
=== LEAD INFORMATION ===
Name:                 {lead.name}
Mobile Number:        {mobile_val}
Email Address:        {email_val}
Location Preference:  {lead.location}
Property Requirement: {lead.property_requirement}
Budget:               {lead.budget}
Buying Timeline:      {lead.buying_timeline}
Customer Message:     "{lead.customer_message}"
"""

    a = lead.ai_analysis
    requirements_str = ", ".join(a.key_requirements) if a.key_requirements else "None specified"
    objections_str = ", ".join(a.objections_concerns) if a.objections_concerns else "None specified"

    analysis_block = f"""\
=== AI SALES INTELLIGENCE ===
Priority Category:    {a.priority} (Score: {a.priority_score}/100)
Customer Intent:      {a.customer_intent}
Key Requirements:     {requirements_str}
Key Objections:       {objections_str}
Recommended Next Step:{a.recommended_next_action}
"""

    task_block = """\
=== YOUR TASK ===
Generate structured JSON output with exactly these five fields:

1. whatsapp
   A complete, formatted WhatsApp message. Include friendly greeting with customer's name, reference to their property requirement and budget in location, key value highlights, and a quick call-to-action. Use line breaks and plain text. Do NOT use any emojis or icons.

2. email_subject
   A clear, high-converting email subject line customized for this lead. Do NOT use emojis.

3. email_body
   A professional email draft including greeting, reference to their specific enquiry, tailored property suggestions matching their budget/timeline, addressing any stated concern, and a clear next step (e.g. phone call or site visit). Do NOT use emojis.

4. sms
   A short, punchy SMS text message (max 200 characters) ideal for quick mobile outreach. Do NOT use emojis.

5. follow_up_note
   A 2-3 sentence strategic advice note for the salesperson (e.g. best time to call, key topic to lead with, emotional trigger to address).

Return a JSON object conforming strictly to OutreachChannelCopy.
"""

    return "\n".join([
        system_block,
        lead_info_block,
        analysis_block,
        task_block,
    ])
