export interface RouteOption {
  id: string;
  name: string;
  tags: string[];
  time: number;
  scores: { label: string; value: number; color: string }[];
  aiExplanation: string;
  color: string;
  waypoints: { lat: number; lng: number }[];
  path: { lat: number; lng: number }[];
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
  waypoints?: { lat: number; lng: number }[];
  path?: { lat: number; lng: number }[];
}

export interface HazardResult {
  hazard_level: "low" | "medium" | "high";
  key_hazards: string[];
  risk_score: number;
  spoken_summary?: string;
}
