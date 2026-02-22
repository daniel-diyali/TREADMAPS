"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
} from "@react-google-maps/api";

import { RouteOption, BackendSegment, HazardResult } from "../lib/types";
import {
  GOOGLE_MAPS_LIBRARIES,
  WSU_CENTER,
  API_URL,
  MODES,
  ROUTE_OPTIONS,
  MAP_STYLE,
} from "../lib/constants";
import { getBackendMode, segmentToRouteOption } from "../lib/api";
import { SearchInput } from "./SearchInput";
import { RouteCard } from "./RouteCard";

export default function TreadmapsApp() {
  const [activeMode, setActiveMode] = useState("safe");
  const [activeRoute, setActiveRoute] = useState(ROUTE_OPTIONS[0].id);
  const [destination, setDestination] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tiredLevel, setTiredLevel] = useState(1);
  const [apiRoutes, setApiRoutes] = useState<RouteOption[] | null>(null);
  const [weatherDisplay, setWeatherDisplay] = useState("…");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [hazardResult, setHazardResult] = useState<HazardResult | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    fetch(`${API_URL}/weather/current`)
      .then((r) => r.json())
      .then((data) => setWeatherDisplay(`${Math.round(data.temperature)}°F, ${data.description}`))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(null)
      );
    }
  }, []);


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
      .catch(() => setApiRoutes(null))
      .finally(() => setIsLoadingRoutes(false));
  }, [destination, activeMode, tiredLevel]);

  const origin = userLocation || { lat: 46.7339, lng: -117.1745 };


  const onMapLoad = useCallback((map: google.maps.Map) => setMapRef(map), []);

  const handleDestinationSelect = (lat: number, lng: number, address: string) => {
    setDestination({ lat, lng, address });
    if (mapRef) mapRef.panTo({ lat, lng });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzingPhoto(true);
    const form = new FormData();
    form.append("file", file);
    fetch(`${API_URL}/ai/analyze-image`, { method: "POST", body: form })
      .then((r) => r.json())
      .then((data: HazardResult) => {
        setHazardResult(data);
        if (window.speechSynthesis) {
          const text = data.spoken_summary ||
            `${data.hazard_level} risk. ${data.key_hazards.slice(0, 2).join(" and ")}.`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.92;
          utterance.pitch = 1.0;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsAnalyzingPhoto(false);
        if (photoInputRef.current) photoInputRef.current.value = "";
      });
  };

  const displayRoutes = apiRoutes ?? ROUTE_OPTIONS;
  const selectedRoute = displayRoutes.find((r) => r.id === activeRoute) ?? displayRoutes[0];


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

        {/* ─── MODE PILLS ─── */}
        <div className="bg-[#ddeeff] border-y border-[#c5d5e8] px-3.5 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
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

        {/* ─── TIREDNESS SLIDER ─── */}
        <div className="bg-[#ddeeff] px-3.5 pb-2 flex items-center gap-2">
          <span className="text-[#1a5faa] text-[13px] font-semibold">How tired are you?</span>
          <input
            type="range"
            min={1}
            max={3}
            value={tiredLevel}
            onChange={(e) => setTiredLevel(Number(e.target.value))}
            className="accent-[#4a90e2] h-2 w-32"
          />
          <span className="text-[#3a3a50] text-[12px]">
            {["Not tired", "Somewhat tired", "Tired"][tiredLevel - 1]}
          </span>
        </div>

        {/* ─── SEARCH BAR ─── */}
        <div className="bg-[#e5e5ea] px-4 pt-3.5 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
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
            {/* Camera button */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={isAnalyzingPhoto}
              className="w-[46px] h-[46px] bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#2070e8] hover:bg-[#f0f6ff] transition-colors flex-shrink-0 disabled:opacity-50"
              aria-label="Analyze road photo"
            >
              {isAnalyzingPhoto ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          {/* Hazard result banner */}
          {hazardResult && (
            <div className={`mt-2 rounded-xl px-3 py-2 flex items-center gap-2 ${
              hazardResult.hazard_level === "high" ? "bg-red-100 text-red-700" :
              hazardResult.hazard_level === "medium" ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            }`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                hazardResult.hazard_level === "high" ? "bg-red-500" :
                hazardResult.hazard_level === "medium" ? "bg-amber-500" : "bg-green-500"
              }`} />
              <span className="flex-1 text-[12px] font-[500] capitalize">
                {hazardResult.hazard_level} risk · {hazardResult.key_hazards.slice(0, 2).join(", ") || "no major hazards"}
              </span>
              <button onClick={() => setHazardResult(null)} className="opacity-60 hover:opacity-100">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
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
              {selectedRoute.path.length > 0 && (
                <Polyline
                  path={selectedRoute.path}
                  options={{
                    strokeColor: selectedRoute.color,
                    strokeOpacity: 0.92,
                    strokeWeight: 7,
                  }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-[#e0ddd0] flex items-center justify-center">
              <div className="text-[#888] text-[14px]">
                {loadError ? "⚠️ Maps unavailable" : "Loading map..."}
              </div>
            </div>
          )}
        </div>

        {/* ─── BOTTOM CARD ─── */}
        <div className="bg-[#3d3d4e] px-4 pt-4 pb-7">
          {isLoadingRoutes && (
            <div className="text-[#bcbccc] text-[12px] mb-2 text-center animate-pulse">
              Finding best routes…
            </div>
          )}
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
          <RouteCard
            route={displayRoutes.find((r) => r.id === activeRoute) ?? displayRoutes[0]}
            active={true}
            onClick={() => {}}
            showTime={!!destination}
          />
          <div className="mt-4 pt-3 border-t border-white/10 min-h-[80px]">
            <div className="flex gap-4 mb-2">
              {[
                { label: "Energy", color: "#4a90e2" },
                { label: "Safety", color: "#6b6b80" },
                { label: "Time",   color: "#4cde5e" },
                { label: "Speed",  color: "#f5a623" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
                  <span className="text-white text-[12px]">{label}</span>
                </div>
              ))}
            </div>
            <div className="text-white text-[15px] font-bold mb-2">Description</div>
            <div className="text-[#b8b8c8] text-[14px] leading-snug">
              {displayRoutes.find((r) => r.id === activeRoute)?.aiExplanation || ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
