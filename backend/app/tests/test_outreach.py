"""
Tests for AI Outreach Studio: OutreachChannelCopy schema + service guard.

Tests covered:
    1. OutreachChannelCopy schema accepts valid structured data.
    2. OutreachChannelCopy schema rejects missing required fields.
    3. OutreachChannelCopy schema rejects blank string fields.
    4. OutreachRequest accepts valid tone literals.
    5. MissingAnalysisError is raised for leads without AI analysis when generating outreach copy.
"""

import pytest
from pydantic import ValidationError

from app.schemas.outreach import OutreachChannelCopy, OutreachRequest
from app.schemas.lead import LeadResponse


VALID_OUTREACH = {
    "whatsapp": "Hi Rahul! 👋 I noticed your enquiry for a 3 BHK in Mumbai. We have excellent properties in your budget of Rs. 1.5 Cr. Would you be free for a 5-min call today?",
    "email_subject": "Exclusive 3 BHK Options in Mumbai matching your budget",
    "email_body": "Hi Rahul,\n\nThank you for reaching out regarding 3 BHK properties in Mumbai. Based on your timeline within 2 months, I have shortlisted 3 premium projects within Rs. 1.5 Cr.\n\nBest regards,\nLeadPilot Sales Team",
    "sms": "Hi Rahul, received your enquiry for 3 BHK in Mumbai (Rs 1.5 Cr). 3 matching projects ready to view. Call us back or reply YES to connect!",
    "follow_up_note": "Lead with the location options first. Call during late morning (11 AM) as buyer has a 2-month timeline.",
}

LEAD_NO_ANALYSIS = LeadResponse(
    id="test-lead-outreach-002",
    name="Meera Nair",
    location="Bangalore",
    property_requirement="2 BHK",
    budget="Rs. 80 Lakhs",
    buying_timeline="Within 6 months",
    customer_message="Interested in 2 BHK apartment options.",
    ai_analysis=None,
)


class TestOutreachSchemaValid:
    def test_valid_payload_is_accepted(self):
        copy = OutreachChannelCopy(**VALID_OUTREACH)
        assert copy.whatsapp == VALID_OUTREACH["whatsapp"]
        assert copy.email_subject == VALID_OUTREACH["email_subject"]
        assert copy.email_body == VALID_OUTREACH["email_body"]
        assert copy.sms == VALID_OUTREACH["sms"]
        assert copy.follow_up_note == VALID_OUTREACH["follow_up_note"]

    def test_outreach_request_default(self):
        req = OutreachRequest()
        assert req.tone == "consultative"

    def test_outreach_request_tones(self):
        for tone in ["consultative", "urgent", "friendly", "professional"]:
            req = OutreachRequest(tone=tone)
            assert req.tone == tone


class TestOutreachSchemaValidation:
    def test_missing_field_rejected(self):
        data = {**VALID_OUTREACH}
        del data["whatsapp"]
        with pytest.raises(ValidationError):
            OutreachChannelCopy(**data)

    def test_blank_field_rejected(self):
        data = {**VALID_OUTREACH, "email_subject": "   "}
        with pytest.raises(ValidationError):
            OutreachChannelCopy(**data)


class TestOutreachServiceGuard:
    def test_raises_missing_analysis_error(self):
        from app.services.outreach_service import generate_outreach
        from app.services.call_prep_service import MissingAnalysisError

        with pytest.raises(MissingAnalysisError):
            generate_outreach(LEAD_NO_ANALYSIS)
