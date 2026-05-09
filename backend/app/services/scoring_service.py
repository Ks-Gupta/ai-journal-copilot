def compute_score(llm_data):
    clarity = llm_data["clarity_score"]
    novelty = llm_data["novelty_score"]

    technical = 0
    if llm_data["methodology"]:
        technical += 30
    if llm_data["experiments"]:
        technical += 30

    results = 40 if llm_data["results"] else 10

    overall = int(
        clarity * 0.25 +
        novelty * 0.25 +
        technical * 0.25 +
        results * 0.25
    )

    breakdown = [
        {"metric": "Clarity", "percentage": clarity},
        {"metric": "Novelty", "percentage": novelty},
        {"metric": "Technical Depth", "percentage": technical},
        {"metric": "Results", "percentage": results}
    ]

    return overall, breakdown