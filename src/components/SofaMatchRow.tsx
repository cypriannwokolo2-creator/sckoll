"use client";

import Link from "next/link";
import { type MatchSummary } from "@/lib/api";
import { TeamLogo } from "./TeamLogo";
import { Star, Play, Tv, Clock, ShieldCheck, Flame, Radio } from "lucide-react";

interface SofaMatchRowProps {
  match: MatchSummary;
  isSelected?: boolean;
  onSelect?: (match: MatchSummary) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (matchId: string) => void;
}

export function SofaMatchRow({
  match,
  isSelected = false,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: SofaMatchRowProps) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";

  const homeWinning = (isLive || isFinished) && match.homeScore > match.awayScore;
  const awayWinning = (isLive || isFinished) && match.awayScore > match.homeScore;

  const formatStartTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "20:00";
    }
  };

  return (
    <div
      onClick={() => onSelect?.(match)}
      className={`group relative flex items-center justify-between px-3.5 py-3 border-b border-white/5 transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? "bg-[#141f38] border-l-4 border-l-emerald-500 shadow-md"
          : "hover:bg-white/[0.04] bg-[#0c1222]/60"
      }`}
    >
      {/* Left Column: Match Status / Minute */}
      <div className="w-16 sm:w-20 flex-shrink-0 flex flex-col items-start justify-center pr-2">
        {isLive ? (
          <div className="flex flex-col items-start">
            <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>{match.minute}&apos;</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">
              {match.period || "Live"}
            </span>
          </div>
        ) : isFinished ? (
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-zinc-400">FT</span>
            <span className="text-[10px] text-zinc-500">Ended</span>
          </div>
        ) : (
          <div className="flex flex-col items-start">
            <span className="text-xs font-bold text-zinc-200">
              {formatStartTime(match.startTime)}
            </span>
            <span className="text-[10px] text-zinc-500">Upcoming</span>
          </div>
        )}
      </div>

      {/* Middle Column: Teams & Scores */}
      <div className="flex-1 min-w-0 pr-3 sm:pr-6 space-y-1.5">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo
              teamId={match.homeTeamId}
              name={match.homeTeamName}
              shortName={match.homeTeamShort}
              logoUrl={match.homeTeamLogo}
              size="xs"
            />
            <span
              className={`text-xs sm:text-sm truncate transition-colors ${
                homeWinning
                  ? "font-black text-white"
                  : isFinished
                  ? "text-zinc-400 font-medium"
                  : "text-zinc-200 font-semibold group-hover:text-white"
              }`}
            >
              {match.homeTeamName}
            </span>
          </div>
          <span
            className={`font-mono text-sm sm:text-base font-black px-1.5 ${
              isLive
                ? homeWinning
                  ? "text-emerald-400 font-black"
                  : "text-white"
                : isFinished
                ? homeWinning
                  ? "text-zinc-100 font-black"
                  : "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            {isLive || isFinished ? match.homeScore : "-"}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo
              teamId={match.awayTeamId}
              name={match.awayTeamName}
              shortName={match.awayTeamShort}
              logoUrl={match.awayTeamLogo}
              size="xs"
            />
            <span
              className={`text-xs sm:text-sm truncate transition-colors ${
                awayWinning
                  ? "font-black text-white"
                  : isFinished
                  ? "text-zinc-400 font-medium"
                  : "text-zinc-200 font-semibold group-hover:text-white"
              }`}
            >
              {match.awayTeamName}
            </span>
          </div>
          <span
            className={`font-mono text-sm sm:text-base font-black px-1.5 ${
              isLive
                ? awayWinning
                  ? "text-emerald-400 font-black"
                  : "text-white"
                : isFinished
                ? awayWinning
                  ? "text-zinc-100 font-black"
                  : "text-zinc-400"
                : "text-zinc-600"
            }`}
          >
            {isLive || isFinished ? match.awayScore : "-"}
          </span>
        </div>
      </div>

      {/* Right Column: Actions (Watch CTA & Star) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Stream Link Button */}
        <Link
          href={`/watch/${match.id}`}
          onClick={(e) => e.stopPropagation()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
            isLive
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black shadow-emerald-500/20"
              : isFinished
              ? "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10"
              : "bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 border border-white/10"
          }`}
        >
          {isLive ? (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Watch Live</span>
            </>
          ) : isFinished ? (
            <>
              <Tv className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Highlights</span>
              <span className="sm:hidden">FT</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scheduled</span>
              <span className="sm:hidden">Pre</span>
            </>
          )}
        </Link>

        {/* Favorite Star Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(match.id);
          }}
          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 hover:text-amber-400 transition-colors"
          title="Add to favorites"
        >
          <Star
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-amber-400 text-amber-400" : "text-zinc-500"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
