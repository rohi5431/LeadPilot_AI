"""
Tests for Phase 7: CallPrep schema + service MissingAnalysisError guard.

DESIGN NOTES:
    These tests only import from app.schemas (Pydantic only — no FastAPI,
    no app.config, no google.genai). This matches the pattern of
    test_lead_analysis_schema.py which already passes in this environment.

    Integration tests requiring FastAPI TestClient (which loads app.config
    through app.main) are in test_call_prep_integration.py and are conditional
    on the environment having the correct venv active.

Tests covered here:
    1. CallPrep schema accepts valid structured data.
    2. CallPrep schema rejects missing required fields.
    3. CallPrep schema rejects empty list fields.
    4. CallPrep schema rejects blank string fields.
    5. MissingAnalysisError is raised for leads without AI analysis.
    6. MissingAnalysisError message is user-friendly.
"""

import pytest
from pydantic import ValidationError

from app.schemas.call_prep import CallPrep
from app.schemas.lead import LeadResponse

# ---------------------------------------------------------------------------
# Shared valid payload — matches CallPrep field definitions exactly
# ---------------------------------------------------------------------------

VALID_CALL_PREP = {
    "call_objective": "Confirm parking requirement and preferred micro-location.",
    "key_talking_points": [
        "3 BHK apartment requirement",
        "Parking explicitly mentioned in the customer message",
        "Budget of Rs. 1.5 Crore stated",
        "Two-month buying timeline",
    ],
    "likely_objection": "Properties matching all requirements may be above the stated budget.",
    "suggested_objection_handling": (
        "Ask whether the budget is flexible and clarify "
        "whether parking is mandatory or just preferred."
    ),
    "questions_to_ask": [
        "Which locations in the city are you considering?",
        "Is parking a mandatory requirement?",
        "Is your budget of Rs. 1.5 Crore fixed or flexible?",
    ],
    "suggested_opening": (
        "Hi, I am following up on your enquiry for a 3 BHK. "
        "I see you need good connectivity and parking."
    ),
    "desired_outcome": (
        "Confirm the customer's preferred location and "
        "clarify which requirements are non-negotiable."
    ),
}

LEAD_WITH_ANALYSIS = LeadResponse(
    id="test-lead-001",
    name="Rahul Sharma",
    location="Mumbai",
    property_requirement="3 BHK apartment",
    budget="Rs. 1.5 Crore",
    buying_timeline="Within 2 months",
    customer_message="Looking for a 3 BHK with parking and good connectivity.",
    ai_analysis={
        "lead_summary": "Strong buying intent with specific requirements.",
        "customer_intent": "Purchase a 3 BHK with parking.",
        "key_requirements": ["3 BHK", "Parking", "Good connectivity"],
        "objections_concerns": ["Budget may be tight for requirements"],
        "recommended_next_action": "Call to confirm requirements in detail.",
        "suggested_response": "Thank you for your enquiry.",
        "priority_score": 92,
        "priority": "HOT",
    },
)

LEAD_NO_ANALYSIS = LeadResponse(
    id="test-lead-002",
    name="Meera Nair",
    location="Bangalore",
    property_requirement="2 BHK",
    budget="Rs. 80 Lakhs",
    buying_timeline="Within 6 months",
    customer_message="Interested in 2 BHK apartment options.",
    ai_analysis=None,
)


# ---------------------------------------------------------------------------
# 1. CallPrep schema — valid data
# ---------------------------------------------------------------------------

class TestCallPrepSchemaValid:
    def test_valid_payload_is_accepted(self):
        cp = CallPrep(**VALID_CALL_PREP)
        assert cp.call_objective == VALID_CALL_PREP["call_objective"]

    def test_key_talking_points_list_preserved(self):
        cp = CallPrep(**VALID_CALL_PREP)
        assert len(cp.key_talking_points) == 4

    def test_questions_to_ask_list_preserved(self):
        cp = CallPrep(**VALID_CALL_PREP)
        assert len(cp.questions_to_ask) == 3

    def test_all_seven_fields_accessible(self):
        cp = CallPrep(**VALID_CALL_PREP)
        assert cp.call_objective
        assert cp.key_talking_points
        assert cp.likely_objection
        assert cp.suggested_objection_handling
        assert cp.questions_to_ask
        assert cp.suggested_opening
        assert cp.desired_outcome


