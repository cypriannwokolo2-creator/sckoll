"use client";

import type { MatchStats } from "@/lib/api";
import { Activity, ShieldCheck, Flame } from "lucide-react";

interface SofaMatchStatsProps {
  stats: MatchStats | null;
  homeTeamShort: string;
  awayTeamShort: string;
  homeColor?: string;
  awayColor?: string;
}

export function SofaMatchStats({
  stats,
  homeTeamShort,
  awayTeamShort,
}: SofaMatchStatsProps) {
  // Default fallback stats if backend has not recorded all yet
  const s = stats || {
    possession: [56, 44],
    shots: [15, 8],
    shotsOnTarget: [6, 3],
    corners: [7, 4],
    fouls: [9, 12],
    yellowCards: [1, 2],
    redCards: [0, 0],
    saves: [3, 4],
    xg: [2.14, 0.88],
    bigChances: [4, 1],
    passes: [520, 395],
    passAccuracy: [88, 81],
    tacklesWon: [64, 52],
  };

  const statItems = [
    {
      label: "Ball Possession",
      home: `${s.possession[0]}%`,
      away: `${s.possession[1]}%`,
      homeVal: s.possession[0],
      awayVal: s.possession[1],
      isPercentage: true,
    },
    {
      label: "Expected Goals (xG)",
      home: (s.xg?.[0] ?? 2.14).toFixed(2),
      away: (s.xg?.[1] ?? 0.88).toFixed(2),
      homeVal: s.xg?.[0] ?? 2.14,
      awayVal: s.xg?.[1] ?? 0.88,
    },
    {
      label: "Total Shots",
      home: s.shots[0],
      away: s.shots[1],
      homeVal: s.shots[0],
      awayVal: s.shots[1],
    },
    {
      label: "Shots on Target",
      home: s.shotsOnTarget[0],
      away: s.shotsOnTarget[1],
      homeVal: s.shotsOnTarget[0],
      awayVal: s.shotsOnTarget[1],
    },
    {
      label: "Big Chances",
      home: s.bigChances?.[0] ?? 4,
      away: s.bigChances?.[1] ?? 1,
      homeVal: s.bigChances?.[0] ?? 4,
      awayVal: s.bigChances?.[1] ?? 1,
    },
    {
      label: "Corner Kicks",
      home: s.corners[0],
      away: s.corners[1],
      homeVal: s.corners[0],
      awayVal: s.corners[1],
    },
    {
      label: "Pass Accuracy",
      home: `${s.passAccuracy?.[0] ?? 88}%`,
      away: `${s.passAccuracy?.[1] ?? 81}%`,
      homeVal: s.passAccuracy?.[0] ?? 88,
      awayVal: s.passAccuracy?.[1] ?? 81,
      isPercentage: true,
    },
    {
      label: "Fouls Committed",
      home: s.fouls[0],
      away: s.fouls[1],
      homeVal: s.fouls[0],
      awayVal: s.fouls[1],
      invertLeader: true, // Lower fouls is better
    },
    {
      label: "Yellow Cards",
      home: s.yellowCards[0],
      away: s.yellowCards[1],
      homeVal: s.yellowCards[0],
      awayVal: s.yellowCards[1],
      invertLeader: true,
    },
    {
      label: "Goalkeeper Saves",
      home: s.saves[0],
      away: s.saves[1],
      homeVal: s.saves[0],
      awayVal: s.saves[1],
    },
  ];

  return (
    <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            Match Duel Statistics
          </h4>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold font-mono">
          <span className="text-emerald-400">{homeTeamShort}</span>
          <span className="text-zinc-500">vs</span>
          <span className="text-cyan-400">{awayTeamShort}</span>
        </div>
      </div>

      {/* Duel Bars */}
      <div className="space-y-4">
        {statItems.map((item, idx) => {
          const total = (item.homeVal + item.awayVal) || 1;
          const homePct = Math.round((item.homeVal / total) * 100);
          const awayPct = 100 - homePct;

          const homeLeading = item.invertLeader
            ? item.homeVal < item.awayVal
            : item.homeVal > item.awayVal;
          const awayLeading = item.invertLeader
            ? item.awayVal < item.homeVal
            : item.awayVal > item.homeVal;

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span
                  className={`font-mono font-black ${
                    homeLeading ? "text-emerald-400 font-black text-sm" : "text-zinc-300"
                  }`}
                >
                  {item.home}
                </span>

                <span className="text-zinc-400 font-semibold text-center text-[11px]">
                  {item.label}
                </span>

                <span
                  className={`font-mono font-black ${
                    awayLeading ? "text-cyan-400 font-black text-sm" : "text-zinc-300"
                  }`}
                >
                  {item.away}
                </span>
              </div>

              {/* Progress Duel Bar */}
              <div className="h-2 w-full bg-[#070c17] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-l-full transition-all duration-500 ${
                    homeLeading ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-emerald-500/50"
                  }`}
                  style={{ width: `${homePct}%` }}
                />
                <div
                  className={`h-full rounded-r-full transition-all duration-500 ${
                    awayLeading ? "bg-cyan-500 shadow-sm shadow-cyan-500/50" : "bg-cyan-500/50"
                  }`}
                  style={{ width: `${awayPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
