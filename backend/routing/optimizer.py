from backend.routing.scorer import score_segment


def optimize_route(segments: list, weather: dict, user_constraints: dict, mode: str) -> list:
    for segment in segments:
        segment["_score"] = score_segment(segment, weather, user_constraints)

    if mode == "safe":
        sorted_segments = sorted(segments, key=lambda s: s["exposure"])
    elif mode == "fast":
        sorted_segments = sorted(segments, key=lambda s: s["distance"])
    elif mode == "comfortable":
        sorted_segments = sorted(segments, key=lambda s: s["incline"])
    else:
        sorted_segments = sorted(segments, key=lambda s: s["_score"])

    return sorted_segments[:3]
