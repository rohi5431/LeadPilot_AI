import re
from pydantic import BaseModel, field_validator
from app.schemas.ai import LeadAnalysis


class LeadCreate(BaseModel):
    """Schema for creating a new lead with contact info and property details."""

    name: str
    mobile_number: str
    email: str | None = None
    location: str
    property_requirement: str
    budget: str
    buying_timeline: str
    customer_message: str

    @field_validator(
        "name",
        "location",
        "property_requirement",
        "budget",
        "buying_timeline",
        "customer_message",
        mode="before",
    )
    @classmethod
    def strip_and_reject_empty(cls, value: str) -> str:
        """Trim whitespace, then reject if the result is empty."""
        stripped = str(value).strip() if value else ""
        if not stripped:
            raise ValueError("This field is required and cannot be blank.")
        return stripped

    @field_validator("mobile_number", mode="before")
    @classmethod
    def validate_mobile_number(cls, value: str) -> str:
        """Validate standard Indian mobile number format."""
        stripped = str(value).strip() if value else ""
        if not stripped:
            raise ValueError("Mobile number is required.")
        digits_only = re.sub(r"\D", "", stripped)
        if len(digits_only) == 10:
            pass
        elif len(digits_only) == 11 and digits_only.startswith("0"):
            pass
        elif len(digits_only) == 12 and digits_only.startswith("91"):
            pass
        else:
            raise ValueError("Please enter a valid mobile number (e.g. 9876543210 or +91 9876543210).")
        return stripped

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        """Validate email format only when provided."""
        if value is None:
            return None
        stripped = str(value).strip()
        if not stripped:
            return None
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, stripped):
            raise ValueError("Please enter a valid email address.")
        return stripped


class LeadResponse(BaseModel):
    """
    Schema for the created lead returned to the client.

    Supports backward compatibility for existing leads created without contact info.
    ai_analysis is None when AI analysis failed.
    """

    id: str
    name: str
    mobile_number: str | None = None
    email: str | None = None
    location: str
    property_requirement: str
    budget: str
    buying_timeline: str
    customer_message: str
    ai_analysis: LeadAnalysis | None = None
