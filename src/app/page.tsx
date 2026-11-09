"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MatchCard } from "@/components/MatchCard";
import { LiveTicker } from "@/components/LiveTicker";
import { SofaLeftNav } from "@/components/SofaLeftNav";
import { SofaDateRibbon } from "@/components/SofaDateRibbon";
import { SofaLeagueSection } from "@/components/SofaLeagueSection";
import { SofaMatchCenter } from "@/components/SofaMatchCenter";
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
  X,
  Radio,
  Tv,
  LayoutList,
  LayoutGrid,
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
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["ars-mci-live", "rma-bar-live"]));
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playingHighlight, setPlayingHighlight] = useState<HighlightItem | null>(null);

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

          // Select first featured/live match initially if none selected
          setSelectedMatch((current) => {
            if (current) {
              const updated = matchList.find((m) => m.id === current.id);
              if (updated) return updated;
            }
            return (
              matchList.find((m) => m.status === "live") ||
              matchList.find((m) => m.isFeatured) ||
              matchList[0] ||
              null
            );
          });
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

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  const featuredMatch =
    matches.find((m) => m.isFeatured && m.status === "live") ||
    matches.find((m) => m.status === "live") ||
    matches[0];

  const liveCount = matches.filter((m) => m.status === "live").length;
  const upcomingCount = matches.filter((m) => m.status === "upcoming").length;
  const finishedCount = matches.filter((m) => m.status === "finished").length;

  // Filter matches based on favorite toggle
  const displayedMatches = useMemo(() => {
    if (!filterFavorites) return matches;
    return matches.filter((m) => favorites.has(m.id));
  }, [matches, filterFavorites, favorites]);

  // Group matches by League (SofaScore / LiveScore style)
  const leagueGroups = useMemo(() => {
    const groups: {
      leagueId: string;
      leagueName: string;
      leagueCountry: string | null;
      round: string | null;
      matches: MatchSummary[];
    }[] = [];

    const map = new Map<string, (typeof groups)[0]>();

    for (const m of displayedMatches) {
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
  }, [displayedMatches]);

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar activeSport={activeSport} onSelectSport={(s) => setActiveSport(s)} />
      <LiveTicker />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* HERO MARQUEE: Featured Live Match Broadcast Banner */}
        {featuredMatch && (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#10192e] via-[#0b1120] to-[#070a13] p-5 sm:p-8 shadow-2xl group">
            {/* Ambient background glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
              {/* Left Column: Match Details */}
              <div className="space-y-3.5 max-w-2xl text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                  {featuredMatch.status === "live" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs rounded-full uppercase tracking-wider shadow-lg shadow-red-600/40">
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

                  <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <Users className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span>{(featuredMatch.viewersCount || 78500).toLocaleString()} watching live</span>
                  </span>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-6 py-1">
                  {/* Home Team */}
                  <div className="text-center sm:text-right">
                    <h2 className="text-xl sm:text-3xl font-black text-white">{featuredMatch.homeTeamName}</h2>
                    <span className="text-xs text-zinc-400 font-medium">{featuredMatch.homeTeamShort} • Home</span>
                  </div>

                  {/* Score */}
                  <div className="px-4 sm:px-5 py-2 bg-black/60 rounded-2xl border border-white/15 backdrop-blur-md shadow-inner">
                    <span className="text-2xl sm:text-5xl font-black font-mono text-emerald-400 tracking-wider">
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

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ultra HD 4K 60fps</span>
                  </span>
                  <span>•</span>
                  <span>{featuredMatch.venue || "Stadium Arena"}</span>
                  <span>•</span>
                  <span>Multi-Language Audio</span>
                </div>
              </div>

              {/* Right Column: CTA */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto">
                <Link
                  href={`/watch/${featuredMatch.id}`}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-sm sm:text-base rounded-2xl transition-all shadow-xl shadow-emerald-500/25 hover:scale-102"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Watch Live Stream Now</span>
                </Link>

                <Link
                  href={`/watch/${featuredMatch.id}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition-all text-center"
                >
                  <span>Attack Momentum & Live Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 3-COLUMN SOFASCORE & LIVESCORE DESKTOP LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* 1. LEFT COLUMN: SofaScore Pinned Leagues & Countries */}
          <SofaLeftNav
            selectedLeague={selectedLeague}
            onSelectLeague={(id) => {
              setSelectedLeague(id);
              setFilterFavorites(false);
            }}
            filterFavorites={filterFavorites}
            onToggleFilterFavorites={() => setFilterFavorites(!filterFavorites)}
            favoriteCount={favorites.size}
            liveMatchCount={liveCount}
          />

          {/* 2. CENTER COLUMN: SofaScore Date Ribbon, Fixture Boards */}
          <div className="flex-1 w-full min-w-0 space-y-4">
            {/* SofaScore Date Ribbon & Status Filter */}
            <SofaDateRibbon
              activeStatus={activeStatus}
              onSelectStatus={(s) => setActiveStatus(s)}
              liveCount={liveCount}
              allCount={matches.length}
              upcomingCount={upcomingCount}
              finishedCount={finishedCount}
            />

            {/* View Mode Bar: SofaScore List vs Cards Grid */}
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span className="font-black text-white uppercase tracking-wider">
                  {selectedLeague ? `Fixtures: ${selectedLeague}` : "Live Match Schedule"}
                </span>
                <span className="text-[11px] text-zinc-500">
                  ({displayedMatches.length} matches)
                </span>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[#090f1d] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                    viewMode === "list"
                      ? "bg-emerald-500 text-black shadow-sm font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Scores table view"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Scores Table</span>
                </button>

                <button
                  onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                    viewMode === "cards"
                      ? "bg-emerald-500 text-black shadow-sm font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Broadcast Cards Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>

            {/* MATCH FIXTURES FEED */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-[#0b101e] rounded-2xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : displayedMatches.length === 0 ? (
              <div className="text-center py-16 bg-[#0b101e] rounded-3xl border border-white/10 p-8">
                <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">No matches found</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  {filterFavorites
                    ? "You haven't starred any favorite matches yet. Click the star icon on any match."
                    : "Try clearing filters to see all live matches."}
                </p>
                <button
                  onClick={() => {
                    setActiveSport("all");
                    setSelectedLeague("");
                    setActiveStatus("all");
                    setFilterFavorites(false);
                  }}
                  className="px-5 py-2.5 bg-emerald-500 text-black text-xs font-black rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === "list" ? (
              /* SOFASCORE & LIVESCORE LEAGUE GROUP ACCORDIONS */
              <div className="space-y-4">
                {leagueGroups.map((group) => (
                  <SofaLeagueSection
                    key={group.leagueId || group.leagueName}
                    leagueId={group.leagueId}
                    leagueName={group.leagueName}
                    leagueCountry={group.leagueCountry}
                    round={group.round}
                    matches={group.matches}
                    selectedMatchId={selectedMatch?.id}
                    onSelectMatch={(m) => setSelectedMatch(m)}
                    favorites={favorites}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              /* BROADCAST CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            )}
          </div>

          {/* 3. RIGHT COLUMN: SofaScore Match Center & Live Mini-Player */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <SofaMatchCenter match={selectedMatch} />
          </div>
        </div>

        {/* TRENDING HIGHLIGHTS & GOALS SECTION */}
        {highlights.length > 0 && (
          <div className="pt-8 border-t border-white/10">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {highlights.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  onClick={() => setPlayingHighlight(h)}
                  className="group relative bg-[#0e1628] hover:bg-[#121b30] border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer hover:scale-[1.01]"
                >
                  <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={h.thumbnailUrl}
                      alt={h.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shadow-purple-500/30">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded">
                      {h.duration}
                    </span>
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-purple-600/90 text-white text-[10px] font-black rounded uppercase shadow-sm">
                      {h.competition}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors line-clamp-2">
                      {h.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-white/5">
                      <span>{h.views.toLocaleString()} views</span>
                      <span className="text-purple-400 font-bold group-hover:underline flex items-center gap-1">
                        <span>Play Video</span>
                        <Play className="w-3 h-3 fill-purple-400" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Highlight Playback Modal */}
        {playingHighlight && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <div className="relative w-full max-w-4xl bg-[#0e1628] rounded-3xl border border-white/20 overflow-hidden shadow-2xl space-y-4">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-600 text-white text-xs font-black rounded uppercase">
                    {playingHighlight.competition}
                  </span>
                  <h3 className="font-bold text-sm text-white truncate max-w-md">
                    {playingHighlight.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPlayingHighlight(null)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <video
                  src={playingHighlight.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 pt-0 flex items-center justify-between text-xs text-zinc-400">
                <span>Duration: {playingHighlight.duration} • {playingHighlight.views.toLocaleString()} plays</span>
                <span className="text-emerald-400 font-bold">1080p 60fps Replay</span>
              </div>
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a13] text-zinc-100 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
