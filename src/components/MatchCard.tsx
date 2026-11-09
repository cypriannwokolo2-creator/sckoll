import Link from "next/link";
import { type MatchSummary } from "@/lib/api";
import { Play, Users, Clock, ShieldCheck } from "lucide-react";

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

  return (
    <div className="group relative bg-[#0e1628] hover:bg-[#131d34] border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between">
      {/* Top Bar: League & Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-zinc-300">
              {match.sportId === "basketball" ? "🏀" : match.sportId === "mma" ? "🥊" : "⚽"}
            </span>
            <span className="font-semibold text-zinc-300 truncate">{match.leagueName}</span>
            {match.round && (
              <span className="text-zinc-500 text-[11px] hidden sm:inline">
                • {match.round}
              </span>
            )}
          </div>

          <div>
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-red-600/90 text-white font-black text-[10px] rounded-full uppercase tracking-wider shadow-sm shadow-red-600/30">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{match.minute}&apos;</span>
                <span className="text-red-200 font-normal">({match.period})</span>
              </div>
            ) : isFinished ? (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 font-bold text-[10px] rounded uppercase">
                FT
              </span>
            ) : (
              <div className="flex items-center gap-1 text-zinc-400 font-medium text-[11px]">
                <Clock className="w-3 h-3 text-zinc-500" />
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
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-200 overflow-hidden">
                {match.homeTeamShort}
              </div>
              <span className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white">
                {match.homeTeamName}
              </span>
            </div>
            <span className={`text-lg sm:text-xl font-black ${isLive ? "text-emerald-400" : "text-white"}`}>
              {isLive || isFinished ? match.homeScore : "-"}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-zinc-200 overflow-hidden">
                {match.awayTeamShort}
              </div>
              <span className="font-bold text-sm sm:text-base text-zinc-100 group-hover:text-white">
                {match.awayTeamName}
              </span>
            </div>
            <span className={`text-lg sm:text-xl font-black ${isLive ? "text-emerald-400" : "text-white"}`}>
              {isLive || isFinished ? match.awayScore : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Metadata & Stream CTA */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {isLive ? (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Users className="w-3.5 h-3.5 text-red-400" />
              <span>{(match.viewersCount || 1000).toLocaleString()}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4K Ultra HD</span>
            </span>
          )}
        </div>

        <Link
          href={`/watch/${match.id}`}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isLive
              ? "bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isLive ? "Watch Live" : isFinished ? "Watch Replay" : "Stream Feed"}</span>
        </Link>
      </div>
    </div>
  );
}
