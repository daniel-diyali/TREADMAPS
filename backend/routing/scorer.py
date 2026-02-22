def score_segment(segment: dict, weather: dict, user_constraints: dict) -> float:
    score = (
        (segment["distance"] * 0.10)
        + (segment["incline"] * 0.40)
        + (segment["exposure"] * 0.30)
        + (segment["risk_score"] * 0.20)
    )

    if weather["precipitation"] > 5:
        score *= 1.4

    if user_constraints.get("fatigue", 0) > 0.7:
        score += segment["incline"] * 0.3

    if user_constraints.get("avoid_hills", False) is True:
        score += segment["incline"] * 0.2

    return score
