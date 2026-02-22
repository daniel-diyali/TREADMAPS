"use client";

import { RouteOption } from "../lib/types";

export function RouteCard({
  route,
  active,
  onClick,
  showTime = false,
}: {
  route: RouteOption;
  active: boolean;
  onClick: () => void;
  showTime?: boolean;
}) {
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
      <div className="flex-1 pr-2 flex items-center">
        <div className="flex flex-col flex-1">
          <div className="text-white text-[14px] font-bold leading-snug mb-1 truncate">
            {route.name.length > 14 ? route.name.slice(0, 12) + "…" : route.name}
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {route.tags.map((tag) => (
              <span key={tag} className="px-2 py-[1px] rounded-full text-[10px] font-[500] text-white/80 border border-white/25 bg-white/10 truncate">
                {tag.length > 10 ? tag.slice(0, 8) + "…" : tag}
              </span>
            ))}
          </div>
        </div>
        {showTime && (
          <div className="flex flex-col items-center mr-3">
            <span className="text-white text-[18px] font-black leading-none block">{route.time}</span>
            <span className="text-[#bcbccc] text-[10px] leading-tight block text-center">min<br />walk</span>
          </div>
        )}
      </div>
      <div className="mt-1 flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[#bcbccc] text-[10px]">{route.scores.map((s) => s.label[0]).join("/")}</span>
          <span className="text-[#4cde5e] text-[10px] font-semibold">{lastScore.value}%</span>
        </div>
        <div className="flex gap-[1px] mb-0.5">
          {route.scores.map((seg) => (
            <div key={seg.label} className="h-[3px] rounded-full" style={{ flex: seg.value, backgroundColor: seg.color }} />
          ))}
        </div>
      </div>
    </div>
  );
}
