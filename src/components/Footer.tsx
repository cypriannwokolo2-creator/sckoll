import Link from "next/link";
import { Play, Shield, Tv, Zap, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#060911] text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
              </div>
              <span className="text-lg font-black text-white tracking-wider">SCKOLL</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Global live sports match streaming network. Ultra HD streams, real-time live match statistics, tactical lineups, and interactive live fan chat.
            </p>
            <div className="flex items-center gap-3 text-zinc-500 text-xs pt-2">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" /> 0% Lag HLS
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Multi-CDN Redundancy
              </span>
            </div>
          </div>

          {/* Top Leagues */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Popular Leagues</h4>
            <ul className="space-y-2">
              <li><Link href="/?league=premier-league" className="hover:text-emerald-400 transition-colors">Premier League (EPL)</Link></li>
              <li><Link href="/?league=champions-league" className="hover:text-emerald-400 transition-colors">UEFA Champions League</Link></li>
              <li><Link href="/?league=la-liga" className="hover:text-emerald-400 transition-colors">La Liga (Spain)</Link></li>
              <li><Link href="/?league=serie-a" className="hover:text-emerald-400 transition-colors">Serie A (Italy)</Link></li>
              <li><Link href="/?league=bundesliga" className="hover:text-emerald-400 transition-colors">Bundesliga (Germany)</Link></li>
            </ul>
          </div>

          {/* Other Sports */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Sports Feeds</h4>
            <ul className="space-y-2">
              <li><Link href="/?sport=basketball" className="hover:text-emerald-400 transition-colors">NBA Basketball Live</Link></li>
              <li><Link href="/?sport=mma" className="hover:text-emerald-400 transition-colors">UFC & Boxing Main Cards</Link></li>
              <li><Link href="/?sport=tennis" className="hover:text-emerald-400 transition-colors">Grand Slam Tennis Streams</Link></li>
              <li><Link href="/?sport=motorsport" className="hover:text-emerald-400 transition-colors">Formula 1 Grand Prix</Link></li>
              <li><Link href="/highlights" className="hover:text-emerald-400 transition-colors">Top Goals & Recaps</Link></li>
            </ul>
          </div>

          {/* Legal & DMCA */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Platform Information</h4>
            <p className="text-zinc-500 text-xs leading-relaxed mb-3">
              Sckoll is a media streaming technology portal. All video streams are embedded from public internet protocols and external CDN providers.
            </p>
            <div className="flex items-center gap-2 text-zinc-500">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Broadcast region: Global UTC</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <p>© {new Date().getFullYear()} Sckoll Streaming Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-zinc-300">Privacy Policy</Link>
            <Link href="/" className="hover:text-zinc-300">Terms of Stream</Link>
            <Link href="/" className="hover:text-zinc-300">DMCA Notice</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
