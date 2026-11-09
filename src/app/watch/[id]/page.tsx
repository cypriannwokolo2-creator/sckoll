"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LiveChat } from "@/components/LiveChat";
import { LiveTicker } from "@/components/LiveTicker";
import { TacticalPitch } from "@/components/TacticalPitch";
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
  Radio,
  Flame,
  Check,
  Award,
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
        <Navbar showSportsFilter={false} />
        <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-400 font-bold text-sm tracking-wide">Connecting Ultra HD Stream Server...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!data || !data.match) {
    return (
      <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
        <Navbar showSportsFilter={false} />
        <div className="flex-1 max-w-7xl w-full mx-auto p-8 text-center flex flex-col items-center justify-center space-y-4">
          <Trophy className="w-12 h-12 text-zinc-600" />
          <h2 className="text-xl font-bold">Match Broadcast Unavailable</h2>
          <p className="text-zinc-400 text-sm max-w-md">
            This match broadcast is either finished or has not been scheduled yet.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-emerald-500 text-black font-black text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
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
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar showSportsFilter={false} />
      <LiveTicker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation & Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Back to matches"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  {match.leagueName}
                </span>
                {match.round && <span className="text-xs text-zinc-500">• {match.round}</span>}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {match.homeTeamName} vs {match.awayTeamName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Link Copied!" : "Share Stream"}</span>
            </button>
          </div>
        </div>

        {/* Video Player & Live Chat Layout */}
        <div className={`grid gap-6 ${isTheaterMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
          {/* Main Video Stream Player Container */}
          <div className={isTheaterMode ? "w-full space-y-5" : "lg:col-span-2 space-y-5"}>
            <VideoPlayer
              streams={streams}
              matchTitle={`${match.homeTeamName} vs ${match.awayTeamName}`}
              isLive={isLive}
              onTheaterToggle={(t) => setIsTheaterMode(t)}
              isTheaterMode={isTheaterMode}
            />

            {/* Match Scoreboard Strip */}
            <div className="bg-gradient-to-r from-[#0d1426] to-[#0a101f] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Home */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-black text-sm text-white shadow-md">
                    {match.homeTeamShort}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{match.homeTeamName}</h3>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Home</span>
                  </div>
                </div>

                {/* Score */}
                <div className="px-4 py-2 bg-black/60 border border-white/15 rounded-xl shadow-inner">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                    {match.homeScore} : {match.awayScore}
                  </span>
                </div>

                {/* Away */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center font-black text-sm text-white shadow-md">
                    {match.awayTeamShort}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">{match.awayTeamName}</h3>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Away</span>
                  </div>
                </div>
              </div>

              {/* Status & Minute */}
              <div className="flex items-center gap-3 text-xs">
                {isLive ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs rounded-lg shadow-md shadow-red-600/30">
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

            {/* Interactive Match Center Tabs (Timeline, Lineups, Stats, H2H) */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="flex border-b border-white/10 bg-[#080d1a] text-xs font-bold">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 py-3 text-center transition-all border-b-2 ${
                    activeTab === "timeline"
                      ? "border-emerald-500 text-emerald-400 bg-white/5 font-black"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Timeline ({events.length})
                </button>

                <button
                  onClick={() => setActiveTab("lineups")}
                  className={`flex-1 py-3 text-center transition-all border-b-2 ${
                    activeTab === "lineups"
                      ? "border-emerald-500 text-emerald-400 bg-white/5 font-black"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Tactical Board
                </button>

                <button
                  onClick={() => setActiveTab("stats")}
                  className={`flex-1 py-3 text-center transition-all border-b-2 ${
                    activeTab === "stats"
                      ? "border-emerald-500 text-emerald-400 bg-white/5 font-black"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  Match Statistics
                </button>

                <button
                  onClick={() => setActiveTab("h2h")}
                  className={`flex-1 py-3 text-center transition-all border-b-2 ${
                    activeTab === "h2h"
                      ? "border-emerald-500 text-emerald-400 bg-white/5 font-black"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  H2H & Form
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6 text-sm">
                {/* 1. TIMELINE & COMMENTARY TAB */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    {events.length === 0 ? (
                      <p className="text-zinc-500 text-xs text-center py-6">
                        No match events recorded yet. Kickoff commentary and goals will appear here live.
                      </p>
                    ) : (
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:to-transparent">
                        {events.map((ev) => (
                          <div
                            key={ev.id}
                            className="relative flex items-start gap-3 p-3.5 bg-gradient-to-r from-black/40 to-black/20 rounded-xl border border-white/5 text-xs group hover:border-emerald-500/30 transition-colors"
                          >
                            <span className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-[#0d1426]" />
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
                              {ev.detail && <p className="text-zinc-400 text-[11px] mt-1">{ev.detail}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. TACTICAL BOARD (Interactive Visual Pitch) */}
                {activeTab === "lineups" && (
                  <TacticalPitch
                    homeTeam={{
                      name: match.homeTeamName,
                      shortName: match.homeTeamShort,
                      lineup: lineups.home,
                    }}
                    awayTeam={{
                      name: match.awayTeamName,
                      shortName: match.awayTeamShort,
                      lineup: lineups.away,
                    }}
                  />
                )}

                {/* 3. MATCH STATISTICS TAB */}
                {activeTab === "stats" && (
                  <div className="space-y-5 max-w-xl mx-auto">
                    {/* Header Teams */}
                    <div className="flex justify-between items-center text-xs font-black pb-2 border-b border-white/10">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>{match.homeTeamName}</span>
                      </span>
                      <span className="text-zinc-500 uppercase tracking-widest text-[10px]">Head to Head Stats</span>
                      <span className="text-cyan-400 flex items-center gap-1.5">
                        <span>{match.awayTeamName}</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      </span>
                    </div>

                    {/* Possession Meter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-emerald-400">{match.stats?.possession?.[0] || 54}%</span>
                        <span className="text-zinc-400 uppercase tracking-wider text-[11px] font-bold">Ball Possession</span>
                        <span className="text-cyan-400">{match.stats?.possession?.[1] || 46}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${match.stats?.possession?.[0] || 54}%` }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        />
                        <div
                          style={{ width: `${match.stats?.possession?.[1] || 46}%` }}
                          className="h-full bg-gradient-to-l from-cyan-600 to-cyan-400"
                        />
                      </div>
                    </div>

                    {/* Stats Rows */}
                    {[
                      { label: "Shots on Target", home: match.stats?.shotsOnTarget?.[0] ?? 6, away: match.stats?.shotsOnTarget?.[1] ?? 4 },
                      { label: "Total Shots", home: match.stats?.shots?.[0] ?? 15, away: match.stats?.shots?.[1] ?? 9 },
                      { label: "Corner Kicks", home: match.stats?.corners?.[0] ?? 7, away: match.stats?.corners?.[1] ?? 3 },
                      { label: "Fouls Committed", home: match.stats?.fouls?.[0] ?? 8, away: match.stats?.fouls?.[1] ?? 12 },
                      { label: "Yellow Cards", home: match.stats?.yellowCards?.[0] ?? 1, away: match.stats?.yellowCards?.[1] ?? 2 },
                      { label: "Goalkeeper Saves", home: match.stats?.saves?.[0] ?? 3, away: match.stats?.saves?.[1] ?? 5 },
                    ].map((s) => {
                      const total = Math.max(s.home + s.away, 1);
                      const homePercent = (s.home / total) * 100;
                      return (
                        <div key={s.label} className="space-y-1 py-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-emerald-400 w-10 text-left">{s.home}</span>
                            <span className="text-zinc-300 font-semibold text-center flex-1">{s.label}</span>
                            <span className="font-black text-cyan-400 w-10 text-right">{s.away}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden flex">
                            <div style={{ width: `${homePercent}%` }} className="h-full bg-emerald-500" />
                            <div style={{ width: `${100 - homePercent}%` }} className="h-full bg-cyan-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. H2H & FORM TAB */}
                {activeTab === "h2h" && (
                  <div className="space-y-4 max-w-lg mx-auto text-xs">
                    <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Recent Form (Last 5 Fixtures)</span>
                      </h4>
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="font-bold text-zinc-200">{match.homeTeamName}</span>
                        <div className="flex gap-1.5 font-bold text-[10px]">
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-zinc-600 text-white">D</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-red-600 text-white">L</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-200">{match.awayTeamName}</span>
                        <div className="flex gap-1.5 font-bold text-[10px]">
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-zinc-600 text-white">D</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-red-600 text-white">L</span>
                          <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">W</span>
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
