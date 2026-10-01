from google import genai
from app.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)
try:
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print("Error listing models:", e)
