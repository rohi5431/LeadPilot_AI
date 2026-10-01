from typing import Literal
from pydantic import BaseModel, Field


class LeadAnalysis(BaseModel):
    """
    Structured AI analysis of a real-estate lead.

    All eight fields are required. Pydantic will reject
    any Gemini response that is missing a field, has a wrong type,
    or has a priority_score outside 0–100.
    """

    # ── Existing six analysis fields (Phase 3) ────────────────────────────
    lead_summary: str
    customer_intent: str
    key_requirements: list[str]
    objections_concerns: list[str]
    recommended_next_action: str
    suggested_response: str

    # ── Phase 5: priority fields ───────────────────────────────────────────
    priority_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="AI-generated lead priority score: 0 (lowest) to 100 (highest).",
    )
    priority: Literal["HOT", "WARM", "COLD"] = Field(
        ...,
        description=(
            "Priority category derived from priority_score. "
            "HOT = 80–100, WARM = 50–79, COLD = 0–49."
        ),
    )
