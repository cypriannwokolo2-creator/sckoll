"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

interface Story {
  opportunityTitle: string;
  category: string;
  stars: number;
  text: string;
  completedAt: string;
}

export default function SuccessStoriesView() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/v1/success-stories`)
      .then((r) => r.json())
      .then((d: { stories?: Story[] }) => {
        if (!cancelled) setStories(d.stories ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <Link href="/find-work">Find work</Link>
            <Link href="/sign-up" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Get started
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
            <p className="sckoll-sub-eyebrow">Proof in progress</p>
            <h1>Better matches create better work stories.</h1>
            <p className="sckoll-sub-description">Real completed contracts with five-star reviews — pulled live from the marketplace.</p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            {loading ? (
              <div className="sckoll-sub-card-grid">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="sckoll-sub-card">
                    <div className="sckoll-skeleton" style={{ height: "1.4rem", width: "40%" }} />
                    <div className="sckoll-skeleton" style={{ height: "2rem", marginTop: "4rem" }} />
                  </div>
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="sckoll-empty">
                <h3>The first stories are being written.</h3>
                <p>Every completed contract with a five-star review lands here automatically. Yours could be next.</p>
                <Link href="/sign-up" className="sckoll-button sckoll-button-dark">
                  Become an early story <span>↗</span>
                </Link>
              </div>
            ) : (
              <div className="sckoll-sub-card-grid">
                {stories.map((s, i) => (
                  <article key={`${s.opportunityTitle}-${i}`} className="sckoll-sub-card">
                    <p>{"★".repeat(s.stars)} · {s.category.replace(/-/g, " ").toUpperCase()}</p>
                    <h3>{s.opportunityTitle}</h3>
                    <span>{s.text ? `“${s.text.slice(0, 180)}${s.text.length > 180 ? "…" : ""}”` : "Completed and five-star reviewed."}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
