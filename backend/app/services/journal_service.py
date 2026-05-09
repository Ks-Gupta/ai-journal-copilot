from app.data.journals import JOURNAL_DB
from app.services.embedding_service import (
    get_embedding,
    cosine_similarity,
)
from app.services.vector_db import search


def score_journal(journal, llm_data):
    score = 0

    domain = str(
        llm_data.get("domain", "")
    ).lower()

    keywords = [
        str(k).lower()
        for k in llm_data.get("keywords", [])
    ]

    journal_domains = [
        str(d).lower()
        for d in journal.get("domains", [])
    ]

    journal_keywords = [
        str(k).lower()
        for k in journal.get("keywords", [])
    ]

    journal_methods = [
        str(m).lower()
        for m in journal.get("methods", [])
    ]

    # ✅ Domain match
    for d in journal_domains:
        if d in domain or domain in d:
            score += 30

    # ✅ Keyword match
    for k in keywords:
        for jk in journal_keywords:
            if k in jk or jk in k:
                score += 10

    # ✅ Method match
    for k in keywords:
        if k in journal_methods:
            score += 20

    return score


def generate_reason(
    semantic_score,
    rule_score,
    journal,
    llm_data,
):
    """Build a per-journal reason string with specific signals.

    Prefers concrete references to matched domain/keywords over generic
    phrasing so each card has its own informative reason.
    """
    parts: list[str] = []

    # Semantic similarity (lower thresholds so most journals get a signal)
    if semantic_score >= 70:
        parts.append("Strong semantic similarity to your abstract")
    elif semantic_score >= 55:
        parts.append("Moderate semantic overlap with the abstract")

    # Domain match — name the matched domain for specificity
    domain = str(llm_data.get("domain", "")).lower().strip()
    matched_domain: str | None = None
    if domain:
        for d in journal.get("domains", []):
            d_str = str(d).strip()
            if not d_str:
                continue
            d_low = d_str.lower()
            if domain == d_low or domain in d_low or d_low in domain:
                matched_domain = d_str
                break
    if matched_domain:
        parts.append(f"Aligned with the journal's {matched_domain} scope")

    # Keyword overlap — name 1-2 actually matched keywords
    abstract_keywords = [
        str(k).lower().strip()
        for k in (llm_data.get("keywords") or [])
        if str(k).strip()
    ]
    journal_keywords = [
        str(k).strip()
        for k in journal.get("keywords", [])
        if str(k).strip()
    ]
    matched_kw: list[str] = []
    for ak in abstract_keywords:
        for jk in journal_keywords:
            jk_low = jk.lower()
            if ak == jk_low or ak in jk_low or jk_low in ak:
                if jk not in matched_kw:
                    matched_kw.append(jk)
                break
        if len(matched_kw) >= 2:
            break
    if matched_kw:
        parts.append(f"Covers your topics: {', '.join(matched_kw)}")

    # Methodology alignment — name the matched method
    methodology_signal = str(llm_data.get("methodology", "")).lower()
    matched_method: str | None = None
    for m in journal.get("methods", []):
        m_str = str(m).strip()
        if m_str and m_str.lower() in methodology_signal:
            matched_method = m_str
            break
    if matched_method:
        parts.append(f"Methodology fit ({matched_method})")

    # Subfield reference if domain didn't match
    if not matched_domain:
        subfield = str(llm_data.get("subfield", "")).strip()
        if subfield:
            parts.append(f"Adjacent to your {subfield} focus")

    # Last-resort fallback — describe what the journal publishes
    if not parts:
        domains = [str(d) for d in journal.get("domains", []) if str(d).strip()]
        if domains:
            parts.append(f"Publishes work in {', '.join(domains[:2])}")
        else:
            parts.append("Topical overlap with your research area")

    return ". ".join(parts) + "."


def get_fit_label(score):

    if score >= 85:
        return "Excellent Fit"

    elif score >= 75:
        return "High Fit"

    elif score >= 50:
        return "Moderate Fit"

    return "Low Fit"


def normalize_score(score):

    # stronger boost
    boosted = (score * 1.6) + 35

    return int(
        max(
            55,
            min(95, boosted)
        )
    )


def recommend_journals_hybrid(
    abstract: str,
    llm_data
):
    abstract_vec = get_embedding(abstract)

    results = []

    for j in JOURNAL_DB:

        # ✅ Semantic score
        semantic_score = (
            cosine_similarity(
                abstract_vec,
                j["embedding"]
            ) * 100
        )

        # ✅ Rule score
        rule_score = score_journal(
            j,
            llm_data
        )

        # ✅ Hybrid score
        final_score = (
            semantic_score * 0.7
            + rule_score * 0.3
        )

        score = int(final_score)

        # ✅ Normalized score
        normalized_score = normalize_score(
            score
        )

        # ✅ Fit label
        label = get_fit_label(
            normalized_score
        )

        # ✅ Dynamic reasoning
        reason = generate_reason(
            semantic_score,
            rule_score,
            j,
            llm_data
        )

        results.append({
            "name": j["name"],
            "match_score": normalized_score,
            "fit_label": label,
            "reason": reason,
            "impact_factor": j.get("impact_factor"),
            "quartile": j.get("quartile"),
            "publisher": j.get("publisher"),
            "submission_url": j.get("submission_url"),
        })

    return sorted(
        results,
        key=lambda x: x["match_score"],
        reverse=True
    )[:3]


def recommend_journals_pro(
    abstract: str,
    llm_data
):
    query_vec = get_embedding(abstract)

    try:
        candidates = search(
            query_vec,
            k=10
        )

    except Exception as e:
        print(
            "FAISS failed, fallback:",
            e
        )

        return recommend_journals_hybrid(
            abstract,
            llm_data
        )

    results = []

    for j in candidates:

        # ✅ Semantic score
        semantic_score = (
            cosine_similarity(
                query_vec,
                j["embedding"]
            ) * 100
        )

        # ✅ Rule score
        rule_score = score_journal(
            j,
            llm_data
        )

        # ✅ Hybrid score
        final_score = (
            semantic_score * 0.7
            + rule_score * 0.3
        )

        score = int(final_score)

        # ✅ Normalized score
        normalized_score = normalize_score(
            score
        )

        # ✅ Fit label
        label = get_fit_label(
            normalized_score
        )

        # ✅ Dynamic reasoning
        reason = generate_reason(
            semantic_score,
            rule_score,
            j,
            llm_data
        )

        results.append({
            "name": j.get("name", "Unknown Journal"),
            "match_score": normalized_score,
            "fit_label": label,
            "reason": reason,
            "impact_factor": j.get("impact_factor"),
            "quartile": j.get("quartile"),
            "publisher": j.get("publisher"),
            "submission_url": j.get("submission_url"),
        })

    return sorted(
        results,
        key=lambda x: x["match_score"],
        reverse=True
    )[:3]

