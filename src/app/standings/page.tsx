"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  type StandingRow,
  type League,
  fetchLeagues,
  fetchStandings,
} from "@/lib/api";
import { Trophy, Shield } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Official League Standings & Tables</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live point tallies, goal differentials, and recent form guides across European and world leagues.
          </p>
        </div>

        {/* League Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
          {leagues.map((lg) => (
            <button
              key={lg.id}
              onClick={() => setSelectedLeague(lg.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedLeague === lg.id
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-[#0e1628] text-zinc-300 hover:text-white border border-white/5"
              }`}
            >
              {lg.name}
            </button>
          ))}
        </div>

        {/* Standings Table Card */}
        <div className="bg-[#0e1628] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121c32] text-zinc-400 border-b border-white/5 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pos</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-4 text-center">P</th>
                  <th className="py-3 px-4 text-center">W</th>
                  <th className="py-3 px-4 text-center">D</th>
                  <th className="py-3 px-4 text-center">L</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">GF</th>
                  <th className="py-3 px-4 text-center hidden sm:table-cell">GA</th>
                  <th className="py-3 px-4 text-center">GD</th>
                  <th className="py-3 px-4 text-center font-black text-white">PTS</th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={11} className="py-4 px-4 bg-white/2" />
                    </tr>
                  ))
                ) : standings.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-zinc-500">
                      Standings for this league are being updated. Check back shortly.
                    </td>
                  </tr>
                ) : (
                  standings.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-300">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                          row.rank <= 4 ? "bg-emerald-500/20 text-emerald-400 font-black" : "text-zinc-400"
                        }`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-100 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-200">
                          {row.teamShort}
                        </div>
                        <span>{row.teamName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">{row.played}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-300">{row.won}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">{row.drawn}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-400">{row.lost}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 hidden sm:table-cell">{row.goalsFor}</td>
                      <td className="py-3.5 px-4 text-center text-zinc-500 hidden sm:table-cell">{row.goalsAgainst}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-zinc-300">
                        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                      </td>
                      <td className="py-3.5 px-4 text-center font-black text-sm text-emerald-400">
                        {row.points}
                      </td>
                      <td className="py-3.5 px-4 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.split(",").map((letter, idx) => (
                            <span
                              key={idx}
                              className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
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
                  ))
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
