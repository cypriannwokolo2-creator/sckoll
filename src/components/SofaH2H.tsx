"use client";

import { Trophy, Calendar } from "lucide-react";

interface SofaH2HProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamShort: string;
  awayTeamShort: string;
}

export function SofaH2H({
  homeTeamName,
  awayTeamName,
  homeTeamShort,
  awayTeamShort,
}: SofaH2HProps) {
  // Head-to-head records
  const pastMatches = [
    {
      date: "31 Mar 2026",
      competition: "Premier League",
      home: homeTeamName,
      away: awayTeamName,
      homeScore: 0,
      awayScore: 0,
    },
    {
      date: "08 Oct 2025",
      competition: "Premier League",
      home: homeTeamName,
      away: awayTeamName,
      homeScore: 1,
      awayScore: 0,
    },
    {
      date: "06 Aug 2025",
      competition: "FA Community Shield",
      home: homeTeamName,
      away: awayTeamName,
      homeScore: 1,
      awayScore: 1,
      note: "Pens: 4 - 1",
    },
    {
      date: "26 Apr 2025",
      competition: "Premier League",
      home: awayTeamName,
      away: homeTeamName,
      homeScore: 4,
      awayScore: 1,
    },
    {
      date: "15 Feb 2025",
      competition: "Premier League",
      home: homeTeamName,
      away: awayTeamName,
      homeScore: 1,
      awayScore: 3,
    },
  ];

  const total = 5;
  const homeWins = 2;
  const draws = 2;
  const awayWins = 1;

  const homePct = Math.round((homeWins / total) * 100);
  const drawPct = Math.round((draws / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return (
    <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            Head to Head (H2H) History
          </h4>
        </div>
        <span className="text-xs text-zinc-400">Last 5 Meetings</span>
      </div>

      {/* Duel Bar Overview */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-emerald-400">{homeTeamShort} ({homeWins} Wins)</span>
          <span className="text-zinc-400 font-normal">{draws} Draws</span>
          <span className="text-cyan-400">{awayTeamShort} ({awayWins} Wins)</span>
        </div>

        {/* 3-way split bar */}
        <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          <div
            className="bg-emerald-500 rounded-l-full h-full"
            style={{ width: `${homePct}%` }}
            title={`${homeTeamShort} ${homeWins} wins`}
          />
          <div
            className="bg-zinc-500 h-full"
            style={{ width: `${drawPct}%` }}
            title={`${draws} draws`}
          />
          <div
            className="bg-cyan-500 rounded-r-full h-full"
            style={{ width: `${awayPct}%` }}
            title={`${awayTeamShort} ${awayWins} wins`}
          />
        </div>
      </div>

      {/* Past Match Cards */}
      <div className="space-y-2">
        {pastMatches.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-xl bg-[#080d19] border border-white/5 text-xs hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <div className="truncate">
                <span className="text-zinc-400 font-mono text-[11px] block">{m.date}</span>
                <span className="text-zinc-500 text-[10px]">{m.competition}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`font-semibold ${m.homeScore > m.awayScore ? "text-white font-bold" : "text-zinc-400"}`}>
                {m.home}
              </span>
              <span className="px-2 py-0.5 bg-black/60 font-mono font-black text-emerald-400 rounded border border-white/10 text-xs">
                {m.homeScore} : {m.awayScore}
              </span>
              <span className={`font-semibold ${m.awayScore > m.homeScore ? "text-white font-bold" : "text-zinc-400"}`}>
                {m.away}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
