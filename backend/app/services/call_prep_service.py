"""
Call Prep AI service — Phase 7.

Orchestrates Call Prep generation:
    1. Validates that AI analysis exists on the lead.
    2. Retrieves Phase 6 chat history (if any) from chat_service.
    3. Builds the contextual prompt via call_prep prompt builder.
    4. Calls Gemini with response_schema=CallPrep (structured output).
    5. Returns a validated CallPrep object.
    6. Raises AIServiceError on any failure.

Conventions:
- Reuses settings.GEMINI_API_KEY, settings.GEMINI_MODEL from app.config.
- Reuses AIServiceError from ai_service — single error class across the app.
- Uses response_schema=CallPrep (same pattern as Phase 3/5 lead analysis).
- All heavy imports (google.genai, app.config, app.prompts) are lazy/inside
  generate_call_prep() so this module can be imported in tests without
  triggering pydantic-settings or google-genai package errors.
"""

import logging

from app.schemas.lead import LeadResponse
from app.schemas.call_prep import CallPrep

logger = logging.getLogger(__name__)


class MissingAnalysisError(Exception):
    """
    Raised when Call Prep is requested for a lead that has no AI analysis.
    This is a user-facing validation error, not an AI/API failure.
    """


def generate_call_prep(lead: LeadResponse) -> CallPrep:
    """
    Generate a structured Call Prep brief for the given lead.

    Parameters:
        lead — full LeadResponse. ai_analysis must not be None.

    Returns:
        A validated CallPrep object.

    Raises:
        MissingAnalysisError if the lead has no AI analysis.
        AIServiceError       if the Gemini call fails or returns invalid output.
    """
    # Lazy imports — keeps module importable in test environments without venv
    from app.config import settings
    from app.services import chat_service
    from app.services.ai_service import AIServiceError
    from app.prompts.call_prep import build_call_prep_prompt

    # ── 1. Guard: AI analysis required ───────────────────────────────────
    if lead.ai_analysis is None:
        raise MissingAnalysisError(
            "AI analysis is required before generating call preparation. "
            "This lead was saved without a successful AI analysis."
        )

    # ── 2. Guard: require API key ─────────────────────────────────────────
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "Gemini API key is not configured. "
            "Set GEMINI_API_KEY in backend/.env."
        )

    # ── 3. Retrieve Phase 6 chat history (may be empty) ───────────────────
    history = chat_service.get_history(lead.id)

    # ── 4. Build the contextual prompt ────────────────────────────────────
    prompt = build_call_prep_prompt(lead, history)

    # ── 5. Lazy import of google.genai (avoids import failure in test env) ─
    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:  # pragma: no cover
        raise AIServiceError(
            "The google-genai package is not installed. "
            "Run: pip install google-genai"
        ) from exc

    # ── 6. Build Gemini client ────────────────────────────────────────────
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # ── 7. Call Gemini with structured output (response_schema=CallPrep) ──
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CallPrep,
            ),
        )
    except Exception as exc:
        logger.error(
            "Gemini Call Prep API call failed for lead %s: %s", lead.id, exc
        )
        raise AIServiceError(
            "Call preparation failed due to an AI error. Please try again."
        ) from exc

    # ── 8. Parse the structured response ──────────────────────────────────
    call_prep: CallPrep | None = response.parsed  # type: ignore[assignment]

    if call_prep is None:
        # Fallback: try to parse response.text manually
        try:
            import json
            raw = response.text
            call_prep = CallPrep.model_validate(json.loads(raw))
        except Exception as exc:
            logger.error(
                "Failed to parse Gemini Call Prep response for lead %s: %s",
                lead.id,
                exc,
            )
            raise AIServiceError(
                "AI returned an unexpected response format for call preparation."
            ) from exc

    logger.info(
        "Call Prep generated for lead %s (priority=%s, score=%d, history_msgs=%d).",
        lead.id,
        lead.ai_analysis.priority,
        lead.ai_analysis.priority_score,
        len(history),
    )
    return call_prep
