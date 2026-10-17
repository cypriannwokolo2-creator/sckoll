"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api, type TalentResult } from "@/lib/api";

function TalentFeed() {
  const router = useRouter();
  const params = useSearchParams();
  const [results, setResults] = useState<TalentResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());

  const q = params.get("q") ?? "";
  const skills = params.get("skills") ?? "";

  useEffect(() => {
    let cancelled = false;
    api
      .talentSearch({ ...(q ? { q } : {}), ...(skills ? { skills } : {}) })
      .then((res) => {
        if (cancelled) return;
        setResults(res.results);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) setNeedsAuth(true);
        else setError(e instanceof ApiError ? e.message : "Could not search talent.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, skills]);

  async function onShortlist(talentId: string) {
    try {
      await api.addShortlist({ talentId });
      setShortlisted((prev) => new Set(prev).add(talentId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        router.push("/profile/setup");
      }
    }
  }

  return (
    <>
      <form action="/find-talent" method="get" className="sckoll-search-form" style={{ marginBottom: "2rem" }}>
        <div className="sckoll-search-input">
          <input name="q" placeholder="Search by role, skill, or talent" defaultValue={q} />
        </div>
        <button type="submit" className="sckoll-button sckoll-button-acid">
          Search
        </button>
      </form>
      {loading ? (
        <div className="sckoll-sub-card-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sckoll-sub-card">
              <div className="sckoll-skeleton" style={{ height: "1.4rem", width: "40%" }} />
              <div className="sckoll-skeleton" style={{ height: "2rem", marginTop: "4rem" }} />
            </div>
          ))}
        </div>
      ) : needsAuth ? (
        <div className="sckoll-empty">
          <h3>Sign in to search talent.</h3>
          <p>Talent search is open to hiring accounts — create a free profile first.</p>
          <Link href="/sign-up?role=client" className="sckoll-button sckoll-button-dark">
            Create hiring account <span>↗</span>
          </Link>
        </div>
      ) : error ? (
        <p className="sckoll-auth-error">{error}</p>
      ) : results.length === 0 ? (
        <div className="sckoll-empty">
          <h3>No matching talent yet.</h3>
          <p>Try broader skills — new profiles join every day.</p>
          <Link href="/post-project" className="sckoll-button sckoll-button-dark">
            Post your project instead <span>↗</span>
          </Link>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: "1.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
            {total} match{total === 1 ? "" : "es"} · ranked by fit
          </p>
          <div className="sckoll-sub-card-grid">
            {results.map((t) => (
              <article key={t.id} className="sckoll-sub-card">
                <p>
                  {t.role.toUpperCase()} · {t.fit}% FIT
                </p>
                <h3>{t.name ?? "Talent"}</h3>
                <span>{t.headline ?? t.bio?.slice(0, 120) ?? "No headline yet."}</span>
                {t.skills.length > 0 && <span style={{ marginTop: "0.5rem" }}>{t.skills.slice(0, 5).join(" · ")}</span>}
                {(t.availability || t.hourlyRate) && (
                  <span style={{ marginTop: "0.5rem" }}>{[t.availability, t.hourlyRate].filter(Boolean).join(" · ")}</span>
                )}
                <div className="sckoll-sub-actions" style={{ marginTop: "1rem" }}>
                  <Link href={`/profile/${t.id}`}>View profile</Link>
                  {shortlisted.has(t.id) ? (
                    <span style={{ fontSize: "0.78rem", fontWeight: 800 }}>Shortlisted ✓</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void onShortlist(t.id)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.78rem", fontWeight: 800 }}
                    >
                      + Shortlist
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function FindTalentPage() {
  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-links">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/find-work">Find work</Link>
            <Link href="/find-talent">Find talent</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="sckoll-subnav-actions">
            <Link href="/team-workspace">Hiring room</Link>
            <Link href="/post-project" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Post a project
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-acid">
          <div className="sckoll-container">
            <Link href="/" className="sckoll-breadcrumb">
              ← Back to Sckoll
            </Link>
            <p className="sckoll-sub-eyebrow">For founders, agencies, and lean teams</p>
            <h1>Find the right person without becoming a recruiter.</h1>
            <p className="sckoll-sub-description">Search by the outcome you need — compare proof, fit, and availability in one view.</p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            <Suspense>
              <TalentFeed />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
