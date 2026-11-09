"use client";

import { Star, Trophy, Globe, Flame } from "lucide-react";
import { LeagueLogo } from "./LeagueLogo";

interface SofaLeftNavProps {
  selectedLeague: string;
  onSelectLeague: (leagueId: string) => void;
  filterFavorites: boolean;
  onToggleFilterFavorites: () => void;
  favoriteCount: number;
  liveMatchCount: number;
}

export function SofaLeftNav({
  selectedLeague,
  onSelectLeague,
  filterFavorites,
  onToggleFilterFavorites,
  favoriteCount,
  liveMatchCount,
}: SofaLeftNavProps) {
  const topLeagues = [
    { id: "", name: "All Competitions", flag: "🌐", country: "Global" },
    { id: "premier-league", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "England" },
    { id: "champions-league", name: "Champions League", flag: "⭐", country: "Europe" },
    { id: "la-liga", name: "La Liga", flag: "🇪🇸", country: "Spain" },
    { id: "serie-a", name: "Serie A", flag: "🇮🇹", country: "Italy" },
    { id: "bundesliga", name: "Bundesliga", flag: "🇩🇪", country: "Germany" },
    { id: "nba", name: "NBA", flag: "🏀", country: "USA" },
    { id: "ufc", name: "UFC Championship", flag: "🥊", country: "Global" },
  ];

  const countries = [
    { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", count: 4, leagueId: "premier-league" },
    { name: "Spain", flag: "🇪🇸", count: 2, leagueId: "la-liga" },
    { name: "Italy", flag: "🇮🇹", count: 2, leagueId: "serie-a" },
    { name: "Germany", flag: "🇩🇪", count: 2, leagueId: "bundesliga" },
    { name: "Europe", flag: "⭐", count: 3, leagueId: "champions-league" },
    { name: "USA", flag: "🇺🇸", count: 2, leagueId: "nba" },
  ];

  return (
    <aside className="w-full lg:w-60 flex-shrink-0 space-y-6">
      {/* Quick Filter: Favorites & Live */}
      <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-2.5 space-y-1 shadow-lg">
        <button
          onClick={onToggleFilterFavorites}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            filterFavorites
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-zinc-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Star
              className={`w-4 h-4 ${
                filterFavorites ? "fill-amber-400 text-amber-400" : "text-zinc-400"
              }`}
            />
            <span>Favorite Matches</span>
          </div>
          <span className="px-1.5 py-0.5 bg-black/40 text-[10px] rounded font-mono">
            {favoriteCount}
          </span>
        </button>

        <button
          onClick={() => onSelectLeague("")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedLeague === "" && !filterFavorites
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-zinc-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <span>All Competitions</span>
          </div>
          {liveMatchCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-black animate-pulse">
              {liveMatchCount}
            </span>
          )}
        </button>
      </div>

      {/* Pinned Top Leagues */}
      <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Leagues</span>
          </span>
          <span className="text-[10px] text-zinc-500">Pinned</span>
        </div>

        <div className="space-y-0.5">
          {topLeagues.map((lg) => {
            const isSelected = selectedLeague === lg.id && !filterFavorites;
            return (
              <button
                key={lg.id || "all"}
                onClick={() => onSelectLeague(lg.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {lg.id ? (
                    <LeagueLogo leagueId={lg.id} name={lg.name} country={lg.country} size="sm" />
                  ) : (
                    <span className="text-sm flex-shrink-0">{lg.flag}</span>
                  )}
                  <span className="truncate">{lg.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Country Directory */}
      <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Countries</span>
          </span>
        </div>

        <div className="space-y-0.5">
          {countries.map((c) => (
            <button
              key={c.name}
              onClick={() => onSelectLeague(c.leagueId)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono font-bold">
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
