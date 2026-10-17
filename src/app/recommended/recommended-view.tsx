"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import NotifBell from "@/components/NotifBell";
import { ApiError, api, budgetLabel, type Opportunity } from "@/lib/api";

function RecommendedFeed() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .me()
      .then((me) => {
        const skills = (me.profile?.skills ?? []).join(",");
        return api.opportunities(skills ? { skills } : { limit: "12" });
      })
      .then((res) => setOpps(res.opportunities.slice(0, 12)))
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) router.push("/sign-in");
        else setError(e instanceof ApiError ? e.message : "Could not load recommendations.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="sckoll-sub-card-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sckoll-sub-card">
            <div className="sckoll-skeleton" style={{ height: "1.4rem", width: "40%" }} />
            <div className="sckoll-skeleton" style={{ height: "2rem", marginTop: "4rem" }} />
          </div>
        ))}
      </div>
    );
  }
  if (error) return <p className="sckoll-auth-error">{error}</p>;
  if (opps.length === 0) {
    return (
      <div className="sckoll-empty">
        <h3>Nothing matches yet.</h3>
        <p>Add skills to your profile and the feed sharpens around them.</p>
        <Link href="/profile/setup" className="sckoll-button sckoll-button-dark">
          Complete your profile <span>↗</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="sckoll-sub-card-grid">
      {opps.map((opp) => (
        <article key={opp.id} className="sckoll-sub-card">
          <p>
            {opp.type.toUpperCase()} · {opp.category.replace(/-/g, " ").toUpperCase()}
          </p>
          <h3>{opp.title}</h3>
          <span>{budgetLabel(opp)}</span>
          <Link href={`/find-work/${opp.id}`}>View details</Link>
        </article>
      ))}
    </div>
  );
}

export default function RecommendedPage() {
  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <NotifBell />
            <Link href="/pipeline">Pipeline</Link>
            <Link href="/profile" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Profile
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
            <p className="sckoll-sub-eyebrow">Your opportunity feed</p>
            <h1>Recommended for you.</h1>
            <p className="sckoll-sub-description">Ranked around your profile skills — the more proof you add, the sharper it gets.</p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            <Suspense>
              <RecommendedFeed />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
