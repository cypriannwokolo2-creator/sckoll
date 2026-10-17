"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api, budgetLabel, type Opportunity } from "@/lib/api";

export default function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .opportunity(id)
      .then((res) => setOpp(res.opportunity))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this opportunity."));
  }, [id]);

  useEffect(() => {
    if (!opp) return;
    api
      .me()
      .then((res) => setIsOwner(res.user.id === opp.clientId))
      .catch(() => undefined);
  }, [opp]);

  async function onClose() {
    if (!opp || !confirm("Close this opportunity? It will stop receiving applications.")) return;
    setBusy(true);
    try {
      await api.closeOpportunity(opp.id);
      router.push("/find-work?mine=1");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not close.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <Link href="/sign-in">Log in</Link>
            <Link href="/sign-up" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Sign up
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-paper">
          <div className="sckoll-container">
            <Link href="/find-work" className="sckoll-breadcrumb">
              ← All opportunities
            </Link>
            {error ? (
              <p className="sckoll-auth-error">{error}</p>
            ) : !opp ? (
              <>
                <div className="sckoll-skeleton" style={{ height: "3rem", width: "70%" }} />
                <div className="sckoll-skeleton" style={{ height: "1.2rem", width: "50%", marginTop: "2rem" }} />
              </>
            ) : (
              <>
                <p className="sckoll-sub-eyebrow">
                  {opp.type} · {opp.category.replace(/-/g, " ")}
                </p>
                <h1>{opp.title}</h1>
                <p className="sckoll-sub-description">
                  {budgetLabel(opp)}
                  {opp.remote ? " · Remote" : opp.location ? ` · ${opp.location}` : ""}
                </p>
                <div className="sckoll-sub-actions">
                  {isOwner ? (
                    <button type="button" className="sckoll-button sckoll-button-outline" disabled={busy} onClick={() => void onClose()}>
                      {busy ? "Closing…" : "Close opportunity"}
                    </button>
                  ) : (
                    <Link href="/sign-up?role=talent" className="sckoll-button sckoll-button-acid">
                      Sign up to apply
                    </Link>
                  )}
                  <Link href="/how-it-works" className="sckoll-button sckoll-button-outline">
                    How applying works
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
        {opp && (
          <section className="sckoll-subsection">
            <div className="sckoll-container">
              <div className="sckoll-subsection-heading">
                <p className="sckoll-kicker">The brief</p>
                <h2>What needs to get done.</h2>
              </div>
              <p style={{ maxWidth: "44rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{opp.description}</p>
              {opp.skills.length > 0 && (
                <p style={{ marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                  Skills: {opp.skills.join(" · ")}
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
