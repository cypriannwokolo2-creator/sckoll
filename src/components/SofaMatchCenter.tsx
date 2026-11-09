"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MatchSummary, MatchDetailResponse } from "@/lib/api";
import { fetchMatch } from "@/lib/api";
import { AttackMomentum } from "./AttackMomentum";
import { TeamLogo } from "./TeamLogo";
import { LeagueLogo } from "./LeagueLogo";
import {
  Play,
  Tv,
  ArrowRight,
  Shield,
  Activity,
  Users,
  Trophy,
  ExternalLink,
  Flame,
} from "lucide-react";

interface SofaMatchCenterProps {
  match: MatchSummary | null;
}

export function SofaMatchCenter({ match }: SofaMatchCenterProps) {
  const [detail, setDetail] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match) return;
    let mounted = true;
    setLoading(true);

    fetchMatch(match.id).then((res) => {
      if (mounted) {
        setDetail(res);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [match?.id]);

  if (!match) {
    return (
      <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-6 text-center space-y-3">
        <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-bold text-white">Select a match to open Match Center</h4>
        <p className="text-xs text-zinc-400">
          Click any match fixture on the board to view live attack momentum, duel stats, and live streams.
        </p>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const stats = detail?.match.stats;

  return (
    <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 sticky top-20">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <LeagueLogo leagueId={match.leagueId} name={match.leagueName} size="sm" />
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
            {match.leagueName}
          </span>
          {match.round && (
            <span className="text-[10px] text-zinc-500">• {match.round}</span>
          )}
        </div>

        {isLive ? (
          <span className="px-2.5 py-0.5 bg-red-600 text-white font-black text-[10px] rounded-full uppercase animate-pulse shadow-sm shadow-red-600/40">
            LIVE {match.minute}&apos;
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 font-bold text-[10px] rounded uppercase">
            {match.status}
          </span>
        )}
      </div>

      {/* Live Match Scoreboard Header */}
      <div className="flex items-center justify-between gap-3 bg-[#080d19] p-3.5 rounded-xl border border-white/5">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center text-center">
          <TeamLogo
            teamId={match.homeTeamId}
            name={match.homeTeamName}
            shortName={match.homeTeamShort}
            size="lg"
            className="mb-1.5 shadow-md"
          />
          <span className="text-xs font-bold text-white line-clamp-1">
            {match.homeTeamName}
          </span>
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">Home</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center justify-center px-3">
          <div className="px-3.5 py-1.5 bg-black/80 rounded-xl border border-white/10 shadow-inner">
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider">
              {isLive || isFinished ? `${match.homeScore} : ${match.awayScore}` : "VS"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono mt-1 font-bold">
            {isLive ? `${match.minute}' ${match.period}` : isFinished ? "Full Time" : "Kickoff"}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center text-center">
          <TeamLogo
            teamId={match.awayTeamId}
            name={match.awayTeamName}
            shortName={match.awayTeamShort}
            size="lg"
            className="mb-1.5 shadow-md"
          />
          <span className="text-xs font-bold text-white line-clamp-1">
            {match.awayTeamName}
          </span>
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">Away</span>
        </div>
      </div>

      {/* Main CTA: Open Full Broadcast Theater */}
      <Link
        href={`/watch/${match.id}`}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
      >
        <Play className="w-4 h-4 fill-black" />
        <span>Watch Live Broadcast (4K Ultra HD)</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      {/* Live Attack Momentum Graph */}
      <AttackMomentum
        homeTeamName={match.homeTeamName}
        awayTeamName={match.awayTeamName}
        homeTeamShort={match.homeTeamShort}
        awayTeamShort={match.awayTeamShort}
        currentMinute={match.minute}
        isLive={isLive}
        events={detail?.events || []}
        momentumData={detail?.momentum}
      />

      {/* Duel Statistics Mini Bars */}
      <div className="space-y-3 bg-[#080d19] p-3.5 rounded-xl border border-white/5">
        <h5 className="text-[11px] font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Match Key Statistics</span>
        </h5>

        {/* Ball Possession */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-emerald-400">{stats?.possession?.[0] ?? 56}%</span>
            <span className="text-zinc-400 font-normal">Ball Possession</span>
            <span className="text-cyan-400">{stats?.possession?.[1] ?? 44}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${stats?.possession?.[0] ?? 56}%` }}
            />
            <div
              className="bg-cyan-500 h-full"
              style={{ width: `${stats?.possession?.[1] ?? 44}%` }}
            />
          </div>
        </div>

        {/* Expected Goals (xG) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-emerald-400">{stats?.xg?.[0] ?? 2.14}</span>
            <span className="text-zinc-400 font-normal">Expected Goals (xG)</span>
            <span className="text-cyan-400">{stats?.xg?.[1] ?? 0.88}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: "70%" }} />
            <div className="bg-cyan-500 h-full" style={{ width: "30%" }} />
          </div>
        </div>

        {/* Total Shots */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-emerald-400">{stats?.shots?.[0] ?? 14}</span>
            <span className="text-zinc-400 font-normal">Total Shots</span>
            <span className="text-cyan-400">{stats?.shots?.[1] ?? 7}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: "66%" }} />
            <div className="bg-cyan-500 h-full" style={{ width: "34%" }} />
          </div>
        </div>

        {/* Shots On Target */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-emerald-400">{stats?.shotsOnTarget?.[0] ?? 6}</span>
            <span className="text-zinc-400 font-normal">Shots on Target</span>
            <span className="text-cyan-400">{stats?.shotsOnTarget?.[1] ?? 3}</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: "66%" }} />
            <div className="bg-cyan-500 h-full" style={{ width: "34%" }} />
          </div>
        </div>
      </div>

      {/* Head to Head & Form Guide */}
      <div className="bg-[#080d19] p-3.5 rounded-xl border border-white/5 space-y-2.5">
        <h5 className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">
          Form Guide (Last 5)
        </h5>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300 text-xs">{match.homeTeamShort}</span>
          <div className="flex items-center gap-1 font-bold text-[10px]">
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
            <span className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-black">D</span>
            <span className="w-5 h-5 rounded-md bg-red-500 text-white flex items-center justify-center font-black">L</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-300 text-xs">{match.awayTeamShort}</span>
          <div className="flex items-center gap-1 font-bold text-[10px]">
            <span className="w-5 h-5 rounded-md bg-red-500 text-white flex items-center justify-center font-black">L</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
            <span className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-black">D</span>
            <span className="w-5 h-5 rounded-md bg-emerald-500 text-black flex items-center justify-center font-black">W</span>
          </div>
        </div>
      </div>
    </div>
  );
}
