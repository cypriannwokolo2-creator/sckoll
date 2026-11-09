"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Flame } from "lucide-react";

interface SofaDateRibbonProps {
  activeStatus: "all" | "live" | "upcoming" | "finished";
  onSelectStatus: (status: "all" | "live" | "upcoming" | "finished") => void;
  liveCount: number;
  allCount: number;
  upcomingCount: number;
  finishedCount: number;
}

export function SofaDateRibbon({
  activeStatus,
  onSelectStatus,
  liveCount,
  allCount,
  upcomingCount,
  finishedCount,
}: SofaDateRibbonProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const days = [
    { offset: -2, label: "Sat, 7 Nov", sub: "2 Finished" },
    { offset: -1, label: "Yesterday", sub: "Nov 8" },
    { offset: 0, label: "TODAY", sub: "9 Nov • LIVE", isToday: true },
    { offset: 1, label: "Tomorrow", sub: "Nov 10" },
    { offset: 2, label: "Wed, 11 Nov", sub: "4 Fixtures" },
    { offset: 3, label: "Thu, 12 Nov", sub: "UCL" },
  ];

  return (
    <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-3 shadow-lg space-y-3">
      {/* Top Row: Date Picker Ribbon */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setSelectedDayOffset((prev) => Math.max(prev - 1, -2))}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 flex-1 justify-around min-w-[280px]">
          {days.map((d) => {
            const isSelected = selectedDayOffset === d.offset;
            return (
              <button
                key={d.offset}
                onClick={() => setSelectedDayOffset(d.offset)}
                className={`flex flex-col items-center px-3 py-1.5 rounded-xl text-center transition-all flex-1 min-w-[65px] ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black shadow-md shadow-emerald-500/20"
                    : d.isToday
                    ? "bg-white/10 text-white font-bold hover:bg-white/15"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-xs font-bold leading-tight">{d.label}</span>
                <span
                  className={`text-[10px] leading-tight font-medium ${
                    isSelected ? "text-black/80 font-bold" : d.isToday ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {d.sub}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedDayOffset((prev) => Math.min(prev + 1, 3))}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
          title="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Row: Status Filter Tabs (ALL | LIVE NOW | FINISHED | UPCOMING) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 p-1 bg-[#070c17] rounded-xl border border-white/5 text-xs font-bold">
          <button
            onClick={() => onSelectStatus("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeStatus === "all"
                ? "bg-emerald-500 text-black shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All Matches ({allCount})
          </button>

          <button
            onClick={() => onSelectStatus("live")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeStatus === "live"
                ? "bg-red-600 text-white shadow-sm shadow-red-600/40 font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span>Live Now ({liveCount})</span>
          </button>

          <button
            onClick={() => onSelectStatus("finished")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeStatus === "finished"
                ? "bg-emerald-500 text-black shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Finished ({finishedCount})
          </button>

          <button
            onClick={() => onSelectStatus("upcoming")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeStatus === "upcoming"
                ? "bg-emerald-500 text-black shadow-sm font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live Sync: 32ms
          </span>
          <span>•</span>
          <span>Odds Enabled</span>
        </div>
      </div>
    </div>
  );
}
