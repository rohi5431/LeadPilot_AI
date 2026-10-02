"""
Outreach Studio API router.

Endpoint:
    POST /api/leads/{lead_id}/outreach

Request body (optional):
    OutreachRequest(tone="consultative" | "urgent" | "friendly" | "professional")

Flow:
    1. Validate lead exists -> 404 if missing.
    2. Attempt outreach copy generation.
    3. MissingAnalysisError -> 422 with clear message.
    4. AIServiceError       -> 503 with AI error message.
    5. Return structured OutreachChannelCopy.
"""

import logging
from fastapi import APIRouter, HTTPException

from app.schemas.outreach import OutreachChannelCopy, OutreachRequest
from app.services import lead_service, outreach_service
from app.services.call_prep_service import MissingAnalysisError
from app.services.ai_service import AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/leads/{lead_id}/outreach",
    response_model=OutreachChannelCopy,
)
def generate_outreach_copy(
    lead_id: str,
    payload: OutreachRequest = OutreachRequest(),
) -> OutreachChannelCopy:
    """
    Generate multi-channel outreach copy (WhatsApp, Email, SMS, Strategy Note)
    tailored to a lead's profile and selected tone.

    - Returns 404 if lead not found.
    - Returns 422 if lead has no AI analysis.
    - Returns 503 if Gemini service fails.
    """
    lead = lead_service.get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")

    try:
        return outreach_service.generate_outreach(lead, tone=payload.tone)

    except MissingAnalysisError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except AIServiceError as exc:
        logger.warning("Outreach AI failed for lead %s: %s", lead_id, exc)
        raise HTTPException(
            status_code=503,
            detail="AI outreach generation is temporarily unavailable. Please try again.",
        ) from exc
