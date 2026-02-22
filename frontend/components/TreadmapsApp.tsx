"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
  OverlayView,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface RouteOption {
  id: string;
  name: string;
  tags: string[];
  time: number;
  scores: { label: string; value: number; color: string }[];
  aiExplanation: string;
  color: string;
}

interface BackendSegment {
  id: string;
  name: string;
  distance: number;
  incline: number;
  exposure: number;
  roof_coverage: number;
  surface: string;
  risk_score: number;
}

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// WSU campus center
const WSU_CENTER = { lat: 46.7298, lng: -117.1817 };

const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "indoor",
    name: "Energy Saver",
    tags: ["92% covered", "No stairs"],
    time: 12,
    scores: [
      { label: "Energy", value: 50, color: "#4a90e2" },
      { label: "Safety", value: 20, color: "#6b6b80" },
      { label: "Time", value: 30, color: "#4cde5e" },
    ],
    aiExplanation:
      "This route maximizes indoor passages and covered walkways, saving energy and avoiding stairs due to icy conditions.",
    color: "#2070e8",
  },
  {
    id: "fastest",
    name: "Fastest Route",
    tags: ["⚡ Quickest", "Outdoor"],
    time: 9,
    scores: [
      { label: "Speed", value: 65, color: "#f5a623" },
      { label: "Safety", value: 25, color: "#6b6b80" },
      { label: "Cover", value: 10, color: "#4cde5e" },
    ],
    aiExplanation:
      "Shortest path but exposes you to Veterans Mall icy stairs and open wind corridors. Not recommended in current 30°F rain conditions.",
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
      { label: "Time", value: 20, color: "#4cde5e" },
    ],
    aiExplanation:
      "A balanced option that trades a little speed for significantly better safety. Avoids the worst icy sections while keeping most of the route covered.",
    color: "#10b981",
  },
];

// ─────────────────────────────────────────────
// BACKEND INTEGRATION
// ─────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ROUTE_COLORS = ["#2070e8", "#f5a623", "#10b981"];

function getBackendMode(frontendMode: string): string {
  if (frontendMode === "fast") return "fast";
  if (frontendMode === "energy") return "comfortable";
  return "safe";
}

