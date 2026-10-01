from fastapi import APIRouter, HTTPException
from app.schemas.lead import LeadCreate, LeadResponse
from app.services import lead_service

router = APIRouter()


@router.post("/leads", response_model=LeadResponse, status_code=201)
def create_lead(payload: LeadCreate) -> LeadResponse:
    """
    Create a new real-estate lead.

    - Pydantic validates and sanitises the incoming JSON.
    - lead_service generates a UUID, stores, and AI-analyses the lead.
    - Returns HTTP 201 Created on success.
    - ai_analysis will be null if the Gemini call fails (lead is still saved).
    """
    return lead_service.create_lead(payload)


@router.get("/leads", response_model=list[LeadResponse])
def get_all_leads() -> list[LeadResponse]:
    """
    Return all currently stored leads.

    Returns an empty list [] when no leads exist.
    Includes full AI analysis for each lead (or null if AI failed).
    """
    return lead_service.get_all_leads()


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: str) -> LeadResponse:
    """
    Return one lead by its UUID.

    Returns 404 if the lead does not exist.
    """
    lead = lead_service.get_lead_by_id(lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead
