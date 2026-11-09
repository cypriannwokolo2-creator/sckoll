"use client";

import Link from "next/link";
import { type MatchSummary } from "@/lib/api";
import { Play, Users, Clock, ShieldCheck, Flame, Radio } from "lucide-react";

export function MatchCard({ match }: { match: MatchSummary }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  const formatStartTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Upcoming";
    }
  };

  const getSportBadge = (sportId: string) => {
    switch (sportId) {
      case "basketball":
        return { icon: "🏀", color: "from-orange-500/20 to-amber-500/10 text-orange-400" };
      case "mma":
        return { icon: "🥊", color: "from-red-500/20 to-rose-500/10 text-red-400" };
      case "tennis":
        return { icon: "🎾", color: "from-yellow-500/20 to-lime-500/10 text-yellow-400" };
      case "motorsport":
        return { icon: "🏎️", color: "from-blue-500/20 to-cyan-500/10 text-blue-400" };
      default:
        return { icon: "⚽", color: "from-emerald-500/20 to-teal-500/10 text-emerald-400" };
    }
  };

  const sportInfo = getSportBadge(match.sportId);

  return (
    <div className="group relative bg-gradient-to-b from-[#0e1628] to-[#0a101f] hover:from-[#131d34] hover:to-[#0f172a] border border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between overflow-hidden">
      {/* Ambient background hover glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-full blur-2xl transition-all duration-300 pointer-events-none" />

      {/* Top Bar: League & Status */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className={`w-5 h-5 rounded-lg bg-gradient-to-br ${sportInfo.color} flex items-center justify-center font-bold text-[11px]`}>
              {sportInfo.icon}
            </span>
            <span className="font-bold text-zinc-200 truncate group-hover:text-white transition-colors">
              {match.leagueName}
            </span>
            {match.round && (
              <span className="text-zinc-500 text-[11px] hidden sm:inline">
                • {match.round}
              </span>
            )}
          </div>

          <div>
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider shadow-sm shadow-red-600/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{match.minute}&apos;</span>
                <span className="text-red-200 font-normal">({match.period})</span>
              </div>
            ) : isFinished ? (
              <span className="px-2.5 py-0.5 bg-zinc-800/80 border border-white/10 text-zinc-400 font-bold text-[10px] rounded uppercase">
                FT REPLAY
              </span>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-white/5 border border-white/5 rounded-full text-zinc-300 font-medium text-[11px]">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{formatStartTime(match.startTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teams & Scoreboard */}
        <div className="space-y-3 mb-5">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-black text-xs text-zinc-100 shadow-md group-hover:border-emerald-500/30 transition-colors">
                {match.homeTeamShort}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white transition-colors">
                  {match.homeTeamName}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Home</span>
              </div>
            </div>
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isLive ? "text-emerald-400 font-black" : "text-white"
              }`}
            >
              {isLive || isFinished ? match.homeScore : "—"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-black text-xs text-zinc-100 shadow-md group-hover:border-cyan-500/30 transition-colors">
                {match.awayTeamShort}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white transition-colors">
                  {match.awayTeamName}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Away</span>
              </div>
            </div>
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                isLive ? "text-emerald-400 font-black" : "text-white"
              }`}
            >
              {isLive || isFinished ? match.awayScore : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Metadata & Stream CTA */}
      <div className="relative z-10 pt-3.5 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-medium">
              <Users className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>{(match.viewersCount || 1000).toLocaleString()} watching</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4K Ultra HD • 60fps</span>
            </span>
          )}
        </div>

        <Link
          href={`/watch/${match.id}`}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            isLive
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-lg shadow-emerald-500/25 group-hover:scale-102"
              : isFinished
              ? "bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white"
              : "bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isLive ? "Watch Live" : isFinished ? "Watch Replay" : "Stream Feed"}</span>
        </Link>
      </div>
    </div>
  );
}
