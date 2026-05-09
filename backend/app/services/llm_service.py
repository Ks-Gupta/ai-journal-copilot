from groq import Groq
from app.core.config import settings
import json

client = Groq(api_key=settings.GROQ_API_KEY)

def analyze_with_llm(abstract: str):
    prompt = f"""
        Analyze the abstract and return JSON:

        {{
        "domain": "...",
        "subfield": "...",
        "keywords": ["...", "...", "..."],
        "clarity_score": 0-100,
        "novelty_score": 0-100,
        "methodology": true/false,
        "experiments": true/false,
        "results": true/false,
        "reasons": [],
        "improvements": [],
        "review": {{
            "decision": "Accept/Reject/Revise",
            "confidence": 0-100,
            "summary": "...",
            "strengths": [],
            "weaknesses": []
        }}
        }}

        Return ONLY valid JSON.

        Abstract:
        {abstract}
        """


    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Return ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    return response.choices[0].message.content


def complete_with_llm(prompt: str, system: str | None = None) -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=messages,
        temperature=0.4,
    )

    return (response.choices[0].message.content or "").strip()