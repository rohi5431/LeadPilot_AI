import sys
from google import genai
from google.genai import types as genai_types
from app.config import settings
from app.schemas.ai import LeadAnalysis

print("Testing Gemini API with model: gemini-3.5-flash-lite")
try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents="Analyse lead Rahul Sharma, 3 BHK in Mumbai, budget 1.5Cr.",
        config=genai_types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=LeadAnalysis,
        ),
    )
    print("Success! Response parsed:", response.parsed)
except Exception as e:
    print("Error calling Gemini API:", e)
