"""
AI service — the only module that talks to the Gemini API.

Architecture:
    leads.py  →  lead_service.py  →  ai_service.py  →  Gemini API

Responsibilities:
    - Initialise the Gemini client using the key from settings.
    - Build the generation request.
    - Call Gemini with a structured response schema.
    - Validate and return the Pydantic LeadAnalysis object.
    - Raise clear application-level errors on failure.

The Gemini API key is NEVER exposed to the frontend.
"""

import logging

from app.config import settings
from app.schemas.ai import LeadAnalysis
from app.schemas.lead import LeadCreate
from app.prompts.lead_analysis import build_lead_analysis_prompt

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when AI analysis cannot be completed for any reason."""


def analyze_lead(lead: LeadCreate) -> LeadAnalysis:
    """
    Send the lead to Gemini and return a validated LeadAnalysis.

    Raises AIServiceError if the API key is missing, the call fails,
    or the response cannot be parsed into a valid LeadAnalysis.
    """
    # ── 1. Guard: require API key ─────────────────────────────────────────
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "Gemini API key is not configured. "
            "Set GEMINI_API_KEY in backend/.env."
        )

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:
        raise AIServiceError(
            "The google-genai package is not installed. Run: pip install google-genai"
        ) from exc

    # ── 2. Build the Gemini client ────────────────────────────────────────
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # ── 3. Build the prompt ───────────────────────────────────────────────
    prompt = build_lead_analysis_prompt(lead)

    # ── 4. Call Gemini with structured JSON output ────────────────────────
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=LeadAnalysis,
            ),
        )
    except Exception as exc:
        # Log the technical detail server-side; surface a clean message.
        logger.error("Gemini API call failed: %s", exc)
        raise AIServiceError(
            "AI analysis failed due to an API error. "
            "Please try again later."
        ) from exc

    # ── 5. Parse the structured response ──────────────────────────────────
    # When response_schema is set, the SDK populates response.parsed
    # with a validated Pydantic instance automatically.
    analysis: LeadAnalysis | None = response.parsed  # type: ignore[assignment]

    if analysis is None:
        # Fallback: try to parse response.text manually
        try:
            import json
            raw = response.text
            analysis = LeadAnalysis.model_validate(json.loads(raw))
        except Exception as exc:
            logger.error("Failed to parse Gemini response: %s", exc)
            raise AIServiceError(
                "AI returned an unexpected response format."
            ) from exc

    logger.info(
        "AI analysis completed for lead (name=%s, location=%s)",
        lead.name,
        lead.location,
    )

    return analysis
