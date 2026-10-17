"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api, type SavedSearch } from "@/lib/api";

export default function SavedSearchesView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .savedSearches()
      .then((res) => setSearches(res.searches))
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onSave(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const res = await api.createSavedSearch({
        query: String(form.get("query") ?? ""),
        filters: { type: String(form.get("type") ?? "") },
        emailAlerts: form.get("emailAlerts") === "on",
      });
      setSearches((prev) => [res.search, ...prev]);
      (document.getElementById("saved-search-form") as HTMLFormElement | null)?.reset();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await api.deleteSavedSearch(id);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // keep row on failure
    }
  }

  function runHref(s: SavedSearch): string {
    const params = new URLSearchParams();
    if (s.query) params.set("q", s.query);
    if (s.filters?.type) params.set("type", s.filters.type);
    const qs = params.toString();
    return `/find-work${qs ? `?${qs}` : ""}`;
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
          <p className="sckoll-kicker">For talent</p>
          <h1>Keep the searches worth returning to.</h1>
          <p>Save the roles, skills, and project patterns you care about — run them in one click.</p>
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">Saved searches</p>
            <h2>Your radar presets</h2>
          </div>
          {error && <p className="sckoll-auth-error">{error}</p>}
          {loading ? (
            <div className="sckoll-skeleton" style={{ height: "8rem" }} />
          ) : (
            <>
              {searches.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No saved searches yet — save your first below.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.5rem" }}>
                  {searches.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "0.55rem", padding: "0.6rem 0.8rem" }}>
                      <Link href={runHref(s)} style={{ fontSize: "0.85rem" }}>
                        {s.query || "All work"}
                        {s.filters?.type ? ` · ${s.filters.type}` : ""}
                        {s.emailAlerts ? " · alerts on" : ""}
                      </Link>
                      <button type="button" onClick={() => void onDelete(s.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form id="saved-search-form" className="sckoll-auth-form" action={(f) => void onSave(f)}>
                <label>
                  Keywords
                  <input name="query" placeholder="react, fintech" />
                </label>
                <label>
                  Type
                  <select name="type" defaultValue="">
                    <option value="">Any type</option>
                    <option value="project">Project</option>
                    <option value="role">Role</option>
                    <option value="contract">Contract</option>
                  </select>
                </label>
                <label className="sckoll-auth-check">
                  <input type="checkbox" name="emailAlerts" /> <span>Email me when matching work lands (daily digest).</span>
                </label>
                <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
                  {busy ? "Saving…" : "Save search"} <span>↗</span>
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
