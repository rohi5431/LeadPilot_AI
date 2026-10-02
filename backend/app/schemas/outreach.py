"""
Outreach Studio schema.

Defines the structured Pydantic model for multi-channel sales copy generation
(WhatsApp, Email, SMS, Follow-up strategy note) and the tone request schema.
"""

from typing import Literal
from pydantic import BaseModel, field_validator


OutreachTone = Literal["consultative", "urgent", "friendly", "professional"]


class OutreachRequest(BaseModel):
    """Request payload for outreach generation."""

    tone: OutreachTone = "consultative"


class OutreachChannelCopy(BaseModel):
    """
    Structured AI-generated multi-channel sales outreach copy.

    Conforms strictly to Gemini response_schema.
    """

    whatsapp: str
    email_subject: str
    email_body: str
    sms: str
    follow_up_note: str

    @field_validator(
        "whatsapp",
        "email_subject",
        "email_body",
        "sms",
        "follow_up_note",
        mode="before",
    )
    @classmethod
    def reject_empty_strings(cls, value: str) -> str:
        """Ensure no required string field is blank after stripping whitespace."""
        stripped = str(value).strip()
        if not stripped:
            raise ValueError("This field is required and cannot be blank.")
        return stripped
