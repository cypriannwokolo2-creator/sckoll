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
    { label: "Marketplace API", ok: null, detail: "Checking…" },
    { label: "Authentication", ok: null, detail: "Checking…" },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetch(`${API_URL}/health`).then((r) => r.json());
        const c = await fetch(`${API_URL}/v1/auth/config`).then((r) => r.json());
        if (cancelled) return;
        setChecks([
          { label: "Landing experience", ok: true, detail: "This page rendered — the site is up." },
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
