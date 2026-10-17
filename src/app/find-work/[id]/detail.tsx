"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import NotifBell from "@/components/NotifBell";
import ApplyModal from "@/components/ApplyModal";
import { ApiError, api, budgetLabel, trackMatchEvent, type Application, type Opportunity, type Profile } from "@/lib/api";

type InboxRow = Application & {
  talent: { id: string; name: string | null; emailVerified: boolean };
  profile: Profile | null;
};

function OwnerInbox({ oppId }: { oppId: string }) {
  const [rows, setRows] = useState<InboxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api
      .oppApplications(oppId)
      .then((res) => setRows(res.applications))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [oppId]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await api.setApplicationStatus(id, status);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: res.application.status } : r)));
    } catch {
      // keep rows; error surfaces via button state reset
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="sckoll-skeleton" style={{ height: "6rem", marginTop: "2rem" }} />;
  if (rows.length === 0) {
    return (
      <div className="sckoll-empty" style={{ marginTop: "2rem" }}>
        <h3>No applications yet.</h3>
        <p>Share this opportunity or wait for the radar to surface it to matching talent.</p>
      </div>
    );
  }
  return (
    <div className="sckoll-sub-card-grid" style={{ marginTop: "2rem" }}>
      {rows.map((row) => (
        <article key={row.id} className="sckoll-sub-card">
          <p>
            {row.status.toUpperCase()}
            {row.fitScore != null ? ` · ${row.fitScore}% FIT` : ""}
          </p>
          <h3>{row.talent.name ?? "Talent"}</h3>
          <span style={{ whiteSpace: "pre-wrap" }}>{row.pitch.slice(0, 220)}{row.pitch.length > 220 ? "…" : ""}</span>
          {row.bidAmount != null && (
            <span style={{ marginTop: "0.5rem" }}>
              Bid: ${row.bidAmount.toLocaleString()}
              {row.bidType === "hourly" ? "/hr" : ""}
            </span>
          )}
          {row.profile?.skills?.length ? <span>Skills: {row.profile.skills.join(" · ")}</span> : null}
          {row.status !== "accepted" && row.status !== "rejected" && (
            <div className="sckoll-sub-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="sckoll-button sckoll-button-outline sckoll-button-small" disabled={busy === row.id} onClick={() => void setStatus(row.id, "shortlisted")}>
                Shortlist
              </button>
              <button type="button" className="sckoll-button sckoll-button-acid sckoll-button-small" disabled={busy === row.id} onClick={() => void setStatus(row.id, "accepted")}>
                Accept
              </button>
              <button type="button" className="sckoll-button sckoll-button-outline sckoll-button-small" disabled={busy === row.id} onClick={() => void setStatus(row.id, "rejected")}>
                Reject
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .opportunity(id)
      .then((res) => {
        setOpp(res.opportunity);
        trackMatchEvent({ eventType: "view", targetType: "opportunity", targetId: id, scoreRules: res.opportunity.fitRules ?? undefined, scoreVector: res.opportunity.fitVector ?? undefined, finalScore: res.opportunity.fit ?? undefined });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load this opportunity."));
  }, [id]);

  useEffect(() => {
    if (!opp) return;
    api
      .me()
      .then((res) => {
        setSignedIn(true);
        setIsOwner(res.user.id === opp.clientId);
      })
      .catch(() => undefined);
  }, [opp]);

  async function onSaveEdit(form: FormData) {
    if (!opp) return;
    setEditMsg(null);
    setBusy(true);
    try {
      const minRaw = String(form.get("budgetMin") ?? "");
      const maxRaw = String(form.get("budgetMax") ?? "");
      const min = Number(minRaw);
      const max = Number(maxRaw);
      const res = await api.updateOpportunity(opp.id, {
        title: String(form.get("title") ?? "").trim() || undefined,
        description: String(form.get("description") ?? "").trim() || undefined,
        ...(minRaw !== "" && Number.isFinite(min) && min >= 0 ? { budgetMin: min } : {}),
        ...(maxRaw !== "" && Number.isFinite(max) && max >= 0 ? { budgetMax: max } : {}),
      });
      setOpp(res.opportunity);
      setEditing(false);
      setEditMsg("Posting updated.");
    } catch (e) {
      setEditMsg(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

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
            <NotifBell />
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
                    <>
                      <button type="button" className="sckoll-button sckoll-button-outline" onClick={() => setEditing(!editing)}>
                        {editing ? "Cancel edit" : "Edit posting"}
                      </button>
                      <button type="button" className="sckoll-button sckoll-button-outline" disabled={busy} onClick={() => void onClose()}>
                        {busy ? "Closing…" : "Close opportunity"}
                      </button>
                    </>
                  ) : applied ? (
                    <Link href="/pipeline" className="sckoll-button sckoll-button-acid">
                      View in your pipeline
                    </Link>
                  ) : showApply ? null : (
                    <button
                      type="button"
                      className="sckoll-button sckoll-button-acid"
                      onClick={() => (signedIn ? setShowApply(true) : router.push("/sign-up?role=talent"))}
                    >
                      {signedIn ? "Apply now" : "Sign up to apply"}
                    </button>
                  )}
                  <Link href="/how-it-works" className="sckoll-button sckoll-button-outline">
                    How applying works
                  </Link>
                </div>
                {showApply && !applied && (
                  <ApplyModal opp={opp} onClose={() => setShowApply(false)} onApplied={() => { setApplied(true); setShowApply(false); trackMatchEvent({ eventType: "apply", targetType: "opportunity", targetId: id }); }} />
                )}
                {editing && isOwner && (
                  <form className="sckoll-auth-form" style={{ marginTop: "2rem", maxWidth: "40rem" }} action={(f) => void onSaveEdit(f)}>
                    <label>
                      Title
                      <input name="title" minLength={10} maxLength={160} defaultValue={opp.title} style={{ borderColor: "var(--line)", background: "var(--white)", color: "var(--ink)" }} />
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows={4} minLength={50} maxLength={5000} defaultValue={opp.description} style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.7rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                    </label>
                    <label>
                      Budget min ($)
                      <input name="budgetMin" type="number" min={0} defaultValue={opp.budgetMin ?? ""} style={{ borderColor: "var(--line)", background: "var(--white)", color: "var(--ink)" }} />
                    </label>
                    <label>
                      Budget max ($)
                      <input name="budgetMax" type="number" min={0} defaultValue={opp.budgetMax ?? ""} style={{ borderColor: "var(--line)", background: "var(--white)", color: "var(--ink)" }} />
                    </label>
                    <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
                      {busy ? "Saving\u2026" : "Save changes"}
                    </button>
                    {editMsg && <p className="sckoll-auth-success">{editMsg}</p>}
                  </form>
                )}
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
              {isOwner && (
                <>
                  <div className="sckoll-subsection-heading" style={{ marginTop: "3rem" }}>
                    <p className="sckoll-kicker">Applicant inbox</p>
                    <h2>Ranked by fit.</h2>
                  </div>
                  <OwnerInbox oppId={opp.id} />
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
