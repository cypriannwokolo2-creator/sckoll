"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

interface Check {
  label: string;
  ok: boolean | null;
  detail: string;
}

export default function StatusView() {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Landing experience", ok: true, detail: "This page rendered — the site is up." },
    { label: "Core services (db / cache)", ok: null, detail: "Checking…" },
    { label: "Marketplace API", ok: null, detail: "Checking…" },
    { label: "Authentication", ok: null, detail: "Checking…" },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, c, rz] = await Promise.all([
          fetch(`${API_URL}/health`).then((r) => r.json()),
          fetch(`${API_URL}/v1/auth/config`).then((r) => r.json()),
          fetch(`${API_URL}/readyz`).then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => null) })).catch(() => null),
        ]);
        if (cancelled) return;
        const checks2 = rz?.body?.checks;
        const deps = checks2
          ? [
              `database ${String(checks2.database?.latencyMs ?? "?")}ms`,
              checks2.redis ? `cache ${String(checks2.redis.latencyMs)}ms` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : "";
        setChecks([
          { label: "Landing experience", ok: true, detail: "This page rendered — the site is up." },
          {
            label: "Core services (db / cache)",
            ok: rz?.ok === true,
            detail: rz?.ok === true ? `Reachable — ${deps}` : "Degraded — some dependencies are unreachable.",
          },
          { label: "Marketplace API", ok: h?.ok === true, detail: h?.ok === true ? `Responding (${h.service} ${h.version})` : "Not responding" },
          { label: "Authentication", ok: c?.email_password_enabled === true, detail: `Email sign-in ${c?.email_password_enabled ? "on" : "off"} · Google ${c?.google_enabled ? "on" : "off"}` },
        ]);
      } catch {
        if (cancelled) return;
        setChecks((prev) => prev.map((c) => (c.ok === null ? { ...c, ok: false, detail: "Unreachable from your browser" } : c)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allOk = checks.every((c) => c.ok === true);

  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <Link href="/contact">Contact</Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-dark">
          <div className="sckoll-container">
            <Link href="/" className="sckoll-breadcrumb">
              ← Back to Sckoll
            </Link>
            <p className="sckoll-sub-eyebrow">Platform status</p>
            <h1>{allOk ? "All systems moving." : "Checking the radar…"}</h1>
            <p className="sckoll-sub-description">Live checks from your browser to the Sckoll API — no marketing, just signals.</p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            <div className="sckoll-sub-card-grid">
              {checks.map((c) => (
                <article key={c.label} className="sckoll-sub-card">
                  <p>{c.ok === null ? "CHECKING" : c.ok ? "ONLINE" : "DOWN"}</p>
                  <h3>{c.label}</h3>
                  <span>{c.detail}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
