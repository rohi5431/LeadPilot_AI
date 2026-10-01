"""
Lead service — owns in-memory storage and orchestrates lead creation.

Architecture:
    leads.py (API route)
        ↓
    lead_service.create_lead() / get_all_leads() / get_lead_by_id()
        ↓
    ai_service.analyze_lead()   (for creation only)
        ↓
    Gemini API

Responsibilities:
    - Generate a UUID for the new lead.
    - Store the lead.
    - Call the AI service for analysis.
    - Attach the analysis (or None on failure) to the stored lead.
    - Return the final LeadResponse.
    - Retrieve all stored leads.
    - Retrieve a single lead by ID.

The lead is ALWAYS saved even if AI analysis fails.
"""

import logging
import uuid

from app.schemas.lead import LeadCreate, LeadResponse
from app.services import ai_service
from app.services.ai_service import AIServiceError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------
# dict: lead_id (str) → LeadResponse
# Data is lost on restart — intentional for Phase 4.
# Replace with a real database in a later phase.
# ---------------------------------------------------------------------------
_leads: dict[str, LeadResponse] = {}


def create_lead(data: LeadCreate) -> LeadResponse:
    """
    Create, store, and AI-analyse a new real-estate lead.

    Flow:
        1. Generate UUID.
        2. Create and store the lead (ai_analysis=None initially).
        3. Call ai_service.analyze_lead().
        4. If analysis succeeds → attach to lead and update storage.
        5. If analysis fails   → keep lead with ai_analysis=None.
        6. Return the final LeadResponse.
    """
    # ── 1 & 2: Create and store the lead ─────────────────────────────────
    lead_id = str(uuid.uuid4())

    lead = LeadResponse(
        id=lead_id,
        name=data.name,
        mobile_number=data.mobile_number,
        email=data.email,
        location=data.location,
        property_requirement=data.property_requirement,
        budget=data.budget,
        buying_timeline=data.buying_timeline,
        customer_message=data.customer_message,
        ai_analysis=None,
    )
    _leads[lead_id] = lead

    # ── 3 & 4: AI analysis ────────────────────────────────────────────────
    try:
        analysis = ai_service.analyze_lead(data)
        # Build a new LeadResponse with the analysis attached
        lead = LeadResponse(
            id=lead_id,
            name=data.name,
            mobile_number=data.mobile_number,
            email=data.email,
            location=data.location,
            property_requirement=data.property_requirement,
            budget=data.budget,
            buying_timeline=data.buying_timeline,
            customer_message=data.customer_message,
            ai_analysis=analysis,
        )
        _leads[lead_id] = lead
        logger.info("Lead %s created and analysed successfully.", lead_id)

    except AIServiceError as exc:
        # ── 5: AI failed — lead is already saved, just log and continue ──
        logger.warning(
            "AI analysis failed for lead %s: %s. Lead saved without analysis.",
            lead_id,
            exc,
        )

    return _leads[lead_id]


def get_all_leads() -> list[LeadResponse]:
    """
    Return all stored leads sorted by priority_score DESCENDING.
    Returns an empty list when no leads have been created yet.
    Leads with failed/missing AI analysis are placed at the end.
    """
    leads = list(_leads.values())
    return sorted(
        leads,
        key=lambda lead: (lead.ai_analysis.priority_score if lead.ai_analysis else -1),
        reverse=True,
    )



def get_lead_by_id(lead_id: str) -> LeadResponse | None:
    """
    Return one lead by its UUID, or None if the ID does not exist.
    The API route is responsible for converting None → 404.
    """
    return _leads.get(lead_id)


def retry_lead_analysis(lead_id: str) -> LeadResponse:
    """
    Retry AI analysis for an existing lead whose prior analysis failed or is missing.

    Flow:
        1. Fetch stored lead (or raise ValueError if 404).
        2. Construct LeadCreate payload from existing fields.
        3. Call ai_service.analyze_lead().
        4. Attach analysis to lead and update storage.
        5. Return updated LeadResponse.
    """
    lead = _leads.get(lead_id)
    if not lead:
        raise ValueError("Lead not found")

    data = LeadCreate(
        name=lead.name,
        mobile_number=lead.mobile_number,
        email=lead.email,
        location=lead.location,
        property_requirement=lead.property_requirement,
        budget=lead.budget,
        buying_timeline=lead.buying_timeline,
        customer_message=lead.customer_message,
    )

    analysis = ai_service.analyze_lead(data)

    updated_lead = LeadResponse(
        id=lead.id,
        name=lead.name,
        mobile_number=lead.mobile_number,
        email=lead.email,
        location=lead.location,
        property_requirement=lead.property_requirement,
        budget=lead.budget,
        buying_timeline=lead.buying_timeline,
        customer_message=lead.customer_message,
        ai_analysis=analysis,
    )
    _leads[lead_id] = updated_lead
    logger.info("Retried and updated AI analysis for lead %s successfully.", lead_id)
    return updated_lead

