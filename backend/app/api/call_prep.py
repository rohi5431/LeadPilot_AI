"""
Call Prep API router — Phase 7.

Endpoint:
    POST /api/leads/{lead_id}/call-prep

No request body required — lead_id identifies the lead.

Flow:
    1. Look up lead → 404 if missing.
    2. Attempt Call Prep generation.
    3. MissingAnalysisError → 422 with clear user message.
    4. AIServiceError       → 503 with clear AI error message.
    5. Return structured CallPrep on success.

All business logic stays in call_prep_service. Route stays thin.
"""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.call_prep import CallPrep
from app.services import lead_service
from app.services import call_prep_service
from app.services.call_prep_service import MissingAnalysisError
from app.services.ai_service import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/leads/{lead_id}/call-prep",
    response_model=CallPrep,
)
def generate_call_prep(lead_id: str) -> CallPrep:
    """
    Generate an AI call preparation brief for a specific lead.

    - Returns 404 if the lead does not exist.
    - Returns 422 if the lead has no AI analysis (user-facing validation error).
    - Returns 503 if Gemini is temporarily unavailable.
    - Returns a structured CallPrep on success.
    """
    # ── 1. Validate lead exists ───────────────────────────────────────────
    lead = lead_service.get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    # ── 2. Generate Call Prep ─────────────────────────────────────────────
    try:
        return call_prep_service.generate_call_prep(lead)

    except MissingAnalysisError as exc:
        # Lead exists but has no AI analysis — tell the user clearly
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except AIServiceError as exc:
        logger.warning("Call Prep AI failed for lead %s: %s", lead_id, exc)
        raise HTTPException(
            status_code=503,
            detail="AI call preparation is temporarily unavailable. Please try again.",
        ) from exc
