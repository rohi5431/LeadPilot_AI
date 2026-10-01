"""
Chat API router — Phase 6.

Endpoints:
    POST /api/leads/{lead_id}/chat   — send a message, get AI reply
    GET  /api/leads/{lead_id}/chat   — fetch conversation history

Flow for POST:
    1. Validate request body (Pydantic ChatRequest).
    2. Look up lead — 404 if not found.
    3. Load existing chat history.
    4. Call chat_ai_service to get Gemini reply.
    5. If Gemini fails — do NOT store anything, return 503.
    6. Store user message + assistant reply.
    7. Return assistant reply.

All route functions stay thin — logic in services.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse
from app.services import lead_service, chat_service, chat_ai_service
from app.services.ai_service import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/leads/{lead_id}/chat",
    response_model=ChatResponse,
)
def send_message(lead_id: str, payload: ChatRequest) -> ChatResponse:
    """
    Send a salesperson message about a specific lead and receive an AI reply.

    - Returns 404 if the lead does not exist.
    - Returns 503 if Gemini is unavailable.
    - Does NOT store messages when Gemini fails (no inconsistent state).
    """
    # ── 1. Validate lead exists ───────────────────────────────────────────
    lead = lead_service.get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    # ── 2. Load existing history for this lead ────────────────────────────
    history = chat_service.get_history(lead_id)

    # ── 3. Call Gemini with full context ──────────────────────────────────
    try:
        reply = chat_ai_service.answer_question(
            lead=lead,
            history=history,
            user_message=payload.message,
        )
    except AIServiceError as exc:
        logger.warning("Chat AI failed for lead %s: %s", lead_id, exc)
        raise HTTPException(
            status_code=503,
            detail="AI assistant is temporarily unavailable. Please try again.",
        ) from exc

    # ── 4. Persist both messages (only after successful Gemini reply) ──────
    chat_service.append_message(lead_id, role="user", content=payload.message)
    chat_service.append_message(lead_id, role="assistant", content=reply)

    return ChatResponse(message=reply)


@router.get(
    "/leads/{lead_id}/chat",
    response_model=ChatHistoryResponse,
)
def get_chat_history(lead_id: str) -> ChatHistoryResponse:
    """
    Return the full conversation history for a specific lead.

    - Returns 404 if the lead does not exist.
    - Returns an empty messages list if no conversation has started yet.
    """
    # Validate lead exists before returning chat data
    lead = lead_service.get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    messages = chat_service.get_history(lead_id)
    return ChatHistoryResponse(messages=messages)
