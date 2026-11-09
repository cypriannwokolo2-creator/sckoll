"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveTicker } from "@/components/LiveTicker";
import {
  type StandingRow,
  type League,
  fetchLeagues,
  fetchStandings,
} from "@/lib/api";
import { Trophy, Shield, Award, Sparkles } from "lucide-react";

export default function StandingsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("premier-league");
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadLeagues = async () => {
      const list = await fetchLeagues();
      if (mounted && list.length > 0) {
        setLeagues(list);
        if (!selectedLeague) setSelectedLeague(list[0].id);
      }
    };
    loadLeagues();
    return () => {
      mounted = false;
    };
  }, [selectedLeague]);

  useEffect(() => {
    let mounted = true;
    const loadStandings = async () => {
      if (!selectedLeague) return;
      setLoading(true);
      const data = await fetchStandings(selectedLeague);
      if (mounted) {
        setStandings(data);
        setLoading(false);
      }
    };
    loadStandings();
    return () => {
      mounted = false;
    };
  }, [selectedLeague]);

  const currentLeagueObj = leagues.find((l) => l.id === selectedLeague);

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar showSportsFilter={false} />
      <LiveTicker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-black text-[10px] uppercase tracking-wider">
                TABLES & STATS
              </span>
              <span className="text-xs text-zinc-400">Season 2026/27</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-1">
              <Trophy className="w-7 h-7 text-amber-400" />
              <span>{currentLeagueObj?.name || "Official League"} Standings</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Live points, goal differentials, and recent match form updated automatically after full time.
            </p>
          </div>

          {/* Table Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-400 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Champions League</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Europa League</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Relegation</span>
            </span>
          </div>
        </div>

        {/* League Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
          {leagues.map((lg) => (
            <button
              key={lg.id}
              onClick={() => setSelectedLeague(lg.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedLeague === lg.id
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 scale-[1.02]"
                  : "bg-[#0e1628] text-zinc-300 hover:text-white hover:bg-[#16223d] border border-white/5"
              }`}
            >
              {lg.name}
            </button>
          ))}
        </div>

        {/* Standings Table Card */}
        <div className="bg-[#0e1628] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121c32] text-zinc-400 border-b border-white/5 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-14 text-center">Pos</th>
                  <th className="py-3.5 px-4">Club</th>
                  <th className="py-3.5 px-4 text-center">Played</th>
                  <th className="py-3.5 px-4 text-center">Won</th>
                  <th className="py-3.5 px-4 text-center">Drawn</th>
                  <th className="py-3.5 px-4 text-center">Lost</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">GF</th>
                  <th className="py-3.5 px-4 text-center hidden sm:table-cell">GA</th>
                  <th className="py-3.5 px-4 text-center font-bold">GD</th>
                  <th className="py-3.5 px-4 text-center font-black text-white">PTS</th>
                  <th className="py-3.5 px-4 text-center hidden md:table-cell">Recent Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={11} className="py-4 px-4 bg-white/2" />
                    </tr>
                  ))
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-zinc-500">
                      Standings for this league are currently being generated. Check back shortly.
                    </td>
                  </tr>
                ) : (
                  standings.map((row) => {
                    const isUcl = row.rank <= 4;
                    const isEuropa = row.rank === 5;
                    const isRelegation = row.rank >= 18;

                    return (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black shadow-sm ${
                              isUcl
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isEuropa
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                                : isRelegation
                                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                : "text-zinc-400"
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-zinc-100 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-200 group-hover:border-emerald-500/30 transition-colors">
                            {row.teamShort}
                          </div>
                          <span className="group-hover:text-white transition-colors">{row.teamName}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-400">{row.played}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-300 font-semibold">{row.won}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-400">{row.drawn}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-400">{row.lost}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-500 hidden sm:table-cell">{row.goalsFor}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-500 hidden sm:table-cell">{row.goalsAgainst}</td>
                        <td className="py-3.5 px-4 text-center font-black font-mono text-zinc-300">
                          {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black font-mono text-base text-emerald-400">
                          {row.points}
                        </td>
                        <td className="py-3.5 px-4 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1 font-bold">
                            {row.form.split(",").map((letter, idx) => (
                              <span
                                key={idx}
                                className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shadow-xs ${
                                  letter === "W"
                                    ? "bg-emerald-600 text-white"
                                    : letter === "D"
                                    ? "bg-zinc-600 text-white"
                                    : "bg-red-600 text-white"
                                }`}
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
