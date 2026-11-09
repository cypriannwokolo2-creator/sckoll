"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LiveChat } from "@/components/LiveChat";
import {
  type MatchDetailResponse,
  fetchMatch,
} from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Activity,
  Users,
  Trophy,
  Share2,
  Tv,
} from "lucide-react";

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;

  const [data, setData] = useState<MatchDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "lineups" | "stats" | "h2h">("timeline");
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMatch = async () => {
      const res = await fetchMatch(matchId);
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    };

    loadMatch();
    // Live update scores & events every 6s
    const timer = setInterval(loadMatch, 6000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [matchId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-400 font-semibold text-sm">Connecting live stream server...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data || !data.match) {
    return (
      <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto p-8 text-center flex flex-col items-center justify-center space-y-4">
          <Trophy className="w-12 h-12 text-zinc-600" />
          <h2 className="text-xl font-bold">Match Broadcast Unavailable</h2>
          <p className="text-zinc-400 text-sm max-w-md">
            This match broadcast is either finished or has not been scheduled yet.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-emerald-500 text-black font-bold text-sm rounded-xl"
          >
            Return to Live Matches
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { match, streams, events, lineups } = data;
  const isLive = match.status === "live";

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation & Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Back to matches"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">{match.leagueName}</span>
                {match.round && <span className="text-xs text-zinc-500">• {match.round}</span>}
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white">
                {match.homeTeamName} vs {match.awayTeamName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Link Copied!" : "Share Stream"}</span>
            </button>
          </div>
        </div>

        {/* Video Player & Live Chat Layout */}
        <div className={`grid gap-6 ${isTheaterMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
          {/* Main Video Stream Player Container */}
          <div className={isTheaterMode ? "w-full" : "lg:col-span-2 space-y-5"}>
            <VideoPlayer
              streams={streams}
              matchTitle={`${match.homeTeamName} vs ${match.awayTeamName}`}
              isLive={isLive}
              onTheaterToggle={(t) => setIsTheaterMode(t)}
              isTheaterMode={isTheaterMode}
            />

            {/* Match Scoreboard Strip */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Home */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    {match.homeTeamShort}
                  </div>
                  <span className="font-bold text-sm sm:text-base text-white">{match.homeTeamName}</span>
                </div>

                {/* Score */}
                <div className="px-3.5 py-1.5 bg-black/50 border border-white/10 rounded-xl">
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {match.homeScore} : {match.awayScore}
                  </span>
                </div>

                {/* Away */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                    {match.awayTeamShort}
                  </div>
                  <span className="font-bold text-sm sm:text-base text-white">{match.awayTeamName}</span>
                </div>
              </div>

              {/* Status & Minute */}
              <div className="flex items-center gap-3 text-xs">
                {isLive ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-600/90 text-white font-bold rounded-lg shadow-sm shadow-red-600/30">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>{match.minute}&apos; {match.period}</span>
                  </div>
                ) : (
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-bold rounded-lg uppercase">
                    {match.status}
                  </span>
                )}

                {match.venue && (
                  <div className="hidden sm:flex items-center gap-1 text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate max-w-[180px]">{match.venue}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Data Tabs (Timeline, Lineups, Stats, H2H) */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/10 bg-[#090e1c] text-xs font-bold">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "timeline"
                      ? "border-emerald-500 text-emerald-400 bg-white/5"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Timeline ({events.length})
                </button>

                <button
                  onClick={() => setActiveTab("lineups")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "lineups"
                      ? "border-emerald-500 text-emerald-400 bg-white/5"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Tactical Lineups
                </button>

                <button
                  onClick={() => setActiveTab("stats")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "stats"
                      ? "border-emerald-500 text-emerald-400 bg-white/5"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Match Statistics
                </button>

                <button
                  onClick={() => setActiveTab("h2h")}
                  className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                    activeTab === "h2h"
                      ? "border-emerald-500 text-emerald-400 bg-white/5"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  H2H & Form
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 text-sm">
                {/* 1. TIMELINE & LIVE COMMENTARY TAB */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <p className="text-zinc-500 text-xs text-center py-6">
                        No match events recorded yet. Kickoff commentary will appear here.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {events.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-white/5 text-xs"
                          >
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-black rounded text-[11px] flex-shrink-0">
                              {ev.minute}&apos;
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">
                                  {ev.type === "goal" ? "⚽ GOAL!" : ev.type === "yellow_card" ? "🟨 Yellow Card" : "🔄 Substitution"}
                                </span>
                                <span className="font-semibold text-emerald-300">{ev.player}</span>
                              </div>
                              {ev.detail && <p className="text-zinc-400 text-[11px] mt-0.5">{ev.detail}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. TACTICAL LINEUPS & FORMATION PITCH TAB */}
                {activeTab === "lineups" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Home Team Formation */}
                      <div className="bg-[#090f1d] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                          <h4 className="font-bold text-white text-xs">{match.homeTeamName}</h4>
                          <span className="text-[11px] font-bold text-emerald-400">
                            {lineups.home?.formation || "4-3-3"}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[10px] mb-2 uppercase tracking-wider">Manager: {lineups.home?.coach || "Coach"}</p>
                        <div className="space-y-1.5">
                          {lineups.home?.startingEleven?.map((p) => (
                            <div key={p.number} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                              <span className="w-5 font-mono text-zinc-400">{p.number}</span>
                              <span className="flex-1 font-semibold text-zinc-200">
                                {p.name} {p.captain && "(C)"}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400">{p.pos}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Away Team Formation */}
                      <div className="bg-[#090f1d] p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                          <h4 className="font-bold text-white text-xs">{match.awayTeamName}</h4>
                          <span className="text-[11px] font-bold text-emerald-400">
                            {lineups.away?.formation || "4-2-3-1"}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[10px] mb-2 uppercase tracking-wider">Manager: {lineups.away?.coach || "Coach"}</p>
                        <div className="space-y-1.5">
                          {lineups.away?.startingEleven?.map((p) => (
                            <div key={p.number} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                              <span className="w-5 font-mono text-zinc-400">{p.number}</span>
                              <span className="flex-1 font-semibold text-zinc-200">
                                {p.name} {p.captain && "(C)"}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400">{p.pos}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. MATCH STATISTICS TAB */}
                {activeTab === "stats" && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    {/* Possession */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-zinc-300">
                        <span>{match.stats?.possession?.[0] || 50}%</span>
                        <span className="text-zinc-500 uppercase tracking-wider text-[10px]">Possession</span>
                        <span>{match.stats?.possession?.[1] || 50}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${match.stats?.possession?.[0] || 50}%` }}
                          className="h-full bg-emerald-500"
                        />
                        <div
                          style={{ width: `${match.stats?.possession?.[1] || 50}%` }}
                          className="h-full bg-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Stats Rows */}
                    {[
                      { label: "Shots on Target", home: match.stats?.shotsOnTarget?.[0] ?? 6, away: match.stats?.shotsOnTarget?.[1] ?? 4 },
                      { label: "Total Shots", home: match.stats?.shots?.[0] ?? 14, away: match.stats?.shots?.[1] ?? 9 },
                      { label: "Corner Kicks", home: match.stats?.corners?.[0] ?? 7, away: match.stats?.corners?.[1] ?? 3 },
                      { label: "Fouls Committed", home: match.stats?.fouls?.[0] ?? 8, away: match.stats?.fouls?.[1] ?? 12 },
                      { label: "Yellow Cards", home: match.stats?.yellowCards?.[0] ?? 1, away: match.stats?.yellowCards?.[1] ?? 2 },
                      { label: "Goalkeeper Saves", home: match.stats?.saves?.[0] ?? 3, away: match.stats?.saves?.[1] ?? 4 },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                        <span className="font-bold text-emerald-400 w-12 text-left">{s.home}</span>
                        <span className="text-zinc-400 font-medium text-center flex-1">{s.label}</span>
                        <span className="font-bold text-cyan-400 w-12 text-right">{s.away}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. H2H & FORM TAB */}
                {activeTab === "h2h" && (
                  <div className="space-y-4 max-w-lg mx-auto text-xs">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                      <h4 className="font-bold text-white text-xs">Recent Form Guide</h4>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-300">{match.homeTeamName}</span>
                        <div className="flex gap-1 font-bold text-[10px]">
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                          <span className="px-1.5 py-0.5 bg-zinc-600 rounded text-white">D</span>
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                          <span className="px-1.5 py-0.5 bg-red-600 rounded text-white">L</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-300">{match.awayTeamName}</span>
                        <div className="flex gap-1 font-bold text-[10px]">
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                          <span className="px-1.5 py-0.5 bg-zinc-600 rounded text-white">D</span>
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                          <span className="px-1.5 py-0.5 bg-red-600 rounded text-white">L</span>
                          <span className="px-1.5 py-0.5 bg-emerald-600 rounded text-white">W</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Fan Chat & Reactions */}
          <div className="space-y-4">
            <LiveChat matchId={match.id} viewersCount={match.viewersCount || 74200} />

            {/* Stream Info & Redundancy Card */}
            <div className="bg-[#0b101e] border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Stream Redundancy Protection</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                If the stream stalls or buffers, click the Server selector below the video player to immediately switch to another CDN edge.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
