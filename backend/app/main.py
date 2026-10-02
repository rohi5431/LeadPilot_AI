from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import health, leads, chat, call_prep, outreach

app = FastAPI(title="LeadPilot AI API")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(call_prep.router, prefix="/api")
app.include_router(outreach.router, prefix="/api")


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------
@app.get("/")
def root() -> dict:
    """Root endpoint — confirms the API is reachable."""
    return {"message": "LeadPilot AI API is running"}
