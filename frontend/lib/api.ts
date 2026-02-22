import { BackendSegment, RouteOption } from "./types";
import { ROUTE_COLORS } from "./constants";

export function getBackendMode(frontendMode: string): string {
  if (frontendMode === "fast") return "fast";
  if (frontendMode === "energy") return "comfortable";
  return "safe";
}

export function segmentToRouteOption(
  seg: BackendSegment,
  index: number,
  explanation: string
): RouteOption {
  const coveragePct = Math.round(seg.roof_coverage * 100);
  const tags: string[] = [];
  if (seg.exposure === 0) tags.push("Indoor");
  else if (coveragePct > 0) tags.push(`${coveragePct}% covered`);
  if (seg.incline === 0) tags.push("Flat");
  else if (seg.incline <= 5) tags.push("Low incline");
  const energyScore = Math.max(10, Math.round((1 - seg.incline / 30) * 60));
  const safetyScore = Math.max(10, Math.round((1 - seg.risk_score) * 60));
  const timeScore = Math.max(5, 100 - energyScore - safetyScore);
  return {
    id: seg.id,
    name: seg.name,
    tags,
    time: Math.max(1, Math.round(seg.distance / 83)),
    scores: [
      { label: "Energy", value: energyScore, color: "#4a90e2" },
      { label: "Safety", value: safetyScore, color: "#6b6b80" },
      { label: "Time", value: timeScore, color: "#4cde5e" },
    ],
    aiExplanation: explanation,
    color: ROUTE_COLORS[index] ?? "#2070e8",
  };
}
