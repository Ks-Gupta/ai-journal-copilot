import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

settings = Settings()

if not settings.GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not found")