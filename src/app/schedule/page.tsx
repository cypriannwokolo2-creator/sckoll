"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import { LiveTicker } from "@/components/LiveTicker";
import { SofaLeagueSection } from "@/components/SofaLeagueSection";
import { type MatchSummary, fetchMatches } from "@/lib/api";
import {
  Calendar,
  Clock,
  Filter,
  Trophy,
  Globe,
  Sparkles,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

export default function SchedulePage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeDate, setActiveDate] = useState<"today" | "tomorrow" | "all">("today");
  const [activeSport, setActiveSport] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userTimezone, setUserTimezone] = useState("Local Time");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTimezone(tz || "Local Time");
    } catch {
      setUserTimezone("Local Time");
    }
  }, []);

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

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (activeDate === "today") return m.status === "live" || m.status === "upcoming";
      if (activeDate === "tomorrow") return m.status === "upcoming";
      return true;
    });
  }, [matches, activeDate]);

  // Group by League competition
  const leagueGroups = useMemo(() => {
    const groups: {
      leagueId: string;
      leagueName: string;
      leagueCountry: string | null;
      round: string | null;
      matches: MatchSummary[];
    }[] = [];

    const map = new Map<string, (typeof groups)[0]>();

    for (const m of filtered) {
      const key = m.leagueId || m.leagueName;
      if (!map.has(key)) {
        const entry = {
          leagueId: m.leagueId,
          leagueName: m.leagueName,
          leagueCountry: m.leagueCountry,
          round: m.round,
          matches: [],
        };
        map.set(key, entry);
        groups.push(entry);
      }
      map.get(key)!.matches.push(m);
    }

    return groups;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar activeSport={activeSport} onSelectSport={(s) => setActiveSport(s)} />
      <LiveTicker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full font-black text-[10px] uppercase tracking-wider">
                BROADCAST CALENDAR
              </span>
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Globe className="w-3.5 h-3.5 text-zinc-500" />
                <span>{userTimezone}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-1">
              <Calendar className="w-7 h-7 text-cyan-400" />
              <span>Full Match Broadcast Schedule</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              All kickoff and event times are synchronized with multi-server zero buffering live streams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-xl border border-white/10 text-xs font-bold shadow-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-emerald-500 text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Scores table view"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Scores Table</span>
              </button>

              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "cards"
                    ? "bg-emerald-500 text-black font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Cards Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
            </div>

            {/* Date Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0f172a] rounded-xl border border-white/10 text-xs font-bold shadow-lg">
              <button
                onClick={() => setActiveDate("today")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeDate === "today"
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveDate("tomorrow")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeDate === "tomorrow"
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => setActiveDate("all")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeDate === "all"
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Fixtures ({matches.length})
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-[#0e1628] rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0e1628] rounded-3xl border border-white/10 p-8 shadow-xl">
            <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No fixtures scheduled for this filter</h3>
            <p className="text-xs text-zinc-400 mb-4">Try selecting &apos;All Fixtures&apos; to view all upcoming broadcasts.</p>
            <button
              onClick={() => {
                setActiveDate("all");
                setActiveSport("all");
              }}
              className="px-5 py-2.5 bg-emerald-500 text-black text-xs font-black rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              View All Fixtures
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* LEAGUE GROUPED FIXTURES */
          <div className="space-y-4">
            {leagueGroups.map((group) => (
              <SofaLeagueSection
                key={group.leagueId || group.leagueName}
                leagueId={group.leagueId}
                leagueName={group.leagueName}
                leagueCountry={group.leagueCountry}
                round={group.round}
                matches={group.matches}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          /* CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
