"""
Tests for Lead Contact Information & Schema updates.

Verifies:
1. Mobile number validation (requires 10-12 digits, accepts +91/0 prefixes, rejects invalid).
2. Email address validation (optional, validates format when provided).
3. LeadCreate requires name, mobile_number, location, property_requirement, budget, buying_timeline, customer_message.
4. LeadResponse supports backward compatibility for legacy leads without contact info.
"""

import pytest
from pydantic import ValidationError
from app.schemas.lead import LeadCreate, LeadResponse


class TestLeadContactInfoValidation:
    def test_valid_lead_create_with_mobile_and_email(self):
        lead = LeadCreate(
            name="Rohit Kumar",
            mobile_number="9876543210",
            email="rohit@example.com",
            location="Mumbai",
            property_requirement="3 BHK",
            budget="1.5 crores",
            buying_timeline="Immediately",
            customer_message="Looking for a 3 BHK in Mumbai.",
        )
        assert lead.name == "Rohit Kumar"
        assert lead.mobile_number == "9876543210"
        assert lead.email == "rohit@example.com"

    def test_valid_lead_create_without_email(self):
        lead = LeadCreate(
            name="Rohit Kumar",
            mobile_number="+91 9876543210",
            email=None,
            location="Mumbai",
            property_requirement="3 BHK",
            budget="1.5 crores",
            buying_timeline="Immediately",
            customer_message="Looking for a 3 BHK in Mumbai.",
        )
        assert lead.mobile_number == "+91 9876543210"
        assert lead.email is None

    def test_invalid_mobile_number_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            LeadCreate(
                name="Rohit Kumar",
                mobile_number="12345",  # Too short
                email="rohit@example.com",
                location="Mumbai",
                property_requirement="3 BHK",
                budget="1.5 crores",
                buying_timeline="Immediately",
                customer_message="Looking for a 3 BHK in Mumbai.",
            )
        assert "mobile_number" in str(exc_info.value)

    def test_invalid_email_format_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            LeadCreate(
                name="Rohit Kumar",
                mobile_number="9876543210",
                email="not-an-email",  # Invalid email format
                location="Mumbai",
                property_requirement="3 BHK",
                budget="1.5 crores",
                buying_timeline="Immediately",
                customer_message="Looking for a 3 BHK in Mumbai.",
            )
        assert "email" in str(exc_info.value)

    def test_legacy_lead_response_backward_compatibility(self):
        response = LeadResponse(
            id="legacy-id-123",
            name="Old Lead",
            mobile_number=None,
            email=None,
            location="Delhi",
            property_requirement="2 BHK",
            budget="80 Lakhs",
            buying_timeline="Within 1 month",
            customer_message="Old lead without contact fields.",
            ai_analysis=None,
        )
        assert response.mobile_number is None
        assert response.email is None
