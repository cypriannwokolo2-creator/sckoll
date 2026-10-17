"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import NotifBell from "@/components/NotifBell";
import { api, type Profile } from "@/lib/api";

interface RoomEntry {
  id: string;
  talentId: string;
  opportunityId: string | null;
  notes: string;
  talent: { id: string; name: string | null; role: string; emailVerified: boolean };
  profile: Profile | null;
  opportunity: { id: string; title: string; status: string } | null;
}

export default function TeamWorkspaceView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<RoomEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api
      .shortlists()
      .then((res) => {
        setEntries(res.shortlists);
        const d: Record<string, string> = {};
        for (const e of res.shortlists) d[e.id] = e.notes;
        setDrafts(d);
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onSaveNotes(id: string) {
    try {
      await api.patchShortlist(id, { notes: drafts[id] ?? "" });
      setSaved(id);
      setTimeout(() => setSaved((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      // keep draft on failure
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Remove from shortlist?")) return;
    try {
      await api.removeShortlist(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // keep row on failure
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
            <NotifBell />
            <Link href="/find-talent">Find talent</Link>
            <Link href="/post-project" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Post a project
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-dark">
          <div className="sckoll-container">
            <Link href="/find-talent" className="sckoll-breadcrumb">
              ← Talent search
            </Link>
            <p className="sckoll-sub-eyebrow">For teams</p>
            <h1>A hiring room, not another spreadsheet.</h1>
            <p className="sckoll-sub-description">Your shortlist, team notes, and next steps — one place the whole hiring loop can use.</p>
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
            ) : entries.length === 0 ? (
              <div className="sckoll-empty">
                <h3>Your hiring room is empty.</h3>
                <p>Search talent and shortlist the people you want to compare with your team.</p>
                <Link href="/find-talent" className="sckoll-button sckoll-button-dark">
                  Search talent <span>↗</span>
                </Link>
              </div>
            ) : (
              <div className="sckoll-sub-card-grid">
                {entries.map((e) => (
                  <article key={e.id} className="sckoll-sub-card">
                    <p>{e.opportunity ? `FOR: ${e.opportunity.title.toUpperCase().slice(0, 40)}` : "GENERAL SHORTLIST"}</p>
                    <h3>{e.talent.name ?? "Talent"}</h3>
                    <span>{e.profile?.headline ?? "No headline yet."}</span>
                    {e.profile?.skills?.length ? <span>Skills: {e.profile.skills.slice(0, 5).join(" · ")}</span> : null}
                    <label style={{ display: "grid", gap: "0.4rem", marginTop: "1rem", fontSize: "0.72rem", fontWeight: 700 }}>
                      TEAM NOTES
                      <textarea
                        rows={3}
                        value={drafts[e.id] ?? ""}
                        onChange={(ev) => setDrafts((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                        placeholder="Interview notes, verdicts, next steps…"
                        style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.6rem", font: "inherit", fontSize: "0.8rem" }}
                      />
                    </label>
                    <div className="sckoll-sub-actions" style={{ marginTop: "1rem" }}>
                      <button type="button" className="sckoll-button sckoll-button-acid sckoll-button-small" onClick={() => void onSaveNotes(e.id)}>
                        {saved === e.id ? "Saved ✓" : "Save notes"}
                      </button>
                      <Link href={`/profile/${e.talentId}`} className="sckoll-button sckoll-button-outline sckoll-button-small">
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => void onRemove(e.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--muted)", textDecoration: "underline" }}
                      >
                        Remove
                      </button>
                    </div>
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
