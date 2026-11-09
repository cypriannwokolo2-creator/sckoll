"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play, Shield, Lock, Mail, User, Trophy, ArrowRight } from "lucide-react";

export default function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/v1/auth/signup" : "/v1/auth/signin";
      const payload = isSignUp
        ? { email, name, password, favoriteTeamId: favoriteTeam || undefined }
        : { email, password };

      const res = await fetch(`http://localhost:8110${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Store nickname
      if (data.user?.name) {
        localStorage.setItem("sckoll_fan_nickname", data.user.name);
      }

      router.push("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0e1628] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
            <span className="text-2xl font-black text-white tracking-wider">SCKOLL</span>
          </Link>
          <h2 className="text-lg font-bold text-white pt-2">
            {isSignUp ? "Create Your Fan Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-zinc-400">
            {isSignUp
              ? "Follow your favorite teams, unlock 4K streams and chat live."
              : "Sign in to access your customized match alerts and feeds."}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Fan Nickname</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. GoonerFan_99"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#141d33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="fan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141d33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#141d33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Favorite Team (Optional)</label>
              <div className="relative">
                <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="e.g. Arsenal, Real Madrid, Lakers"
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  className="w-full bg-[#141d33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-zinc-400">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          ) : (
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-emerald-400 font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
