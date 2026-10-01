"""
Chat AI service — calls Gemini for contextual lead chat responses.

Architecture:
    chat router
        ↓
    chat_ai_service.answer_question()
        ↓
    Gemini API (plain text response)

Conventions:
- Reuses settings.GEMINI_API_KEY and settings.GEMINI_MODEL from app.config.
- Raises AIServiceError on any failure — same pattern as ai_service.py.
- Returns a plain string (the assistant's reply).
- Does NOT use response_schema — chat replies are free-form text.
"""

import logging

from app.config import settings
from app.schemas.lead import LeadResponse
from app.schemas.chat import ChatMessage
from app.prompts.lead_chat import build_lead_chat_prompt
from app.services.ai_service import AIServiceError  # reuse the existing error class

logger = logging.getLogger(__name__)


def answer_question(
    lead: LeadResponse,
    history: list[ChatMessage],
    user_message: str,
) -> str:
    """
    Send a contextual question to Gemini and return the assistant's reply.

    Parameters:
        lead         — full LeadResponse (includes ai_analysis if available).
        history      — previous ChatMessage list for this lead (may be empty).
        user_message — the salesperson's current question (already stripped/validated).

    Returns:
        The assistant's reply as a plain string.

    Raises:
        AIServiceError if the API key is missing, the Gemini call fails,
        or the response is empty.
    """
    # ── 1. Guard: require API key ─────────────────────────────────────────
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "Gemini API key is not configured. "
            "Set GEMINI_API_KEY in backend/.env."
        )

    try:
        from google import genai
    except ImportError as exc:
        raise AIServiceError(
            "The google-genai package is not installed. Run: pip install google-genai"
        ) from exc

    # ── 2. Build the Gemini client ────────────────────────────────────────
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    # ── 3. Build the contextual prompt ────────────────────────────────────
    prompt = build_lead_chat_prompt(lead, history, user_message)

    # ── 4. Call Gemini (plain text — no response_schema for chat) ─────────
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
        )
    except Exception as exc:
        logger.error(
            "Gemini chat API call failed for lead %s: %s", lead.id, exc
        )
        raise AIServiceError(
            "AI assistant is temporarily unavailable. Please try again."
        ) from exc

    # ── 5. Extract and validate the text response ──────────────────────────
    reply: str = ""
    try:
        reply = response.text.strip()
    except Exception as exc:
        logger.error(
            "Failed to extract text from Gemini chat response for lead %s: %s",
            lead.id,
            exc,
        )
        raise AIServiceError(
            "AI returned an unexpected response. Please try again."
        ) from exc

    if not reply:
        raise AIServiceError("AI returned an empty response. Please try again.")

    logger.info(
        "Chat response generated for lead %s (history_len=%d).",
        lead.id,
        len(history),
    )
    return reply
