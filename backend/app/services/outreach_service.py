"""
Outreach AI service.

Orchestrates multi-channel copy generation:
    1. Validates that AI analysis exists on the lead.
    2. Builds the contextual prompt via outreach prompt builder.
    3. Calls Gemini with response_schema=OutreachChannelCopy (structured JSON).
    4. Returns a validated OutreachChannelCopy object.
"""

import logging

from app.schemas.lead import LeadResponse
from app.schemas.outreach import OutreachChannelCopy, OutreachTone
from app.services.call_prep_service import MissingAnalysisError

logger = logging.getLogger(__name__)


def generate_outreach(
    lead: LeadResponse,
    tone: OutreachTone = "consultative",
) -> OutreachChannelCopy:
    """
    Generate structured multi-channel outreach copy for the given lead.

    Parameters:
        lead — full LeadResponse. ai_analysis must not be None.
        tone — selected outreach tone ('consultative', 'urgent', 'friendly', 'professional').

    Returns:
        A validated OutreachChannelCopy object.

    Raises:
        MissingAnalysisError if the lead has no AI analysis.
        AIServiceError       if the Gemini call fails or returns invalid output.
    """
    from app.config import settings
    from app.services.ai_service import AIServiceError
    from app.prompts.outreach import build_outreach_prompt

    if lead.ai_analysis is None:
        raise MissingAnalysisError(
            "AI analysis is required before generating outreach copy. "
            "This lead was saved without a successful AI analysis."
        )

    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "Gemini API key is not configured. "
            "Set GEMINI_API_KEY in backend/.env."
        )

    prompt = build_outreach_prompt(lead, tone=tone)

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:  # pragma: no cover
        raise AIServiceError(
            "The google-genai package is not installed. "
            "Run: pip install google-genai"
        ) from exc

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=OutreachChannelCopy,
            ),
        )
    except Exception as exc:
        logger.error(
            "Gemini Outreach API call failed for lead %s (tone=%s): %s",
            lead.id,
            tone,
            exc,
        )
        raise AIServiceError(
            "Outreach generation failed due to an AI error. Please try again."
        ) from exc

    outreach: OutreachChannelCopy | None = response.parsed  # type: ignore[assignment]

    if outreach is None:
        try:
            import json
            raw = response.text
            outreach = OutreachChannelCopy.model_validate(json.loads(raw))
        except Exception as exc:
            logger.error(
                "Failed to parse Gemini Outreach response for lead %s: %s",
                lead.id,
                exc,
            )
            raise AIServiceError(
                "AI returned an unexpected response format for outreach studio."
            ) from exc

    logger.info(
        "Outreach studio generated copy for lead %s (tone=%s, priority=%s).",
        lead.id,
        tone,
        lead.ai_analysis.priority,
    )
    return outreach