function segmentToRouteOption(seg: BackendSegment, index: number, explanation: string): RouteOption {
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

// ─────────────────────────────────────────────
// GOOGLE MAP STYLE — Light, clean, Apple Maps-ish
// ─────────────────────────────────────────────
const MAP_STYLE = [
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
  { featureType: "landscape", elementType: "all", stylers: [{ color: "#e8e4d8" }] },
  { featureType: "landscape.natural.terrain", elementType: "geometry", stylers: [{ color: "#d4e8c0" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a8d48a" }] },
  { featureType: "poi.school", elementType: "geometry.fill", stylers: [{ color: "#d4e8c0" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#d0ccc0" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#f5e8a0" }] },
  { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#a0c8e8" }] },
];

// ─────────────────────────────────────────────
// SEARCH INPUT with Places Autocomplete
// ─────────────────────────────────────────────
function SearchInput({
  onSelect,
}: {
  onSelect: (lat: number, lng: number, address: string) => void;
}) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => WSU_CENTER.lat, lng: () => WSU_CENTER.lng } as any,
      radius: 5000,
    },
    debounce: 280,
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();
    setOpen(false);
    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      onSelect(lat, lng, description);
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 bg-white rounded-[14px] px-[18px] py-[13px] shadow-sm">
        {/* Magnifying glass icon */}
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={!ready}
          placeholder="Search Location"
          className="flex-1 text-[16px] text-[#1c1c1e] bg-transparent border-none outline-none placeholder-[#8e8e93] font-[450]"
        />
        {/* Microphone icon for UI only */}
        <button
          type="button"
          className="text-gray-400 hover:text-[#2070e8] transition-colors ml-1"
          aria-label="Voice search"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4zm0 14c3.31 0 6-2.69 6-6h-2a4 4 0 0 1-8 0H6c0 3.31 2.69 6 6 6zm-1 2h2v2h-2v-2z" />
          </svg>
        </button>
        {value && (
          <button
            onClick={() => { setValue(""); clearSuggestions(); setOpen(false); }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && status === "OK" && (
        <div className="autocomplete-dropdown">
          {data.map(({ place_id, description, structured_formatting }) => (
            <div
              key={place_id}
              className="autocomplete-item"
              onMouseDown={() => handleSelect(description)}
            >
              <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#2070e8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-[600] text-[#1c1c1e] truncate">
                  {structured_formatting.main_text}
                </div>
                <div className="text-[11.5px] text-[#8e8e93] truncate">
                  {structured_formatting.secondary_text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODE PILL
// ─────────────────────────────────────────────
const MODES = [
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "snow", label: "Snow", icon: "❄️" },
  { id: "wind", label: "Wind", icon: "💨" },
  { id: "dry", label: "Dry", icon: "☀️" },
  { id: "icy", label: "Icy", icon: "🧊" },
  { id: "energy", label: "Energy", icon: "⚡" },
  { id: "fast", label: "Fast", icon: "🏃" },
];

// ─────────────────────────────────────────────
// ROUTE CARD
// ─────────────────────────────────────────────
function RouteCard({
  route,
  active,
  onClick,
}: {
  route: RouteOption;
  active: boolean;
  onClick: () => void;
}) {
  const total = route.scores.reduce((s, r) => s + r.value, 0);
  const lastScore = route.scores[route.scores.length - 1];

  return (
    <div
      onTouchStart={onClick}
      onClick={onClick}
      className={`rounded-2xl p-3 mb-2 cursor-pointer transition-all duration-200 border flex items-center ${
        active
          ? "bg-[#3d3d4e] border-[#5070b0] route-active"
          : "bg-[#464658] border-transparent hover:border-[#5070b0]/50"
      }`}
      style={{ minHeight: 70, height: 70 }}
    >
      {/* Removed microphone icon for cleaner layout */}
      <div className="flex-1 pr-2 flex items-center">
        <div className="flex flex-col flex-1">
          <div className="text-white text-[14px] font-bold leading-snug mb-1 truncate">
            {route.name.length > 14 ? route.name.slice(0, 12) + "…" : route.name}
          </div>
          {/* Route tags below name */}
          <div className="flex flex-wrap gap-1 mb-1">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-[1px] rounded-full text-[10px] font-[500] text-white/80 border border-white/25 bg-white/10 truncate"
              >
                {tag.length > 10 ? tag.slice(0, 8) + "…" : tag}
              </span>
            ))}
          </div>
        </div>
        {/* Time moved left, between graph and name */}
        <div className="flex flex-col items-center mr-3">
          <span className="text-white text-[18px] font-black leading-none block">
            {route.time}
          </span>
          <span className="text-[#bcbccc] text-[10px] leading-tight block text-center">
            min<br />walk
          </span>
        </div>
      </div>
      {/* Score bar (shortest for mobile) */}
      <div className="mt-1 flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[#bcbccc] text-[10px]">
            {route.scores.map((s) => s.label[0]).join("/")}
          </span>
          <span className="text-[#4cde5e] text-[10px] font-semibold">
            {lastScore.value}%
          </span>
        </div>
        <div className="flex gap-[1px] mb-0.5">
          {route.scores.map((seg) => (
            <div
              key={seg.label}
              className="h-[3px] rounded-full"
              style={{
                flex: seg.value,
                backgroundColor: seg.color,
              }}
            />
          ))}
        </div>
      </div>
      {/* No description in card, only at bottom */}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function TreadmapsApp() {
  const [activeMode, setActiveMode] = useState("safe");
  const [activeRoute, setActiveRoute] = useState(ROUTE_OPTIONS[0].id);
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tiredLevel, setTiredLevel] = useState(1);
  const [apiRoutes, setApiRoutes] = useState<RouteOption[] | null>(null);
  const [weatherDisplay, setWeatherDisplay] = useState("30°F, Rain");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // ── Load Google Maps API ──
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "YOUR_GOOGLE_MAPS_API_KEY",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Auto-locate user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation(null);
        }
      );
    }
  }, []);

  // Fetch live weather on mount
  useEffect(() => {
    fetch(`${API_URL}/weather/current`)
      .then((r) => r.json())
      .then((data) => {
        setWeatherDisplay(`${Math.round(data.temperature)}°F, ${data.description}`);
      })
      .catch(() => {});
  }, []);

  // Fetch routes from backend when destination, mode, or tiredness changes
  useEffect(() => {
    if (!destination) return;
    setIsLoadingRoutes(true);
    fetch(`${API_URL}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: "WSU Campus, Pullman, WA",
        destination: destination.address,
        mode: getBackendMode(activeMode),
        user_constraints: {
          fatigue: (tiredLevel - 1) / 2,
          avoid_hills: tiredLevel >= 3,
          prefer_covered: ["rain", "snow", "icy"].includes(activeMode),
        },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const routes: RouteOption[] = (data.segments as BackendSegment[]).map((seg, i) =>
          segmentToRouteOption(seg, i, data.explanation)
        );
        setApiRoutes(routes);
        setActiveRoute(routes[0]?.id ?? ROUTE_OPTIONS[0].id);
      })
      .catch(() => {
        setApiRoutes(null);
      })
      .finally(() => setIsLoadingRoutes(false));
  }, [destination, activeMode, tiredLevel]);

  // Use user location as origin if available
  const origin = userLocation || { lat: 46.7339, lng: -117.1745 };

  // Fetch directions when destination changes
  useEffect(() => {
    if (!isLoaded || !destination) return;
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        }
      }
    );
  }, [destination, isLoaded]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const handleDestinationSelect = (lat: number, lng: number, address: string) => {
    setDestination({ lat, lng, address });
    if (mapRef) {
      mapRef.panTo({ lat, lng });
    }
  };

  const displayRoutes = apiRoutes ?? ROUTE_OPTIONS;
  const selectedRoute = displayRoutes.find((r) => r.id === activeRoute) ?? displayRoutes[0];

  // ── Directions render options per route ──
  const directionsOptions = {
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: selectedRoute.color,
      strokeOpacity: 0.92,
      strokeWeight: 7,
    },
  };

  return (
    <div className="min-h-screen bg-[#c8c8cc] flex items-start justify-center py-8 px-4">
      <div
        className="w-full max-w-[420px] rounded-[40px] overflow-hidden"
        style={{
          boxShadow:
            "0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        {/* ─── HEADER ─── */}
        <div className="bg-[#e5e5ea] px-5 pt-6 pb-0">
          <h1
            className="text-center text-[28px] font-black tracking-[7px] text-[#1c1c1e] mb-4"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            TREADMAPS
          </h1>
          <div className="flex justify-between items-center text-[15px] font-[500] text-[#1c1c1e] pb-3">
            <span>Pullman/WSU</span>
            <span>{weatherDisplay}</span>
          </div>
        </div>

        {/* ─── PILLS BAR ─── */}
        <div
          className="bg-[#ddeeff] border-y border-[#c5d5e8] px-3.5 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide"
        >
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`flex items-center gap-[5px] px-3.5 py-[6px] rounded-full text-[13px] font-[500] whitespace-nowrap border transition-all duration-150 ${
                activeMode === mode.id
                  ? "bg-[#d8eaff] border-[#4a90d9] text-[#1a5faa]"
                  : "bg-[#f0f6ff] border-[#c0cfe0] text-[#3a3a50] hover:border-[#4a90d9] hover:text-[#1a5faa]"
              }`}
            >
              <span>{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
        {/* Removed weather condition toggles for cleaner UI */}
        <div className="bg-[#ddeeff] px-3.5 pb-2 flex items-center gap-2">
          <span className="text-[#1a5faa] text-[13px] font-semibold">How tired are you?</span>
          <input
            type="range"
            min={1}
            max={3}
            value={tiredLevel}
            onChange={e => setTiredLevel(Number(e.target.value))}
            className="accent-[#4a90e2] h-2 w-32"
          />
          <span className="text-[#3a3a50] text-[12px]">{["Not tired","Somewhat tired ","Tired"][tiredLevel-1]}</span>
        </div>

        {/* ─── SEARCH BAR ─── */}
        <div className="bg-[#e5e5ea] px-4 pt-3.5 pb-2">
          {isLoaded ? (
            <SearchInput onSelect={handleDestinationSelect} />
          ) : (
            <div className="flex items-center gap-2 bg-white rounded-[14px] px-[18px] py-[13px] shadow-sm">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="22" y2="22" />
              </svg>
              <span className="text-[#8e8e93] text-[16px]">
                {loadError ? "Maps failed to load" : "Loading maps..."}
              </span>
            </div>
          )}
        </div>

        {/* ─── MAP ─── */}
        <div className="w-full h-[320px] relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={userLocation ?? destination ?? WSU_CENTER}
              zoom={15}
              onLoad={onMapLoad}
              options={{
                styles: MAP_STYLE,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                gestureHandling: "greedy",
              }}
            >
              {/* Origin marker */}
              <Marker
                position={origin}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#2070e8",
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2.5,
                }}
              />

              {/* Destination marker */}
              {destination && (
                <Marker
                  position={{ lat: destination.lat, lng: destination.lng }}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#10b981",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: 2.5,
                  }}
                />
              )}

              {/* Directions */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={directionsOptions}
                />
              )}

              {/* Duration bubble */}
              {directions && (
                <OverlayView
                  position={origin}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(w, h) => ({ x: -w / 2 - 70, y: -h / 2 + 20 })}
                >
                  <div
                    className="bg-[#1a6bdb] text-white rounded-full px-4 py-2 text-[17px] font-bold whitespace-nowrap"
                    style={{ boxShadow: "0 3px 12px rgba(26,107,219,0.5)" }}
                  >
                    {selectedRoute.time} min
                  </div>
                </OverlayView>
              )}
            </GoogleMap>
          ) : (
            // Fallback map placeholder
            <div className="w-full h-full bg-[#e0ddd0] flex items-center justify-center">
              <div className="text-[#888] text-[14px]">
                {loadError ? "⚠️ Maps unavailable" : "Loading map..."}
              </div>
            </div>
          )}
        </div>

        {/* ─── BOTTOM CARD ─── */}
        <div className="bg-[#3d3d4e] px-4 pt-4 pb-7">
          {/* Loading indicator */}
          {isLoadingRoutes && (
            <div className="text-[#bcbccc] text-[12px] mb-2 text-center animate-pulse">
              Finding best routes…
            </div>
          )}
          {/* Route tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {displayRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => setActiveRoute(route.id)}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-[600] whitespace-nowrap border transition-all ${
                  activeRoute === route.id
                    ? "bg-white/20 border-white/40 text-white"
                    : "bg-transparent border-white/15 text-white/50 hover:text-white/75"
                }`}
              >
                {route.name}
              </button>
            ))}
          </div>

          {/* Only show selected route card, options are dynamic */}
          <RouteCard
            route={displayRoutes.find(r => r.id === activeRoute) ?? displayRoutes[0]}
            active={true}
            onClick={() => {}}
          />
          {/* Removed tiredness selector from bottom card, only at top */}
            {/* Route score key and description for selected route at bottom */}
            <div className="mt-4 pt-3 border-t border-white/10 min-h-[80px]">
              <div className="flex gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{background:'#4a90e2'}}></span>
                  <span className="text-white text-[12px]">Energy</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{background:'#6b6b80'}}></span>
                  <span className="text-white text-[12px]">Safety</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{background:'#4cde5e'}}></span>
                  <span className="text-white text-[12px]">Time</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{background:'#f5a623'}}></span>
                  <span className="text-white text-[12px]">Speed</span>
                </div>
              </div>
              <div className="text-white text-[15px] font-bold mb-2">Description</div>
              <div className="text-[#b8b8c8] text-[14px] leading-snug">
                {displayRoutes.find(r => r.id === activeRoute)?.aiExplanation || ""}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
