"use client";

import { useState } from "react";
import type { MatchSummary } from "@/lib/api";
import { SofaMatchRow } from "./SofaMatchRow";
import { ChevronDown, ChevronRight, Trophy } from "lucide-react";

interface SofaLeagueSectionProps {
  leagueId: string;
  leagueName: string;
  leagueCountry: string | null;
  round?: string | null;
  matches: MatchSummary[];
  selectedMatchId?: string;
  onSelectMatch?: (match: MatchSummary) => void;
  favorites: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

export function SofaLeagueSection({
  leagueId,
  leagueName,
  leagueCountry,
  round,
  matches,
  selectedMatchId,
  onSelectMatch,
  favorites,
  onToggleFavorite,
}: SofaLeagueSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const getCountryFlag = (country: string | null, league: string) => {
    if (!country) return "🌐";
    const c = country.toLowerCase();
    if (c.includes("england")) return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    if (c.includes("spain")) return "🇪🇸";
    if (c.includes("italy")) return "🇮🇹";
    if (c.includes("germany")) return "🇩🇪";
    if (c.includes("france")) return "🇫🇷";
    if (c.includes("usa") || league.toLowerCase().includes("nba")) return "🇺🇸";
    if (c.includes("europe") || league.toLowerCase().includes("champions")) return "⭐";
    return "🌐";
  };

  const flag = getCountryFlag(leagueCountry, leagueName);
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="bg-[#0b101d] rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all">
      {/* SofaScore League Banner Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-2.5 bg-[#0e1628] hover:bg-[#121c33] border-b border-white/5 cursor-pointer transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base flex-shrink-0">{flag}</span>
          <div className="flex items-center gap-2 truncate text-xs">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              {leagueCountry || "Global"}
            </span>
            <span className="text-zinc-600 font-bold">•</span>
            <h3 className="font-black text-white text-xs sm:text-sm truncate hover:underline">
              {leagueName}
            </h3>
            {round && (
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                ({round})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600/90 text-white font-black text-[10px] rounded-full uppercase shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>{liveCount} LIVE</span>
            </span>
          )}

          <div className="text-zinc-500 hover:text-white transition-colors">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Match Rows */}
      {!collapsed && (
        <div className="divide-y divide-white/5">
          {matches.map((m) => (
            <SofaMatchRow
              key={m.id}
              match={m}
              isSelected={selectedMatchId === m.id}
              onSelect={onSelectMatch}
              isFavorite={favorites.has(m.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
