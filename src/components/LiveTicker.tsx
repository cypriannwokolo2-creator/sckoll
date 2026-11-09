"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type MatchSummary, fetchMatches } from "@/lib/api";
import { ChevronRight, ChevronLeft, Flame, Radio } from "lucide-react";

export function LiveTicker() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadTicker = async () => {
      try {
        const list = await fetchMatches();
        if (mounted) {
          setMatches(list);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    loadTicker();
    const interval = setInterval(loadTicker, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || matches.length === 0) {
    return null;
  }

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const sortedMatches = [...liveMatches, ...upcomingMatches, ...finishedMatches];

  return (
    <div className="w-full bg-[#050811] border-b border-white/5 py-1.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Live Ribbon Header */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/90 text-white rounded text-[10px] font-black uppercase tracking-wider flex-shrink-0 shadow-sm shadow-red-600/30">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>SCORES</span>
        </div>

        {/* Scrollable ticker row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-1 text-xs">
          {sortedMatches.map((m) => {
            const isLive = m.status === "live";
            const isFinished = m.status === "finished";

            return (
              <Link
                key={m.id}
                href={`/watch/${m.id}`}
                className={`flex items-center gap-2.5 px-3 py-1 rounded-lg border transition-all flex-shrink-0 group ${
                  isLive
                    ? "bg-[#0d162a] border-red-500/30 hover:border-red-500/60 text-white"
                    : "bg-[#0b101c] border-white/5 hover:border-white/15 text-zinc-300"
                }`}
              >
                {/* League / Sport Icon */}
                <span className="text-[10px] font-bold text-zinc-400">
                  {m.leagueName.split(" ")[0]}
                </span>

                {/* Scoreboard */}
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="truncate max-w-[70px] text-zinc-200 group-hover:text-white">
                    {m.homeTeamShort}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono font-black ${
                      isLive
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/5 text-zinc-300"
                    }`}
                  >
                    {isLive || isFinished ? `${m.homeScore}-${m.awayScore}` : "vs"}
                  </span>
                  <span className="truncate max-w-[70px] text-zinc-200 group-hover:text-white">
                    {m.awayTeamShort}
                  </span>
                </div>

                {/* Status Indicator */}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLive ? "text-red-400 font-black animate-pulse" : "text-zinc-500"
                  }`}
                >
                  {isLive ? `${m.minute}'` : isFinished ? "FT" : "Upcoming"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
