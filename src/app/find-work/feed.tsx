"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import NotifBell from "@/components/NotifBell";
import { ApiError, api, budgetLabel, fitEstimate, type Opportunity } from "@/lib/api";

const TYPES = ["project", "role", "contract"];

function FeedInner({ q, type, category }: { q: string; type: string; category: string }) {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerSkills, setViewerSkills] = useState<string[]>([]);
  const [draft, setDraft] = useState(q);

  const loadMore = useCallback(
    async (nextCursor: string) => {
      setLoadingMore(true);
      try {
        const res = await api.opportunities({
          ...(q ? { q } : {}),
          ...(type ? { type } : {}),
          ...(category ? { category } : {}),
          limit: "12",
          cursor: nextCursor,
        });
        setOpps((prev) => [...prev, ...res.opportunities]);
        setCursor(res.nextCursor);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load more.");
      } finally {
        setLoadingMore(false);
      }
    },
    [q, type, category],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .opportunities({
        ...(q ? { q } : {}),
        ...(type ? { type } : {}),
        ...(category ? { category } : {}),
        limit: "12",
      })
      .then((res) => {
        if (cancelled) return;
        setOpps(res.opportunities);
        setCursor(res.nextCursor);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : "Could not load opportunities.");
        setLoading(false);
      });
    api
      .me()
      .then((res) => {
        if (!cancelled) setViewerSkills(res.profile?.skills ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [q, type, category]);

  return (
    <>
      <form action="/find-work" method="get" className="sckoll-search-form" style={{ marginBottom: "2rem" }}>
        <div className="sckoll-search-input">
          <input name="q" placeholder="Search jobs, projects, or skills" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        {type ? <input type="hidden" name="type" value={type} /> : null}
        {category ? <input type="hidden" name="category" value={category} /> : null}
        <button type="submit" className="sckoll-button sckoll-button-acid">
          Search
        </button>
      </form>
      {(type || category || q) && (
        <p style={{ marginBottom: "1.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
          {[
            q ? `“${q}”` : null,
            type ? type : null,
            category ? category.replace(/-/g, " ") : null,
          ]
            .filter(Boolean)
            .join(" · ")}{" "}
          <Link href="/find-work" style={{ textDecoration: "underline" }}>
            Clear filters
          </Link>
        </p>
      )}
      {loading ? (
        <div className="sckoll-sub-card-grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sckoll-sub-card">
              <div className="sckoll-skeleton" style={{ height: "1.4rem", width: "40%" }} />
              <div className="sckoll-skeleton" style={{ height: "2rem", marginTop: "4rem" }} />
              <div className="sckoll-skeleton" style={{ height: "1rem", marginTop: "0.7rem", width: "80%" }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="sckoll-auth-error">{error}</p>
      ) : opps.length === 0 ? (
        <div className="sckoll-empty">
          <h3>No open work matches that search.</h3>
          <p>Try fewer filters — or save this search and get notified when matching work lands.</p>
          <Link href="/sign-up?role=talent" className="sckoll-button sckoll-button-dark">
            Create your profile <span>↗</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="sckoll-sub-card-grid">
            {opps.map((opp) => {
              const fit = fitEstimate(viewerSkills, opp.skills);
              return (
                <article key={opp.id} className="sckoll-sub-card">
                  <p>
                    {opp.type.toUpperCase()} · {opp.category.replace(/-/g, " ").toUpperCase()}
                    {fit !== null && ` · ${fit}% FIT`}
                  </p>
                  <h3>{opp.title}</h3>
                  <span>
                    {budgetLabel(opp)}
                    {opp.remote ? " · Remote" : opp.location ? ` · ${opp.location}` : ""}
                  </span>
                  <Link href={`/find-work/${opp.id}`}>View details</Link>
                </article>
              );
            })}
          </div>
          {cursor && (
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
              <button
                type="button"
                className="sckoll-button sckoll-button-outline"
                disabled={loadingMore}
                onClick={() => void loadMore(cursor)}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function FeedParams() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const category = params.get("category") ?? "";
  return <FeedInner key={`${q}|${type}|${category}`} q={q} type={type} category={category} />;
}

export default function FindWorkPage() {
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
            <NotifBell />
            <Link href="/sign-in">Log in</Link>
            <Link href="/sign-up" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Sign up
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-dark">
          <div className="sckoll-container">
            <Link href="/" className="sckoll-breadcrumb">
              ← Back to Sckoll
            </Link>
            <p className="sckoll-sub-eyebrow">For freelancers and job seekers</p>
            <h1>Find work that fits before you apply.</h1>
            <div className="sckoll-sub-actions">
              <Link href="/find-work" className="sckoll-button sckoll-button-outline">
                All work
              </Link>
              {TYPES.map((t) => (
                <Link key={t} href={`/find-work?type=${t}`} className="sckoll-button sckoll-button-outline">
                  {t}s
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            <div className="sckoll-subsection-heading">
              <p className="sckoll-kicker">Open opportunities</p>
              <h2>Live work, ranked by relevance.</h2>
            </div>
            <Suspense>
              <FeedParams />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
