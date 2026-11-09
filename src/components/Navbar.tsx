"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Play,
  Flame,
  Calendar,
  Trophy,
  Film,
  Search,
  ShieldCheck,
  X,
  Radio,
  Tv,
} from "lucide-react";

export function Navbar({
  activeSport,
  onSelectSport,
  showSportsFilter = true,
}: {
  activeSport?: string;
  onSelectSport?: (sport: string) => void;
  showSportsFilter?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sports = [
    { id: "all", label: "All Sports", icon: "⚡", liveCount: 4 },
    { id: "football", label: "Football", icon: "⚽", liveCount: 3 },
    { id: "basketball", label: "Basketball", icon: "🏀", liveCount: 1 },
    { id: "tennis", label: "Tennis", icon: "🎾", liveCount: 0 },
    { id: "mma", label: "UFC / MMA", icon: "🥊", liveCount: 0 },
    { id: "motorsport", label: "Motorsport", icon: "🏎️", liveCount: 0 },
  ];

  // Hotkey '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    if (pathname === "/") {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070a13]/90 backdrop-blur-xl border-b border-white/10 shadow-xl">
      {/* Top Brand & Global Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 opacity-0 group-hover:opacity-40 blur-xs transition-opacity -z-10" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  SCKOLL
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-widest bg-red-600/90 text-white rounded">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tracking-wider hidden sm:block font-medium">
                Ultra HD Sports Broadcast
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search teams (Arsenal, Real Madrid, Lakers) or leagues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f172a]/80 border border-white/10 rounded-full pl-10 pr-16 py-2 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 rounded">
                  /
                </kbd>
              )}
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                pathname === "/"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span>Live Matches</span>
            </Link>

            <Link
              href="/schedule"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                pathname === "/schedule"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Schedule</span>
            </Link>

            <Link
              href="/standings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                pathname === "/standings"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Standings</span>
            </Link>

            <Link
              href="/highlights"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                pathname === "/highlights"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Film className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Highlights</span>
            </Link>

            {/* Ultra HD 4K Badge */}
            <div className="hidden xl:flex items-center gap-1.5 ml-2 px-3 py-1 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-teal-500/10 border border-emerald-500/30 rounded-full text-xs font-bold text-emerald-300 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>4K Zero-Lag CDN</span>
            </div>
          </nav>
        </div>

        {/* Sports Quick Filter Pill Bar */}
        {showSportsFilter && (
          <div className="flex items-center gap-2 py-2.5 overflow-x-auto scrollbar-none border-t border-white/5 text-xs">
            {sports.map((sport) => {
              const isSelected = activeSport ? activeSport === sport.id : sport.id === "all";
              return (
                <button
                  key={sport.id}
                  onClick={() => onSelectSport && onSelectSport(sport.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/25 scale-[1.02]"
                      : "bg-[#0e1628] text-zinc-300 hover:text-white hover:bg-[#16223d] border border-white/5"
                  }`}
                >
                  <span>{sport.icon}</span>
                  <span>{sport.label}</span>
                  {sport.liveCount > 0 && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected
                          ? "bg-black text-emerald-400"
                          : "bg-red-600/80 text-white"
                      }`}
                    >
                      {sport.liveCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