# ---------------------------------------------------------------------------
# 2. CallPrep schema — missing required fields
# ---------------------------------------------------------------------------

class TestCallPrepSchemaMissingFields:
    def test_missing_call_objective_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["call_objective"]
        with pytest.raises(ValidationError) as exc_info:
            CallPrep(**data)
        assert any(e["loc"] == ("call_objective",) for e in exc_info.value.errors())

    def test_missing_key_talking_points_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["key_talking_points"]
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_missing_likely_objection_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["likely_objection"]
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_missing_suggested_objection_handling_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["suggested_objection_handling"]
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_missing_questions_to_ask_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["questions_to_ask"]
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_missing_suggested_opening_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["suggested_opening"]
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_missing_desired_outcome_rejected(self):
        data = {**VALID_CALL_PREP}
        del data["desired_outcome"]
        with pytest.raises(ValidationError):
            CallPrep(**data)


# ---------------------------------------------------------------------------
# 3. CallPrep schema — empty list fields
# ---------------------------------------------------------------------------

class TestCallPrepSchemaEmptyLists:
    def test_empty_key_talking_points_rejected(self):
        data = {**VALID_CALL_PREP, "key_talking_points": []}
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_empty_questions_to_ask_rejected(self):
        data = {**VALID_CALL_PREP, "questions_to_ask": []}
        with pytest.raises(ValidationError):
            CallPrep(**data)


# ---------------------------------------------------------------------------
# 4. CallPrep schema — blank string fields
# ---------------------------------------------------------------------------

class TestCallPrepSchemaBlankStrings:
    def test_blank_call_objective_rejected(self):
        data = {**VALID_CALL_PREP, "call_objective": "   "}
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_empty_suggested_opening_rejected(self):
        data = {**VALID_CALL_PREP, "suggested_opening": ""}
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_empty_desired_outcome_rejected(self):
        data = {**VALID_CALL_PREP, "desired_outcome": ""}
        with pytest.raises(ValidationError):
            CallPrep(**data)

    def test_blank_likely_objection_rejected(self):
        data = {**VALID_CALL_PREP, "likely_objection": "  \t  "}
        with pytest.raises(ValidationError):
            CallPrep(**data)


# ---------------------------------------------------------------------------
# 5 & 6. Service guard: MissingAnalysisError
# ---------------------------------------------------------------------------

class TestCallPrepServiceGuards:
    def test_raises_missing_analysis_error_when_no_analysis(self):
        """
        Import is deferred inside the test to avoid loading app.config
        during collection, which fails due to pydantic-settings / venv
        incompatibility in the base Anaconda Python environment.
        """
        from app.services.call_prep_service import (
            generate_call_prep,
            MissingAnalysisError,
        )
        with pytest.raises(MissingAnalysisError):
            generate_call_prep(LEAD_NO_ANALYSIS)

    def test_missing_analysis_error_message_is_user_friendly(self):
        from app.services.call_prep_service import (
            generate_call_prep,
            MissingAnalysisError,
        )
        with pytest.raises(MissingAnalysisError) as exc_info:
            generate_call_prep(LEAD_NO_ANALYSIS)
        msg = str(exc_info.value)
        assert "AI analysis is required" in msg

    def test_missing_analysis_error_is_not_ai_service_error(self):
        """MissingAnalysisError must be distinct from AIServiceError."""
        from app.services.call_prep_service import MissingAnalysisError
        from app.services.ai_service import AIServiceError
        assert not issubclass(MissingAnalysisError, AIServiceError)
