"""
Chat schemas — Phase 6.

Defines the Pydantic models for the contextual AI chat feature.
All validation happens here; routes stay thin.
"""

from typing import Literal
from pydantic import BaseModel, field_validator


class ChatMessage(BaseModel):
    """A single message in a conversation — either from the user or the AI assistant."""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """
    Payload for POST /api/leads/{lead_id}/chat.
    The message must not be empty or whitespace-only.
    """

    message: str

    @field_validator("message", mode="before")
    @classmethod
    def strip_and_reject_empty(cls, value: str) -> str:
        """Trim whitespace, then reject if the result is blank."""
        stripped = str(value).strip()
        if not stripped:
            raise ValueError("Message cannot be empty.")
        return stripped


class ChatResponse(BaseModel):
    """Response from POST /api/leads/{lead_id}/chat."""

    message: str


class ChatHistoryResponse(BaseModel):
    """Response from GET /api/leads/{lead_id}/chat."""

    messages: list[ChatMessage]
