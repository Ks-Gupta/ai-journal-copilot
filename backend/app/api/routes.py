from fastapi import APIRouter, Request, HTTPException
from app.models.schemas import PaperInput
from app.services.llm_service import analyze_with_llm
from app.services.scoring_service import compute_score
from app.services.journal_service import recommend_journals_pro
from app.services.improvement_service import improve_abstract
from app.services.history_service import get_history, save_history
from app.services.paper_service import fetch_related_papers, fetch_source_metadata
from concurrent.futures import ThreadPoolExecutor
from app.utils.parser import safe_parse_json
from app.services.journal_service import recommend_journals_hybrid

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Journal Copilot API",
    }


@router.post("/analyze")
def analyze(data: PaperInput):

    if len(data.abstract.split()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Abstract too short for analysis"
        )

    raw = analyze_with_llm(data.abstract)
    llm_data = safe_parse_json(raw) or {}

    # 🔥 safety defaults
    llm_data.setdefault("keywords", [])
    llm_data.setdefault("clarity_score", 10)
    llm_data.setdefault("novelty_score", 10)
    llm_data.setdefault("methodology", False)
    llm_data.setdefault("experiments", False)
    llm_data.setdefault("results", False)

    # 🔥 Technical depth scoring
    technical_depth = 0

    if llm_data.get("methodology"):
        technical_depth += 30

    if llm_data.get("experiments"):
        technical_depth += 30

    if llm_data.get("results"):
        technical_depth += 20

    if len(llm_data.get("keywords", [])) > 5:
        technical_depth += 20

    # 🔥 Results quality
    results_score = 0

    numeric_terms = [
        "%",
        "accuracy",
        "f1-score",
        "precision",
        "recall",
        "benchmark",
        "evaluation",
        "performance"
    ]

    for term in numeric_terms:
        if term in data.abstract.lower():
            results_score += 15

    results_score = min(100, results_score)

    if "benchmark" in data.abstract.lower():
        results_score += 30

    if "accuracy" in data.abstract.lower():
        results_score += 30

    # 🔥 Submission readiness
    readiness_score = int(
        (
            llm_data["clarity_score"] * 0.3 +
            llm_data["novelty_score"] * 0.25 +
            technical_depth * 0.25 +
            results_score * 0.2
        )
    )

    try:
        journals = recommend_journals_pro(data.abstract, llm_data)

    except Exception as e:
        print("FAISS failed, using fallback:", e)
        journals = recommend_journals_hybrid(data.abstract, llm_data)

    # 🔥 Base score
    acceptance, breakdown = compute_score(llm_data)

    # 🔥 Smart acceptance probability
    acceptance = int(
    (
        llm_data["clarity_score"] * 0.25 +
        llm_data["novelty_score"] * 0.25 +
        technical_depth * 0.2 +
        results_score * 0.1 +
        journals[0]["match_score"] * 0.2
    )
)

    acceptance = min(95, max(35, acceptance))

    confidence = int(
        (
            llm_data["clarity_score"] * 0.4 +
            journals[0]["match_score"] * 0.6
        )
    )

    review = llm_data.get("review", {})

    weaknesses = review.get("weaknesses") or [
        "Limited experimental validation details",
        "Could improve comparative analysis with prior work",
        "Quantitative impact metrics could be strengthened",
    ]
    strengths = review.get("strengths") or [
        "Clear problem framing",
        "Relevant methodology for the stated objective",
    ]

    # Improvements should read as distinct, actionable next steps —
    # NOT a rephrasing of weaknesses (that creates visible duplication).
    GENERIC_IMPROVEMENTS = [
        "Add comparative benchmarking against prior state-of-the-art",
        "Include statistical significance analysis on key metrics",
        "Expand experimental evaluation with additional datasets",
        "Discuss scalability, threats to validity, and limitations explicitly",
        "Strengthen the related-work section with recent citations",
        "Provide ablations to isolate the contribution of each component",
    ]

    improvements = [s for s in (llm_data.get("improvements") or []) if str(s).strip()]
    if len(improvements) < 3:
        # Fill from generic list, keeping any LLM-provided items first
        for item in GENERIC_IMPROVEMENTS:
            if item not in improvements:
                improvements.append(item)
            if len(improvements) >= 4:
                break

    related_papers = fetch_related_papers(
        data.abstract,
        llm_data.get("keywords"),
        limit=5,
    )

    # 🔥 Enrich top journals with live OpenAlex metadata (parallel)
    def _enrich(j: dict) -> dict:
        meta = fetch_source_metadata(j["name"])
        if meta:
            j = {
                **j,
                "issn": meta.get("issn"),
                "homepage_url": meta.get("homepage_url"),
                "h_index": meta.get("h_index"),
                "two_year_mean_citedness": meta.get("two_year_mean_citedness"),
                "is_oa": meta.get("is_oa"),
                "works_count": meta.get("works_count"),
                "openalex_id": meta.get("openalex_id"),
            }
            if meta.get("publisher"):
                j["publisher"] = meta["publisher"]
            if meta.get("homepage_url"):
                j["submission_url"] = meta["homepage_url"]
        return j

    with ThreadPoolExecutor(max_workers=min(len(journals), 4) or 1) as pool:
        journals = list(pool.map(_enrich, journals))

    parsed = {
        "domain": llm_data.get("domain", "Unknown"),
        "subfield": llm_data.get("subfield", "Unknown"),
        "journals": journals,
        "related_papers": related_papers,
        "acceptance_probability": acceptance,
        "score_breakdown": [
            *(b for b in breakdown if b["metric"] not in ("Technical Depth", "Results")),
            {
                "metric": "Technical Depth",
                "percentage": technical_depth
            },
            {
                "metric": "Results Quality",
                "percentage": results_score
            }
        ],
        "reasons": llm_data.get("reasons", []),
        "improvements": improvements,
        "submission_readiness": readiness_score,
        "review": {
            "decision": review.get("decision", "Unknown"),
            "confidence": confidence,
            "summary": review.get("summary", "No summary available"),
            "strengths": strengths,
            "weaknesses": weaknesses
        }
    }

    save_history(data.abstract, parsed)

    return {
        "status": "success",
        "analysis": parsed
    }



@router.post("/improve")
async def improve(request: Request):
    try:
        data = await request.json()
        abstract = data.get("abstract", "")

        improved = improve_abstract(abstract)

        return {
            "status": "success",
            "improved_abstract": improved
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
    
@router.get("/history")
def fetch_history():
    return {
        "status": "success",
        "history": get_history()
    }