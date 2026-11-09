"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { type HighlightItem, fetchHighlights } from "@/lib/api";
import { Play, Film, X } from "lucide-react";

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingHighlight, setPlayingHighlight] = useState<HighlightItem | null>(null);

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

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Film className="w-6 h-6 text-purple-400" />
            <span>Match Highlights, Goals & VOD Replays</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Watch full goal sequences, key penalty decisions, and post-match extended recaps in 1080p 60fps.
          </p>
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
                className="group relative bg-[#0e1628] border border-white/10 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-all cursor-pointer shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
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
                  <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white line-clamp-2">
                    {h.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-white/5">
                    <span>{(h.views || 180000).toLocaleString()} views</span>
                    <span className="text-emerald-400 font-bold">Watch Video</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {playingHighlight && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-[#0b101e] rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
              <div className="p-4 bg-[#12192c] flex items-center justify-between border-b border-white/10">
                <h3 className="font-bold text-white text-sm truncate mr-4">
                  {playingHighlight.title}
                </h3>
                <button
                  onClick={() => setPlayingHighlight(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
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
