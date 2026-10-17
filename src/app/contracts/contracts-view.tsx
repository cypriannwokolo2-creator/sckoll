"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { api, type Contract } from "@/lib/api";

type Row = { contract: Contract; opportunity: { id: string; title: string; status: string } };

export default function ContractsView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [asClient, setAsClient] = useState<Row[]>([]);
  const [asTalent, setAsTalent] = useState<Row[]>([]);

  useEffect(() => {
    api
      .myContracts()
      .then((res) => {
        setAsClient(res.asClient);
        setAsTalent(res.asTalent);
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  const total = asClient.length + asTalent.length;

  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <Link href="/pipeline">Pipeline</Link>
            <Link href="/profile" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Profile
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-paper">
          <div className="sckoll-container">
            <Link href="/" className="sckoll-breadcrumb">
              ← Back to Sckoll
            </Link>
            <p className="sckoll-sub-eyebrow">Work agreements</p>
            <h1>Make the terms as clear as the opportunity.</h1>
            <p className="sckoll-sub-description">Scope, milestones, messages, and reviews — one thread per working relationship.</p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            {loading ? (
              <div className="sckoll-sub-card-grid">
                {[0, 1].map((i) => (
                  <div key={i} className="sckoll-sub-card">
                    <div className="sckoll-skeleton" style={{ height: "1.4rem", width: "40%" }} />
                    <div className="sckoll-skeleton" style={{ height: "2rem", marginTop: "4rem" }} />
                  </div>
                ))}
              </div>
            ) : total === 0 ? (
              <div className="sckoll-empty">
                <h3>No contracts yet.</h3>
                <p>Contracts start from accepted applications — apply to work or accept a candidate to begin.</p>
                <Link href="/find-work" className="sckoll-button sckoll-button-dark">
                  Browse work <span>↗</span>
                </Link>
              </div>
            ) : (
              <>
                {asClient.length > 0 && (
                  <>
                    <p className="sckoll-kicker" style={{ marginBottom: "1rem" }}>As a client</p>
                    <div className="sckoll-sub-card-grid" style={{ marginBottom: "2.5rem" }}>
                      {asClient.map(({ contract, opportunity }) => (
                        <article key={contract.id} className="sckoll-sub-card">
                          <p>{contract.status.toUpperCase()}</p>
                          <h3>{opportunity.title}</h3>
                          <span>{contract.scope.slice(0, 140)}{contract.scope.length > 140 ? "…" : ""}</span>
                          <Link href={`/contracts/${contract.id}`}>Open contract</Link>
                        </article>
                      ))}
                    </div>
                  </>
                )}
                {asTalent.length > 0 && (
                  <>
                    <p className="sckoll-kicker" style={{ marginBottom: "1rem" }}>As talent</p>
                    <div className="sckoll-sub-card-grid">
                      {asTalent.map(({ contract, opportunity }) => (
                        <article key={contract.id} className="sckoll-sub-card">
                          <p>{contract.status.toUpperCase()}</p>
                          <h3>{opportunity.title}</h3>
                          <span>{contract.scope.slice(0, 140)}{contract.scope.length > 140 ? "…" : ""}</span>
                          <Link href={`/contracts/${contract.id}`}>Open contract</Link>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
