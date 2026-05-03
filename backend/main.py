from typing import Optional
from fastapi import FastAPI, Request
from pydantic import BaseModel
from groq import Groq
import os
from dotenv import load_dotenv
import json
import re
from fastapi.middleware.cors import CORSMiddleware

# Load env
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 🔑 GROQ SETUP
# =========================

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("❌ GROQ_API_KEY not found. Add it to .env file")

client = Groq(api_key=api_key)

# =========================
# 📦 MODELS
# =========================

class PaperInput(BaseModel):
    abstract: Optional[str] = ""

# =========================
# 🏠 HOME
# =========================

@app.post("/improve")
async def improve(request: Request):
    try:
        data = await request.json()
        abstract = data.get("abstract", "")

        prompt = f"""
Rewrite the following research abstract into a stronger academic version.

Make sure to:
- Improve clarity
- Add methodology keywords
- Add evaluation/dataset mentions
- Add quantitative results (if missing)
- Maintain original meaning

Return ONLY the improved abstract.

Abstract:
{abstract}
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )

        improved = response.choices[0].message.content.strip()

        return {
            "status": "success",
            "improved_abstract": f"{abstract}\n\n--- Improved Version ---\n{improved}"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

# =========================
# 🧠 SCORING FUNCTION
# =========================

def compute_score(text: str):
    text = text.lower()
    score = 0
    breakdown = []

    # 1. Length
    if len(text) > 200:
        score += 1
        breakdown.append("✔ Abstract length is sufficient (+10)")
    else:
        breakdown.append("✖ Abstract is too short (+0)")

    # 2. Method
    if any(w in text for w in ["method", "approach", "framework", "model"]):
        score += 1
        breakdown.append("✔ Methodology described (+10)")
    else:
        breakdown.append("✖ Methodology missing (+0)")

    # 3. Results
    if any(w in text for w in ["result", "accuracy", "%", "performance"]):
        score += 1
        breakdown.append("✔ Results/metrics included (+10)")
    else:
        breakdown.append("✖ No clear results mentioned (+0)")

    # 4. Experiments
    if any(w in text for w in ["dataset", "benchmark", "evaluation", "validation"]):
        score += 1
        breakdown.append("✔ Experimental validation present (+10)")
    else:
        breakdown.append("✖ No dataset/experiments mentioned (+0)")

    return score, breakdown

# =========================
# 📊 ANALYZE
# =========================

@app.post("/analyze")
def analyze_paper(data: PaperInput):
    try:
        prompt = f"""
You are an academic publishing expert.

Analyze the research abstract and return STRICT JSON in this format:

{{
  "domain": "...",
  "subfield": "...",
  "journals": [
    {{"name": "...", "match_score": 0-100}},
    {{"name": "...", "match_score": 0-100}},
    {{"name": "...", "match_score": 0-100}}
  ],
  "acceptance_probability": 0-100,
  "reasons": ["...", "..."],
  "improvements": ["...", "..."]
}}

Abstract:
{data.abstract}
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        raw_result = response.choices[0].message.content

        try:
            json_text = re.search(r'\{.*\}', raw_result, re.DOTALL).group()
            parsed = json.loads(json_text)

            # 🔥 limit journals
            parsed["journals"] = parsed.get("journals", [])[:3]

            # =========================
            # 🔥 DYNAMIC SCORING
            # =========================

            full_text = data.abstract or ""

            if "--- Improved Version ---" in full_text:
                base_text = full_text.split("--- Improved Version ---")[0]
                improved_text = full_text.split("--- Improved Version ---")[1]
            else:
                base_text = full_text
                improved_text = full_text

            base_score, base_breakdown = compute_score(base_text)
            improved_score, _ = compute_score(improved_text)

            # Improvement boost
            delta = max(0, improved_score - base_score)

            acceptance = 50 + base_score * 10 + delta * 5
            acceptance = min(95, acceptance)

            # Final breakdown
            final_breakdown = base_breakdown.copy()

            if delta > 0:
                final_breakdown.append(f"✨ AI improvement boost (+{delta * 5})")

            parsed["acceptance_probability"] = acceptance
            parsed["score_breakdown"] = final_breakdown

        except Exception:
         parsed = {
                "domain": "Unknown",
                "subfield": "Unknown",
                "journals": [],
                "acceptance_probability": 50,
                "reasons": ["Could not fully analyze the abstract"],
                "improvements": ["Try refining your abstract"],
                "score_breakdown": ["⚠ AI response parsing failed"]
        }

        return {
            "status": "success",
            "analysis": parsed
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }