export interface RouteOption {
  id: string;
  name: string;
  tags: string[];
  time: number;
  scores: { label: string; value: number; color: string }[];
  aiExplanation: string;
  color: string;
}

export interface BackendSegment {
  id: string;
  name: string;
  distance: number;
  incline: number;
  exposure: number;
  roof_coverage: number;
  surface: string;
  risk_score: number;
}

export interface HazardResult {
  hazard_level: "low" | "medium" | "high";
  key_hazards: string[];
  risk_score: number;
  spoken_summary?: string;
}
