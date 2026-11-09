"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import { type MatchSummary, fetchMatches } from "@/lib/api";
import { Calendar, Clock, Filter, Trophy } from "lucide-react";

export default function SchedulePage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeDate, setActiveDate] = useState<"today" | "tomorrow" | "all">("today");
  const [activeSport, setActiveSport] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const list = await fetchMatches({
        sport: activeSport !== "all" ? activeSport : undefined,
      });
      if (mounted) {
        setMatches(list);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [activeSport]);

  const filtered = matches.filter((m) => {
    if (activeDate === "today") return m.status === "live" || m.status === "upcoming";
    if (activeDate === "tomorrow") return m.status === "upcoming";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar activeSport={activeSport} onSelectSport={(s) => setActiveSport(s)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-cyan-400" />
              <span>Full Match Schedule & Broadcast Times</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              All fixture kickoff times automatically adjusted to your local device timezone.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#0f172a] rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveDate("today")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeDate === "today" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveDate("tomorrow")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeDate === "tomorrow" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setActiveDate("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeDate === "all" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              All Fixtures
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 bg-[#0e1628] rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#0e1628] rounded-3xl border border-white/10 p-8">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No fixtures scheduled for this date</h3>
            <p className="text-xs text-zinc-400">Check back soon for new broadcast announcements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
