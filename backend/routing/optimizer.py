import copy
from backend.routing.scorer import score_segment


def optimize_route(segments: list, weather: dict, user_constraints: dict, mode: str, destination_key: str = "") -> list:
    # Filter to only segments matching the requested destination
    filtered = [s for s in segments if not destination_key or s.get("destination_key") == destination_key]
    if not filtered:
        filtered = segments  # fallback: return all if no match

    scored = [dict(s) for s in copy.deepcopy(filtered)]
    for segment in scored:
        segment["_score"] = score_segment(segment, weather, user_constraints)

    if mode == "safe":
        sorted_segments = sorted(scored, key=lambda s: s["exposure"])
    elif mode == "fast":
        sorted_segments = sorted(scored, key=lambda s: s["distance"])
    elif mode == "comfortable":
        sorted_segments = sorted(scored, key=lambda s: s["incline"])
    else:
        sorted_segments = sorted(scored, key=lambda s: s["_score"])

    return sorted_segments[:3]
