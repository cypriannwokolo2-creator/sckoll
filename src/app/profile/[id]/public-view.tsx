"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api, type PublicProfile } from "@/lib/api";

function initials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function PublicProfileView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);

  useEffect(() => {
    api
      .publicProfile(id)
      .then((res) => setProfile(res.profile))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this profile."));
  }, [id]);

  async function onShortlist() {
    try {
      await api.addShortlist({ talentId: id });
      setShortlisted(true);
    } catch {
      setShortlisted(false);
    }
  }

  const links = profile ? Object.entries(profile.links ?? {}) : [];

  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark small />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-actions">
            <Link href="/find-talent">Find talent</Link>
            <Link href="/team-workspace" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Hiring room
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-paper">
          <div className="sckoll-container">
            <Link href="/find-talent" className="sckoll-breadcrumb">
              ← Talent search
            </Link>
            {error ? (
              <p className="sckoll-auth-error">{error}</p>
            ) : !profile ? (
              <>
                <div className="sckoll-skeleton" style={{ height: "3rem", width: "60%" }} />
                <div className="sckoll-skeleton" style={{ height: "1.2rem", width: "40%", marginTop: "2rem" }} />
              </>
            ) : (
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={profile.name ?? "Talent"} style={{ width: "5rem", height: "5rem", borderRadius: "1rem", objectFit: "cover" }} />
                ) : (
                  <span style={{ display: "grid", placeItems: "center", width: "5rem", height: "5rem", borderRadius: "1rem", background: "var(--black)", color: "var(--acid)", fontFamily: "var(--font-maven)", fontSize: "1.8rem", fontWeight: 800 }}>
                    {initials(profile.name)}
                  </span>
                )}
                <div style={{ flex: "1 1 20rem" }}>
                  <p className="sckoll-sub-eyebrow">{profile.role} · Sckoll talent</p>
                  <h1>{profile.name ?? "Sckoll talent"}</h1>
                  {profile.headline && <p className="sckoll-sub-description">{profile.headline}</p>}
                  <div className="sckoll-sub-actions">
                    {shortlisted ? (
                      <Link href="/team-workspace" className="sckoll-button sckoll-button-acid">
                        View in hiring room
                      </Link>
                    ) : (
                      <button type="button" className="sckoll-button sckoll-button-acid" onClick={() => void onShortlist()}>
                        + Shortlist
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        {profile && (
          <section className="sckoll-subsection">
            <div className="sckoll-container">
              <div className="sckoll-sub-card-grid">
                <article className="sckoll-sub-card">
                  <p>PROFILE</p>
                  <h3>About</h3>
                  <span style={{ whiteSpace: "pre-wrap" }}>{profile.bio || "No bio yet."}</span>
                  {(profile.availability || profile.hourlyRate || profile.location) && (
                    <span style={{ marginTop: "1rem" }}>{[profile.availability, profile.hourlyRate, profile.location].filter(Boolean).join(" · ")}</span>
                  )}
                </article>
                <article className="sckoll-sub-card">
                  <p>SKILLS</p>
                  <h3>What they do</h3>
                  <span>{profile.skills.length > 0 ? profile.skills.join(" · ") : "No skills listed yet."}</span>
                </article>
                <article className="sckoll-sub-card">
                  <p>LINKS</p>
                  <h3>Proof of work</h3>
                  {links.length > 0 ? (
                    <span>
                      {links.map(([k, v]) => (
                        <span key={k} style={{ display: "block" }}>
                          <a href={v} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                            {k}: {v.replace(/^https?:\/\//, "").slice(0, 40)}
                          </a>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span>No links yet.</span>
                  )}
                </article>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
