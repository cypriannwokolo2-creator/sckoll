"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Play, Flame, Calendar, Trophy, Film, Search, ShieldCheck } from "lucide-react";

export function Navbar({ activeSport, onSelectSport }: { activeSport?: string; onSelectSport?: (sport: string) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const sports = [
    { id: "all", label: "All Sports", icon: "⚡" },
    { id: "football", label: "Football", icon: "⚽" },
    { id: "basketball", label: "Basketball", icon: "🏀" },
    { id: "tennis", label: "Tennis", icon: "🎾" },
    { id: "mma", label: "UFC / MMA", icon: "🥊" },
    { id: "motorsport", label: "Motorsport", icon: "🏎️" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080c16]/95 backdrop-blur-md border-b border-white/10">
      {/* Top Brand & Global Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-wider text-white">SCKOLL</span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-600/90 text-white rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tracking-wider hidden sm:block">Ultra HD Match Streaming</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search teams (Arsenal, Real Madrid, Lakers) or leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12192c] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                pathname === "/" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span>Live Matches</span>
            </Link>

            <Link
              href="/schedule"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                pathname === "/schedule" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Schedule</span>
            </Link>

            <Link
              href="/standings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                pathname === "/standings" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Standings</span>
            </Link>

            <Link
              href="/highlights"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                pathname === "/highlights" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Film className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Highlights</span>
            </Link>

            {/* VIP Pass Badge */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>4K Pro Feed Active</span>
            </div>
          </nav>
        </div>

        {/* Sports Quick Filter Pill Bar */}
        <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none border-t border-white/5 text-xs">
          {sports.map((sport) => {
            const isSelected = activeSport ? activeSport === sport.id : sport.id === "all";
            return (
              <button
                key={sport.id}
                onClick={() => onSelectSport && onSelectSport(sport.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                    : "bg-[#111827] text-zinc-300 hover:text-white hover:bg-[#1e293b] border border-white/5"
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
