"use client";

import { useEffect, useRef, useState } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { WSU_CENTER } from "../lib/constants";

export function SearchInput({
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
  const [isListening, setIsListening] = useState(false);

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || isListening) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (e: any) => {
      setValue(e.results[0][0].transcript as string);
      setOpen(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
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
      const { lat, lng } = getLatLng(results[0]);
      onSelect(lat, lng, description);
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 bg-white rounded-[14px] px-[18px] py-[13px] shadow-sm">
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          disabled={!ready}
          placeholder="Search Location"
          className="flex-1 text-[16px] text-[#1c1c1e] bg-transparent border-none outline-none placeholder-[#8e8e93] font-[450]"
        />
        <button
          type="button"
          onClick={handleVoice}
          disabled={isListening}
          className={`transition-colors ml-1 ${isListening ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-[#2070e8]"}`}
          aria-label="Voice search"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4zm0 14c3.31 0 6-2.69 6-6h-2a4 4 0 0 1-8 0H6c0 3.31 2.69 6 6 6zm-1 2h2v2h-2v-2z" />
          </svg>
        </button>
        {value && (
          <button onClick={() => { setValue(""); clearSuggestions(); setOpen(false); }} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {open && status === "OK" && (
        <div className="autocomplete-dropdown">
          {data.map(({ place_id, description, structured_formatting }) => (
            <div key={place_id} className="autocomplete-item" onMouseDown={() => handleSelect(description)}>
              <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#f0f4ff] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[#2070e8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-[600] text-[#1c1c1e] truncate">{structured_formatting.main_text}</div>
                <div className="text-[11.5px] text-[#8e8e93] truncate">{structured_formatting.secondary_text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
