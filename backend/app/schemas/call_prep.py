"""
Call Prep schema — Phase 7.

Defines the structured Pydantic model for the AI Call Prep output
and the MissingAnalysisError exception class.

MissingAnalysisError lives here (not in the service) so it can be
imported by tests without triggering heavy dependencies like google.genai
or pydantic-settings.
"""

from pydantic import BaseModel, field_validator


class CallPrep(BaseModel):
    """
    Structured AI-generated call preparation brief for a real-estate lead.

    All seven fields are required. Pydantic rejects any Gemini response
    that is missing a field or has the wrong type.
    """

    call_objective: str
    key_talking_points: list[str]
    likely_objection: str
    suggested_objection_handling: str
    questions_to_ask: list[str]
    suggested_opening: str
    desired_outcome: str

    @field_validator(
        "call_objective",
        "likely_objection",
        "suggested_objection_handling",
        "suggested_opening",
        "desired_outcome",
        mode="before",
    )
    @classmethod
    def reject_empty_strings(cls, value: str) -> str:
        """Ensure no required string field is blank after stripping whitespace."""
        stripped = str(value).strip()
        if not stripped:
            raise ValueError("This field is required and cannot be blank.")
        return stripped

    @field_validator("key_talking_points", "questions_to_ask", mode="before")
    @classmethod
    def reject_empty_lists(cls, value: list) -> list:
        """Ensure list fields contain at least one item."""
        if not value or len(value) == 0:
            raise ValueError("This list must contain at least one item.")
        return value
