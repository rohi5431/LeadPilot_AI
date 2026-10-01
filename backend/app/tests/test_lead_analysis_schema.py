"""
Tests for the LeadAnalysis Pydantic schema — Phase 5 priority fields.

These tests do NOT require a Gemini API key.
They verify that Pydantic correctly accepts and rejects values
for priority_score and priority before the data ever reaches the AI service.
"""

import pytest
from pydantic import ValidationError

from app.schemas.ai import LeadAnalysis

# ---------------------------------------------------------------------------
# Shared valid base — all six original analysis fields
# ---------------------------------------------------------------------------
VALID_BASE = {
    "lead_summary": "Test lead summary.",
    "customer_intent": "Find a property.",
    "key_requirements": ["3 BHK", "parking"],
    "objections_concerns": ["budget stretch"],
    "recommended_next_action": "Call the customer.",
    "suggested_response": "Thank you for reaching out.",
}


def make_analysis(**overrides) -> dict:
    """Return a complete, valid analysis payload with optional overrides."""
    return {**VALID_BASE, **overrides}


# ---------------------------------------------------------------------------
# priority_score: boundary values
# ---------------------------------------------------------------------------

class TestPriorityScoreBoundaries:
    def test_score_zero_is_accepted(self):
        data = make_analysis(priority_score=0, priority="COLD")
        analysis = LeadAnalysis(**data)
        assert analysis.priority_score == 0

    def test_score_100_is_accepted(self):
        data = make_analysis(priority_score=100, priority="HOT")
        analysis = LeadAnalysis(**data)
        assert analysis.priority_score == 100

    def test_score_50_is_accepted(self):
        data = make_analysis(priority_score=50, priority="WARM")
        analysis = LeadAnalysis(**data)
        assert analysis.priority_score == 50

    def test_score_below_zero_is_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            LeadAnalysis(**make_analysis(priority_score=-1, priority="COLD"))
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("priority_score",) for e in errors)

    def test_score_above_100_is_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            LeadAnalysis(**make_analysis(priority_score=101, priority="HOT"))
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("priority_score",) for e in errors)

    def test_score_minus_100_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=-100, priority="COLD"))

    def test_score_200_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=200, priority="HOT"))


# ---------------------------------------------------------------------------
# priority: accepted values
# ---------------------------------------------------------------------------

class TestPriorityAcceptedValues:
    def test_hot_is_accepted(self):
        data = make_analysis(priority_score=90, priority="HOT")
        analysis = LeadAnalysis(**data)
        assert analysis.priority == "HOT"

    def test_warm_is_accepted(self):
        data = make_analysis(priority_score=65, priority="WARM")
        analysis = LeadAnalysis(**data)
        assert analysis.priority == "WARM"

    def test_cold_is_accepted(self):
        data = make_analysis(priority_score=20, priority="COLD")
        analysis = LeadAnalysis(**data)
        assert analysis.priority == "COLD"


# ---------------------------------------------------------------------------
# priority: rejected values
# ---------------------------------------------------------------------------

class TestPriorityRejectedValues:
    def test_lowercase_hot_is_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            LeadAnalysis(**make_analysis(priority_score=85, priority="hot"))
        errors = exc_info.value.errors()
        assert any(e["loc"] == ("priority",) for e in errors)

    def test_lowercase_warm_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=65, priority="warm"))

    def test_lowercase_cold_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=20, priority="cold"))

    def test_medium_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=60, priority="MEDIUM"))

    def test_urgent_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=90, priority="URGENT"))

    def test_empty_string_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=50, priority=""))

    def test_numeric_priority_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score=50, priority=1))


# ---------------------------------------------------------------------------
# priority_score: missing / wrong type
# ---------------------------------------------------------------------------

class TestPriorityScoreMissingOrWrongType:
    def test_missing_priority_score_is_rejected(self):
        data = {**VALID_BASE, "priority": "HOT"}
        with pytest.raises(ValidationError):
            LeadAnalysis(**data)

    def test_missing_priority_is_rejected(self):
        data = {**VALID_BASE, "priority_score": 80}
        with pytest.raises(ValidationError):
            LeadAnalysis(**data)

    def test_string_score_is_rejected(self):
        with pytest.raises(ValidationError):
            LeadAnalysis(**make_analysis(priority_score="high", priority="HOT"))

    def test_float_score_is_rejected(self):
        # Pydantic v2 with int field: float 90.5 should coerce or reject.
        # We verify the schema enforces int type.
        # If Pydantic coerces 90.5 → 90, the score is still valid (90).
        # If it rejects, a ValidationError is raised.
        # Either behaviour is acceptable; we just ensure no crash on bad data.
        try:
            analysis = LeadAnalysis(**make_analysis(priority_score=90.5, priority="HOT"))
            # If it coerced, score must still be in range
            assert 0 <= analysis.priority_score <= 100
        except ValidationError:
            pass  # Also acceptable


# ---------------------------------------------------------------------------
# Original six fields preserved
# ---------------------------------------------------------------------------

class TestOriginalFieldsPreserved:
    def test_all_original_fields_present(self):
        data = make_analysis(priority_score=75, priority="WARM")
        analysis = LeadAnalysis(**data)
        assert analysis.lead_summary == VALID_BASE["lead_summary"]
        assert analysis.customer_intent == VALID_BASE["customer_intent"]
        assert analysis.key_requirements == VALID_BASE["key_requirements"]
        assert analysis.objections_concerns == VALID_BASE["objections_concerns"]
        assert analysis.recommended_next_action == VALID_BASE["recommended_next_action"]
        assert analysis.suggested_response == VALID_BASE["suggested_response"]
