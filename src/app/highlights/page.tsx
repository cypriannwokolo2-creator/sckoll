"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LiveTicker } from "@/components/LiveTicker";
import { type HighlightItem, fetchHighlights } from "@/lib/api";
import { Play, Film, X, Sparkles, Flame, Eye } from "lucide-react";

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingHighlight, setPlayingHighlight] = useState<HighlightItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const list = await fetchHighlights();
      if (mounted) {
        setHighlights(list);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: "All Highlights" },
    { id: "epl", label: "Premier League" },
    { id: "ucl", label: "Champions League" },
    { id: "goals", label: "Top Goals" },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar showSportsFilter={false} />
      <LiveTicker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full font-black text-[10px] uppercase tracking-wider">
                VOD REPLAYS & GOALS
              </span>
              <span className="text-xs text-zinc-400">1080p 60fps HD</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 mt-1">
              <Film className="w-7 h-7 text-purple-400" />
              <span>Match Highlights, Goals & VOD Replays</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Watch official goal sequences, key penalty decisions, and post-match extended recaps with zero buffering.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedFilter === cat.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black scale-[1.02]"
                    : "bg-[#0e1628] text-zinc-300 hover:text-white border border-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 bg-[#0e1628] rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h) => (
              <div
                key={h.id}
                onClick={() => setPlayingHighlight(h)}
                className="group relative bg-[#0e1628] hover:bg-[#121c33] border border-white/10 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between hover:scale-[1.01]"
              >
                <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={h.thumbnailUrl}
                    alt={h.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform shadow-purple-600/40">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/85 backdrop-blur-xs text-white text-[10px] font-black rounded-md">
                    {h.duration}
                  </span>
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-purple-600/90 text-white text-[10px] font-black rounded-md uppercase shadow-md">
                    {h.competition}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white line-clamp-2">
                    {h.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5 font-medium">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{(h.views || 180000).toLocaleString()} views</span>
                    </span>
                    <span className="text-emerald-400 font-black">Watch Clip</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {playingHighlight && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPlayingHighlight(null)}
          >
            <div
              className="relative w-full max-w-4xl bg-[#090f1e] rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 bg-[#10172c] flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2 truncate mr-4">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded uppercase">
                    {playingHighlight.competition}
                  </span>
                  <h3 className="font-bold text-sm text-white truncate">{playingHighlight.title}</h3>
                </div>
                <button
                  onClick={() => setPlayingHighlight(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <video
                  src={playingHighlight.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
