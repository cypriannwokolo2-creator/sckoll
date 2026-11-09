"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import {
  type MatchSummary,
  type HighlightItem,
  fetchMatches,
  fetchHighlights,
} from "@/lib/api";
import {
  Play,
  Flame,
  Calendar,
  Trophy,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialLeague = searchParams.get("league") || "";
  const initialSport = searchParams.get("sport") || "";
  const initialQ = searchParams.get("q") || "";

  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [activeSport, setActiveSport] = useState(initialSport || "all");
  const [activeStatus, setActiveStatus] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [selectedLeague, setSelectedLeague] = useState(initialLeague);
  const [loading, setLoading] = useState(true);

  // Load matches & highlights
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [matchList, highlightList] = await Promise.all([
          fetchMatches({
            sport: activeSport !== "all" ? activeSport : undefined,
            league: selectedLeague || undefined,
            status: activeStatus !== "all" ? activeStatus : undefined,
            q: initialQ || undefined,
          }),
          fetchHighlights(),
        ]);

        if (mounted) {
          setMatches(matchList);
          setHighlights(highlightList);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    // Live refresh every 8 seconds for real-time scores and minute ticks
    const interval = setInterval(loadData, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeSport, activeStatus, selectedLeague, initialQ]);

  const featuredMatch = matches.find((m) => m.isFeatured && m.status === "live") || matches.find((m) => m.status === "live") || matches[0];
  const liveCount = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const finishedCount = matches.filter((m) => m.status === "finished").length;

  const topLeagues = [
    { id: "", label: "All Leagues" },
    { id: "premier-league", label: "Premier League" },
    { id: "champions-league", label: "Champions League" },
    { id: "la-liga", label: "La Liga" },
    { id: "serie-a", label: "Serie A" },
    { id: "bundesliga", label: "Bundesliga" },
    { id: "nba", label: "NBA" },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar activeSport={activeSport} onSelectSport={(s) => setActiveSport(s)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10">
        {/* HERO MARQUEE: Featured Live Match Banner */}
        {featuredMatch && (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#10192e] via-[#0b1120] to-[#070a13] p-6 sm:p-10 shadow-2xl">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Column: Match Details */}
              <div className="space-y-4 max-w-2xl text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  {featuredMatch.status === "live" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white font-black text-xs rounded-full uppercase tracking-wider shadow-lg shadow-red-600/40">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      LIVE {featuredMatch.minute}&apos;
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-bold text-xs rounded-full uppercase tracking-wider">
                      FEATURED MATCH
                    </span>
                  )}

                  <span className="px-3 py-1 bg-white/10 text-zinc-300 text-xs font-semibold rounded-full border border-white/5">
                    {featuredMatch.leagueName}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-red-400" />
                    <span>{(featuredMatch.viewersCount || 74000).toLocaleString()} watching</span>
                  </span>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 py-2">
                  {/* Home Team */}
                  <div className="text-center sm:text-right">
                    <h2 className="text-xl sm:text-3xl font-black text-white">{featuredMatch.homeTeamName}</h2>
                    <span className="text-xs text-zinc-400 font-medium">{featuredMatch.homeTeamShort} • Home</span>
                  </div>

                  {/* Score */}
                  <div className="px-4 py-2 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <span className="text-3xl sm:text-5xl font-black text-emerald-400 tracking-wider">
                      {featuredMatch.status === "live" || featuredMatch.status === "finished"
                        ? `${featuredMatch.homeScore} - ${featuredMatch.awayScore}`
                        : "VS"}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl sm:text-3xl font-black text-white">{featuredMatch.awayTeamName}</h2>
                    <span className="text-xs text-zinc-400 font-medium">{featuredMatch.awayTeamShort} • Away</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ultra HD 4K 60fps</span>
                  </span>
                  <span>•</span>
                  <span>{featuredMatch.venue || "Stadium"}</span>
                  <span>•</span>
                  <span>English Commentary</span>
                </div>
              </div>

              {/* Right Column: CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
                <Link
                  href={`/watch/${featuredMatch.id}`}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:scale-102"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Watch Live Stream Now</span>
                </Link>

                <Link
                  href={`/watch/${featuredMatch.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-sm rounded-2xl border border-white/10 transition-all text-center"
                >
                  <span>Lineups & Live Stats</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS: Status Tabs & League Shortcuts */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#0f172a] rounded-xl border border-white/10 text-xs font-bold">
              <button
                onClick={() => setActiveStatus("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeStatus === "all" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                All Matches ({matches.length})
              </button>

              <button
                onClick={() => setActiveStatus("live")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  activeStatus === "live" ? "bg-red-600 text-white shadow-md shadow-red-600/30" : "text-zinc-400 hover:text-white"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span>Live Now ({liveCount})</span>
              </button>

              <button
                onClick={() => setActiveStatus("upcoming")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeStatus === "upcoming" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                Upcoming ({upcomingCount})
              </button>

              <button
                onClick={() => setActiveStatus("finished")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeStatus === "finished" ? "bg-emerald-500 text-black shadow-md" : "text-zinc-400 hover:text-white"
                }`}
              >
                Replays ({finishedCount})
              </button>
            </div>

            {/* Total live broadcast note */}
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Multi-server zero buffering enabled</span>
            </div>
          </div>

          {/* League Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs text-zinc-500 font-semibold flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter League:
            </span>
            {topLeagues.map((lg) => {
              const isSelected = selectedLeague === lg.id;
              return (
                <button
                  key={lg.id}
                  onClick={() => setSelectedLeague(lg.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isSelected
                      ? "bg-white/20 text-white border border-white/30"
                      : "bg-[#111827] text-zinc-400 hover:text-zinc-200 border border-white/5"
                  }`}
                >
                  {lg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MATCH FEED GRID */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span>Match Broadcast Schedule</span>
            </h3>
            <span className="text-xs text-zinc-400">
              Auto-updating live every 8s
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-[#0e1628] rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 bg-[#0e1628] rounded-3xl border border-white/10 p-8">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">No matches found for this filter</h4>
              <p className="text-xs text-zinc-400 mb-4">Try clearing the sport or league filter to see all live matches.</p>
              <button
                onClick={() => {
                  setActiveSport("all");
                  setSelectedLeague("");
                  setActiveStatus("all");
                }}
                className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>

        {/* TRENDING HIGHLIGHTS & GOALS SECTION */}
        {highlights.length > 0 && (
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-400 fill-purple-400" />
                  <span>Trending Highlights & Top Goals</span>
                </h3>
                <p className="text-xs text-zinc-400">Extended match recaps and best goals in 1080p 60fps</p>
              </div>
              <Link href="/highlights" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                <span>View All Highlights</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {highlights.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  className="group relative bg-[#0e1628] border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={h.thumbnailUrl}
                      alt={h.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                      {h.duration}
                    </span>
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600/90 text-white text-[10px] font-black rounded uppercase">
                      {h.competition}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white line-clamp-2">
                      {h.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                      <span>{(h.views || 180000).toLocaleString()} views</span>
                      <span className="text-emerald-400 font-semibold">1080p HD</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070a13]" />}>
      <HomePageContent />
    </Suspense>
  );
}
