"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import Mark from "@/components/Mark";

/**
 * Post-signup quick start (replaces the old 14-field "build your profile" wall).
 *
 * Progressive profiling: three fields that power first matches (headline,
 * skills, location) — or nothing at all via Skip. Bio, photo, availability,
 * rate, links and payout details all live on /profile, editable any time.
 * Clients skip the form entirely and get next-step CTAs instead.
 */
export default function ProfileSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState<"talent" | "client">("talent");
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  const [seed, setSeed] = useState<{ headline: string; location: string }>({ headline: "", location: "" });
  const chipInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        setRole(res.user.role === "client" || res.user.role === "both" ? "client" : "talent");
        setChips(res.profile?.skills ?? []);
        setSeed({
          headline: res.profile?.headline ?? "",
          location: res.profile?.location ?? "",
        });
        if (!res.user.emailVerified) {
          setNotice("Check your email for a confirmation link — your workspace is ready meanwhile.");
        }
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  function addChips(raw: string, prev: string[]) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    return [...new Set([...prev, ...parts])].slice(0, 20);
  }

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      await api.patchProfile({
        role,
        headline: String(form.get("headline") ?? "").trim() || undefined,
        location: String(form.get("location") ?? "").trim() || undefined,
        skills: chips,
      });
      router.push("/find-work");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save your profile.");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="sckoll-auth-page">
        <div className="sckoll-auth-brand">
          <Link href="/">
            <Mark small />
            <span className="font-wordmark uppercase tracking-[.28em]">SCKOLL</span>
          </Link>
        </div>
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Preparing your workspace…</p>
      </main>
    );
  }

  return (
    <main className="sckoll-auth-page">
      <div className="sckoll-auth-brand">
        <Link href="/">
          <Mark small />
          <span className="font-wordmark uppercase tracking-[.28em]">SCKOLL</span>
        </Link>
      </div>
      <section className="sckoll-auth-layout">
        <div className="sckoll-auth-message">
          <p className="sckoll-kicker">Step 2 of 2</p>
          <h1>{role === "client" ? "You’re in." : "Let’s get you matching."}</h1>
          <p>
            {role === "client"
              ? "Start a project to receive proposals, or look around first."
              : "Three fields power your first matches. The rest can wait."}
          </p>
        </div>
        <div className="sckoll-auth-card">
          {notice && <p className="sckoll-auth-success">{notice}</p>}
          {error && <p className="sckoll-auth-error">{error}</p>}
          {role === "client" ? (
            <div className="sckoll-quickstart">
              <p className="sckoll-quickstart-lede">
                Your account is ready. Post a project and matching talent will send proposals — you can
                flesh out your workspace profile later.
              </p>
              <Link href="/post-project" className="sckoll-button sckoll-button-dark">
                Post your first project <span>↗</span>
              </Link>
              <Link href="/profile" className="sckoll-quickstart-skip">
                Go to my workspace →
              </Link>
            </div>
          ) : (
            <form className="sckoll-auth-form" action={(f) => void onSubmit(f)}>
              <div className="sckoll-auth-card-heading">
                <p className="sckoll-kicker">Quick start · 10 seconds</p>
                <h2>Shape your signal</h2>
              </div>
              <label>
                Headline
                <input name="headline" placeholder="Senior backend engineer" defaultValue={seed.headline} />
              </label>
              <label>
                Skills
                <div className="sckoll-chips" onClick={() => chipInput.current?.focus()}>
                  {chips.map((chip) => (
                    <span key={chip} className="sckoll-chip">
                      {chip}
                      <button
                        type="button"
                        aria-label={`Remove ${chip}`}
                        onClick={() => setChips((prev) => prev.filter((c) => c !== chip))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    ref={chipInput}
                    className="sckoll-chips-input"
                    placeholder={chips.length === 0 ? "react, postgres, technical writing" : "Add a skill…"}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes(",")) {
                        setChips((prev) => addChips(value, prev));
                        e.target.value = "";
                      }
                    }}
                    onKeyDown={(e) => {
                      const el = e.currentTarget;
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const value = el.value;
                        setChips((prev) => addChips(value, prev));
                        el.value = "";
                      } else if (e.key === "Backspace" && el.value === "" && chips.length > 0) {
                        setChips((prev) => prev.slice(0, -1));
                      }
                    }}
                  />
                </div>
              </label>
              <label>
                Location
                <input name="location" placeholder="Remote / Lagos / London" defaultValue={seed.location} />
              </label>
              <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
                {busy ? "Starting…" : "Start matching"} <span>↗</span>
              </button>
              <Link href="/find-work" className="sckoll-quickstart-skip">
                Skip for now — just show me the feed →
              </Link>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
