from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Returns the health status of the backend service."""
    return HealthResponse(status="ok", service="leadpilot-ai-backend")
