from app.services.llm_service import complete_with_llm


def improve_abstract(abstract: str) -> str:
    prompt = f"""Rewrite the following research abstract into a stronger academic version.

Make sure to:
- Improve clarity
- Add methodology keywords
- Add evaluation/dataset mentions
- Add quantitative results (if missing)
- Maintain original meaning

Return ONLY the improved abstract as plain prose. No JSON, no headings, no commentary.

Abstract:
{abstract}
"""

    improved = complete_with_llm(
        prompt,
        system="You are an academic editor. Return only the rewritten abstract as plain prose.",
    )

    return improved or abstract
