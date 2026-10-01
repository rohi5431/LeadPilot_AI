"""
Chat service — owns in-memory chat history storage.

Architecture:
    chat router (API)
        ↓
    chat_service (history CRUD)
        ↓
    chat_ai_service (Gemini call)

Responsibilities:
    - Store conversation history keyed by lead_id.
    - Return history for a given lead.
    - Append user and assistant messages.
    - History is isolated per lead — Lead A's history never leaks to Lead B.

History is in-memory and lost on restart, consistent with lead storage.
"""

import logging

from app.schemas.chat import ChatMessage

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory storage
# dict: lead_id (str) → list[ChatMessage]
# ---------------------------------------------------------------------------
_chat_history: dict[str, list[ChatMessage]] = {}


def get_history(lead_id: str) -> list[ChatMessage]:
    """
    Return the full conversation history for the given lead.
    Returns an empty list if no messages exist yet.
    """
    return list(_chat_history.get(lead_id, []))


def append_message(lead_id: str, role: str, content: str) -> None:
    """
    Append one message to the conversation history for a lead.

    Creates the history list for this lead if it does not exist yet.
    """
    if lead_id not in _chat_history:
        _chat_history[lead_id] = []

    _chat_history[lead_id].append(ChatMessage(role=role, content=content))  # type: ignore[arg-type]
    logger.debug(
        "Appended %s message for lead %s (total: %d)",
        role,
        lead_id,
        len(_chat_history[lead_id]),
    )
