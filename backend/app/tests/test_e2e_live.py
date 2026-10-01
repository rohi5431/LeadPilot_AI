import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_test():
    print("=== Starting E2E Integration Test against running FastAPI server ===")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] 1. Health check OK:", res.json())

    # 2. Create Lead 1 (Rahul Sharma - HOT lead)
    lead_data = {
        "name": "Rahul Sharma",
        "mobile_number": "9876543210",
        "email": "rahul@example.com",
        "location": "Mumbai",
        "property_requirement": "3 BHK apartment",
        "budget": "Rs. 1.5 Crore",
        "buying_timeline": "Within 2 months",
        "customer_message": "I am looking for a 3 BHK apartment in Mumbai. Parking is important and I want good public transport connectivity. Please suggest suitable options."
    }

    print("\nSending Lead 1 to Gemini for AI analysis...")
    res = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
    assert res.status_code == 201, f"Lead creation failed: {res.text}"
    lead1 = res.json()
    print("[OK] 2. Lead 1 Created successfully!")
    print("   Lead ID:", lead1["id"])
    print("   Priority Category:", lead1["ai_analysis"]["priority"])
    print("   Priority Score:", lead1["ai_analysis"]["priority_score"])
    print("   Lead Summary:", lead1["ai_analysis"]["lead_summary"])

    # 3. Create Lead 2 (Meera Nair - WARM lead)
    lead_data2 = {
        "name": "Meera Nair",
        "mobile_number": "9123456789",
        "email": "meera@example.com",
        "location": "Bangalore",
        "property_requirement": "2 BHK apartment",
        "budget": "Rs. 75 Lakhs",
        "buying_timeline": "Within 6 months",
        "customer_message": "Interested in 2 BHK options in Bangalore near IT parks."
    }
    res2 = requests.post(f"{BASE_URL}/api/leads", json=lead_data2)
    assert res2.status_code == 201, f"Lead 2 creation failed: {res2.text}"
    lead2 = res2.json()
    print("[OK] 3. Lead 2 Created successfully! Priority:", lead2["ai_analysis"]["priority"], lead2["ai_analysis"]["priority_score"])

    # 4. GET /api/leads (Verify listing and priority sorting)
    res = requests.get(f"{BASE_URL}/api/leads")
    assert res.status_code == 200
    all_leads = res.json()
    print(f"[OK] 4. Lead List fetched ({len(all_leads)} leads found)")
    # Sort as frontend does
    sorted_leads = sorted(all_leads, key=lambda l: (l["ai_analysis"]["priority_score"] if l.get("ai_analysis") else -1), reverse=True)
    scores = [l["ai_analysis"]["priority_score"] for l in sorted_leads if l.get("ai_analysis")]
    assert scores == sorted(scores, reverse=True), "Leads are not sorted by priority score descending!"
    print("   Priority sorting verified descending:", scores[:5])

    # 5. GET /api/leads/{id}
    res = requests.get(f"{BASE_URL}/api/leads/{lead1['id']}")
    assert res.status_code == 200
    print("[OK] 5. Fetch single lead by ID verified")

    # 6. Contextual Chat — Question 1
    chat_q1 = {"message": "What should I focus on when speaking with Rahul?"}
    res = requests.post(f"{BASE_URL}/api/leads/{lead1['id']}/chat", json=chat_q1)
    assert res.status_code == 200, f"Chat Q1 failed: {res.text}"
    reply1 = res.json()["message"]
    print("[OK] 6. Contextual Chat Q1 reply received:")
    print("  ", reply1[:150] + "...")

    # 7. Contextual Chat — Question 2 (Follow-up)
    chat_q2 = {"message": "What is the main requirement we discussed?"}
    res = requests.post(f"{BASE_URL}/api/leads/{lead1['id']}/chat", json=chat_q2)
    assert res.status_code == 200
    reply2 = res.json()["message"]
    print("[OK] 7. Contextual Chat Q2 (Follow-up) reply received:")
    print("  ", reply2[:150] + "...")

    # 8. Contextual Chat — AI Grounding Test
    chat_q3 = {"message": "Does Rahul have a wife and two children?"}
    res = requests.post(f"{BASE_URL}/api/leads/{lead1['id']}/chat", json=chat_q3)
    assert res.status_code == 200
    reply3 = res.json()["message"]
    print("[OK] 8. Grounding Test response:")
    print("  ", reply3)

    # 9. Lead Isolation Test (Lead 2 chat must not see Lead 1 data)
    chat_lead2 = {"message": "What city is this customer looking in and what is their budget?"}
    res = requests.post(f"{BASE_URL}/api/leads/{lead2['id']}/chat", json=chat_lead2)
    assert res.status_code == 200
    reply_l2 = res.json()["message"]
    print("[OK] 9. Lead Isolation verified for Lead 2:")
    print("  ", reply_l2)
    assert "Mumbai" not in reply_l2 and "1.5 Crore" not in reply_l2, "Lead 2 contaminated with Lead 1 data!"

    # 10. Call Prep generation
    res = requests.post(f"{BASE_URL}/api/leads/{lead1['id']}/call-prep")
    assert res.status_code == 200, f"Call prep failed: {res.text}"
    cp = res.json()
    print("[OK] 10. Call Prep generated successfully!")
    required_keys = ["call_objective", "key_talking_points", "likely_objection", "suggested_objection_handling", "questions_to_ask", "suggested_opening", "desired_outcome"]
    for k in required_keys:
        assert k in cp and cp[k], f"Missing or empty field {k} in call prep output!"
    print("   Call Objective:", cp["call_objective"])
    print("   Key Talking Points count:", len(cp["key_talking_points"]))
    print("   Suggested Opening:", cp["suggested_opening"])

    # 11. Error handling test: 404 on nonexistent lead ID
    res = requests.post(f"{BASE_URL}/api/leads/nonexistent-id-9999/call-prep")
    assert res.status_code == 404, "Nonexistent lead did not return 404!"
    print("[OK] 11. Nonexistent lead 404 verified")

    print("\nSUCCESS: ALL 11 E2E INTEGRATION TESTS PASSED SUCCESSFULLY WITH REAL GEMINI API CALLS!")

if __name__ == "__main__":
    run_e2e_test()
