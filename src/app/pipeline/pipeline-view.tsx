"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { api, type Application, type Opportunity } from "@/lib/api";

const COLUMNS = [
  { key: "applied", title: "Applied" },
  { key: "shortlisted", title: "Shortlisted" },
  { key: "accepted", title: "Accepted" },
  { key: "rejected", title: "Closed" },
] as const;

export default function PipelineView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<Record<string, Array<{ application: Application; opportunity: Opportunity }>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .pipeline()
      .then((res) => setPipeline(res.pipeline))
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onWithdraw(id: string) {
    if (!confirm("Withdraw this application?")) return;
    setBusy(id);
    try {
      await api.withdrawApplication(id);
      setPipeline((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key]!.filter((r) => r.application.id !== id);
        }
        return next;
      });
    } catch {
      // keep row on failure
    } finally {
      setBusy(null);
    }
  }

  const total = Object.values(pipeline).reduce((n, rows) => n + rows.length, 0);

  return (
    <main className="sckoll-auth-page" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="sckoll-auth-brand">
        <Link href="/" style={{ color: "var(--ink)" }}>
          <Mark small />
          <span className="font-wordmark uppercase tracking-[.28em]">SCKOLL</span>
        </Link>
      </div>
      <section className="sckoll-container" style={{ paddingBottom: "5rem" }}>
        <p className="sckoll-kicker">Your opportunity pipeline</p>
        <h1 style={{ fontFamily: "var(--font-maven)", fontSize: "clamp(2.2rem,5vw,3.5rem)", letterSpacing: "-0.05em", margin: "0.6rem 0 2rem" }}>
          Know what is moving.
        </h1>
        {loading ? (
          <div className="sckoll-sub-step-grid">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="sckoll-skeleton" style={{ height: "10rem" }} />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="sckoll-empty">
            <h3>No applications yet.</h3>
            <p>Find work that fits, send a sharp pitch, and track every move here.</p>
            <Link href="/find-work" className="sckoll-button sckoll-button-dark">
              Browse opportunities <span>↗</span>
            </Link>
          </div>
        ) : (
          <div className="sckoll-sub-step-grid">
            {COLUMNS.map((col) => (
              <div key={col.key}>
                <p className="sckoll-kicker" style={{ marginBottom: "1rem" }}>
                  {col.title} · {(pipeline[col.key] ?? []).length}
                </p>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {(pipeline[col.key] ?? []).map(({ application, opportunity }) => (
                    <article key={application.id} className="sckoll-sub-card" style={{ minHeight: "auto", padding: "1rem" }}>
                      <p>
                        {opportunity.type.toUpperCase()}
                        {application.fitScore != null ? ` · ${application.fitScore}% FIT` : ""}
                      </p>
                      <h3 style={{ fontSize: "1.05rem", marginTop: "0.6rem" }}>{opportunity.title}</h3>
                      <span>{application.bidAmount != null ? `Bid: $${application.bidAmount.toLocaleString()}` : "No bid set"}</span>
                      <Link href={`/find-work/${opportunity.id}`}>Open</Link>
                      {(col.key === "applied" || col.key === "shortlisted") && (
                        <button
                          type="button"
                          disabled={busy === application.id}
                          onClick={() => void onWithdraw(application.id)}
                          style={{ marginTop: "0.75rem", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.78rem", color: "var(--muted)", textDecoration: "underline" }}
                        >
                          Withdraw
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
