import os
from typing import Any, Dict, List, Optional

import requests

OPENALEX_URL = "https://api.openalex.org/works"
OPENALEX_SOURCES_URL = "https://api.openalex.org/sources"
SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
TIMEOUT_S = 8

USER_AGENT = "ai-journal-copilot/1.0 (mailto:research@example.com)"

# In-memory cache for journal source lookups (process lifetime)
_SOURCE_CACHE: Dict[str, Optional[Dict[str, Any]]] = {}


def _candidate_queries(abstract: str, keywords: List[str] | None) -> List[str]:
    """Return queries from most-specific to most-permissive.

    OpenAlex relevance scoring tightens with query length — long combined
    queries can return ~1 result on niche topics. We try the rich query
    first, then fall back to keyword-only, then to the abstract head.
    """
    snippet = (abstract or "").strip()[:160]
    cleaned: List[str] = []
    if keywords:
        cleaned = [str(k).strip() for k in keywords if str(k).strip()]

    queries: List[str] = []
    if cleaned and snippet:
        queries.append(" ".join(cleaned[:5]) + " " + snippet)
    if cleaned:
        queries.append(" ".join(cleaned[:6]))
    if snippet:
        queries.append(snippet)
    # Dedupe while preserving order
    seen: set[str] = set()
    return [q for q in queries if not (q in seen or seen.add(q))]


def _abstract_from_inverted_index(idx: Dict[str, List[int]] | None) -> str:
    if not idx:
        return ""
    positions: List[tuple[int, str]] = []
    for word, locs in idx.items():
        for loc in locs:
            positions.append((loc, word))
    positions.sort()
    return " ".join(w for _, w in positions)[:400]


def _normalize_openalex(p: Dict[str, Any]) -> Dict[str, Any]:
    authorships = p.get("authorships") or []
    authors = []
    for a in authorships:
        name = (a.get("author") or {}).get("display_name")
        if name:
            authors.append(name)

    primary = p.get("primary_location") or {}
    source = primary.get("source") or {}
    venue = source.get("display_name")

    open_access = p.get("open_access") or {}
    is_oa = bool(open_access.get("is_oa"))
    oa_url = open_access.get("oa_url")

    return {
        "title": p.get("title") or "Untitled",
        "authors": authors[:5],
        "total_authors": len(authorships),
        "year": p.get("publication_year"),
        "is_oa": is_oa,
        "oa_url": oa_url,
        "type": p.get("type"),
        "venue": venue,
        "abstract": _abstract_from_inverted_index(p.get("abstract_inverted_index")),
        "url": p.get("doi") or primary.get("landing_page_url") or p.get("id") or "",
        # Prefer free OA PDF when available
        "preferred_url": oa_url or p.get("doi") or primary.get("landing_page_url") or p.get("id") or "",
        "citation_count": p.get("cited_by_count"),
    }


def _normalize_semantic_scholar(p: Dict[str, Any]) -> Dict[str, Any]:
    authors = p.get("authors") or []
    ext = p.get("externalIds") or {}
    doi = ext.get("DOI")
    return {
        "title": p.get("title") or "Untitled",
        "authors": [a.get("name") for a in authors if a.get("name")][:5],
        "year": p.get("year"),
        "venue": p.get("venue"),
        "abstract": (p.get("abstract") or "")[:400],
        "url": p.get("url") or (f"https://doi.org/{doi}" if doi else ""),
        "citation_count": p.get("citationCount"),
    }


def _fetch_openalex(query: str, limit: int) -> List[Dict[str, Any]]:
    try:
        resp = requests.get(
            OPENALEX_URL,
            params={
                "search": query,
                "per-page": limit,
                "select": (
                    "id,title,authorships,publication_year,primary_location,"
                    "abstract_inverted_index,doi,cited_by_count,open_access,type"
                ),
            },
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT_S,
        )
        if resp.status_code != 200:
            print(f"OpenAlex returned {resp.status_code}: {resp.text[:200]}")
            return []
        results = (resp.json() or {}).get("results") or []
        return [_normalize_openalex(p) for p in results if p.get("title")]
    except requests.RequestException as e:
        print("OpenAlex fetch failed:", e)
        return []


def _fetch_semantic_scholar(query: str, limit: int) -> List[Dict[str, Any]]:
    api_key = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
    if not api_key:
        return []
    try:
        resp = requests.get(
            SEMANTIC_SCHOLAR_URL,
            params={
                "query": query,
                "limit": limit,
                "fields": "title,authors,year,url,abstract,venue,externalIds,citationCount",
            },
            headers={"x-api-key": api_key},
            timeout=TIMEOUT_S,
        )
        if resp.status_code != 200:
            print(f"Semantic Scholar returned {resp.status_code}: {resp.text[:200]}")
            return []
        papers = (resp.json() or {}).get("data") or []
        return [_normalize_semantic_scholar(p) for p in papers if p.get("title")]
    except requests.RequestException as e:
        print("Semantic Scholar fetch failed:", e)
        return []


def fetch_related_papers(
    abstract: str,
    keywords: List[str] | None = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Search for papers related to the abstract.

    Tries Semantic Scholar first if SEMANTIC_SCHOLAR_API_KEY is set
    (better academic coverage), otherwise OpenAlex (no key needed).
    Falls through progressively shorter queries if the first returns few results.
    """
    queries = _candidate_queries(abstract, keywords)
    if not queries:
        return []

    use_ss = bool(os.getenv("SEMANTIC_SCHOLAR_API_KEY"))

    for query in queries:
        results = _fetch_semantic_scholar(query, limit) if use_ss else []
        if not results:
            results = _fetch_openalex(query, limit)
        if len(results) >= 3:
            return results

    # Return whatever the last attempt produced (may be 0-2 results)
    return results


def fetch_source_metadata(name: str) -> Optional[Dict[str, Any]]:
    """Look up a journal in OpenAlex /sources by name, with in-memory caching.

    Returns live metadata: ISSN, h-index, 2-year mean citedness (proxy IF),
    homepage URL, publisher, OA status, works count.
    Returns None if not found or the API call fails.
    """
    if not name:
        return None

    cached = _SOURCE_CACHE.get(name, "MISS")
    if cached != "MISS":
        return cached  # type: ignore[return-value]

    try:
        resp = requests.get(
            OPENALEX_SOURCES_URL,
            params={
                "search": name,
                "per-page": 1,
                "select": (
                    "id,display_name,issn_l,homepage_url,host_organization_name,"
                    "is_oa,is_in_doaj,summary_stats,works_count,type"
                ),
            },
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT_S,
        )
        if resp.status_code != 200:
            _SOURCE_CACHE[name] = None
            return None
        results = (resp.json() or {}).get("results") or []
        if not results:
            _SOURCE_CACHE[name] = None
            return None

        s = results[0]
        stats = s.get("summary_stats") or {}
        normalized = {
            "openalex_id": s.get("id"),
            "display_name": s.get("display_name"),
            "issn": s.get("issn_l"),
            "homepage_url": s.get("homepage_url"),
            "publisher": s.get("host_organization_name"),
            "is_oa": s.get("is_oa"),
            "is_in_doaj": s.get("is_in_doaj"),
            "h_index": stats.get("h_index"),
            "two_year_mean_citedness": stats.get("2yr_mean_citedness"),
            "works_count": s.get("works_count"),
            "type": s.get("type"),
        }
        _SOURCE_CACHE[name] = normalized
        return normalized
    except requests.RequestException as e:
        print(f"OpenAlex source lookup failed for {name!r}: {e}")
        return None
