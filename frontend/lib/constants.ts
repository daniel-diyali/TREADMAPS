import { RouteOption } from "./types";

export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export const WSU_CENTER = { lat: 46.7298, lng: -117.1817 };

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const ROUTE_COLORS = ["#2070e8", "#f5a623", "#10b981"];

export const MODES = [
  { id: "rain",   label: "Rain",   icon: "🌧️" },
  { id: "snow",   label: "Snow",   icon: "❄️" },
  { id: "wind",   label: "Wind",   icon: "💨" },
  { id: "dry",    label: "Dry",    icon: "☀️" },
  { id: "icy",    label: "Icy",    icon: "🧊" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "fast",   label: "Fast",   icon: "🏃" },
];

export const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "indoor",
    name: "Energy Saver",
    tags: ["92% covered", "No stairs"],
    time: 12,
    scores: [
      { label: "Energy", value: 50, color: "#4a90e2" },
      { label: "Safety", value: 20, color: "#6b6b80" },
      { label: "Time",   value: 30, color: "#4cde5e" },
    ],
    aiExplanation: "Keeps you mostly inside and away from stairs — good call in icy weather.",
    color: "#2070e8",
  },
  {
    id: "fastest",
    name: "Fastest Route",
    tags: ["⚡ Quickest", "Outdoor"],
    time: 9,
    scores: [
      { label: "Speed",  value: 65, color: "#f5a623" },
      { label: "Safety", value: 25, color: "#6b6b80" },
      { label: "Time",   value: 10, color: "#4cde5e" },
    ],
    aiExplanation: "Gets you there quick, but watch the icy patches and open wind corridors.",
    color: "#f5a623",
  },
  {
    id: "balanced",
    name: "Balanced Path",
    tags: ["60% covered", "Low wind"],
    time: 14,
    scores: [
      { label: "Energy", value: 40, color: "#4a90e2" },
      { label: "Safety", value: 40, color: "#6b6b80" },
      { label: "Time",   value: 20, color: "#4cde5e" },
    ],
    aiExplanation: "A solid middle ground — decent coverage without the sketchy icy sections.",
    color: "#10b981",
  },
];

export const MAP_STYLE = [
  { featureType: "all",                        elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape",                  elementType: "all",              stylers: [{ color: "#e8e4d8" }] },
  { featureType: "landscape.natural.terrain",  elementType: "geometry",         stylers: [{ color: "#d4e8c0" }] },
  { featureType: "poi.park",                   elementType: "geometry.fill",    stylers: [{ color: "#a8d48a" }] },
  { featureType: "poi.school",                 elementType: "geometry.fill",    stylers: [{ color: "#d4e8c0" }] },
  { featureType: "road",                       elementType: "geometry.fill",    stylers: [{ color: "#ffffff" }] },
  { featureType: "road",                       elementType: "geometry.stroke",  stylers: [{ color: "#d0ccc0" }] },
  { featureType: "road.highway",               elementType: "geometry.fill",    stylers: [{ color: "#f5e8a0" }] },
  { featureType: "transit",                    elementType: "all",              stylers: [{ visibility: "off" }] },
  { featureType: "water",                      elementType: "geometry.fill",    stylers: [{ color: "#a0c8e8" }] },
];
