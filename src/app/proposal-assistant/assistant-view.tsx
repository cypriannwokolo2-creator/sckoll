"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { api, type Profile, type PublicUser } from "@/lib/api";

export default function ProposalAssistantView() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState("");
  const [proof, setProof] = useState("");
  const [plan, setPlan] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        setUser(res.user);
        setProfile(res.profile);
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  function onGenerate(form: FormData) {
    const b = String(form.get("brief") ?? "").trim();
    const pf = String(form.get("proof") ?? "").trim();
    const pl = String(form.get("plan") ?? "").trim();
    const name = user?.name ?? "there";
    const headline = profile?.headline ? ` (${profile.headline})` : "";
    const skills = (profile?.skills ?? []).slice(0, 5).join(", ");
    setBrief(b);
    setProof(pf);
    setPlan(pl);
    setCopied(false);
    setDraft(
      `Hi${name === "there" ? "" : ` ${name.split(" ")[0]}${headline},`}\n\nI read your brief closely${b ? ` — particularly: "${b.slice(0, 140)}${b.length > 140 ? "…" : ""}"` : ""}. Here is why I fit and how I would start.\n\nWhy me: ${pf || "[add one concrete proof: a shipped project, a metric, a link]"}${skills ? `\nCore skills: ${skills}.` : ""}\n\nFirst moves: ${pl || "[add your week-one plan: what you would clarify, build, or deliver first]"}\n\nI work async-first, demo weekly, and keep scope, milestones, and payment terms in one Sckoll thread. Happy to start with a small paid milestone so you can judge the work before committing further.\n\n— ${name === "there" ? "[your name]" : name}`,
    );
  }

  async function onCopy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="sckoll-auth-page">
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Loading the assistant…</p>
      </main>
    );
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
            <Link href="/pipeline">Pipeline</Link>
            <Link href="/find-work" className="sckoll-button sckoll-button-acid sckoll-button-small">
              Find work
            </Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-acid">
          <div className="sckoll-container">
            <Link href="/find-work" className="sckoll-breadcrumb">
              ← Back to opportunities
            </Link>
            <p className="sckoll-sub-eyebrow">For talent</p>
            <h1>Stop sending the same proposal everywhere.</h1>
            <p className="sckoll-sub-description">
              Answer three prompts from your profile context. The assistant structures a specific,
              human-sounding pitch — you review, copy, and send it on the opportunity page.
            </p>
          </div>
        </section>
        <section className="sckoll-subsection">
          <div className="sckoll-container">
            <div className="sckoll-sub-card-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <article className="sckoll-sub-card" style={{ minHeight: "auto" }}>
                <p>YOUR INPUT</p>
                <h3>Three prompts.</h3>
                <form
                  action={(f) => onGenerate(f)}
                  style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}
                >
                  <label style={{ display: "grid", gap: "0.45rem", fontSize: "0.78rem", fontWeight: 700 }}>
                    What does the brief actually need?
                    <textarea name="brief" rows={3} defaultValue={brief} placeholder="Paste the key outcome from the brief…" style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.7rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                  </label>
                  <label style={{ display: "grid", gap: "0.45rem", fontSize: "0.78rem", fontWeight: 700 }}>
                    Your proof (prefilled from profile)
                    <textarea name="proof" rows={3} defaultValue={proof || profile?.bio || ""} placeholder="One shipped project, one metric, one link…" style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.7rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                  </label>
                  <label style={{ display: "grid", gap: "0.45rem", fontSize: "0.78rem", fontWeight: 700 }}>
                    Your week-one plan
                    <textarea name="plan" rows={3} defaultValue={plan} placeholder="What you would clarify, build, or deliver first…" style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.7rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                  </label>
                  <button type="submit" className="sckoll-button sckoll-button-dark">
                    Draft my pitch <span>↗</span>
                  </button>
                </form>
              </article>
              <article className="sckoll-sub-card" style={{ minHeight: "auto" }}>
                <p>YOUR DRAFT</p>
                <h3>Review before you send.</h3>
                {draft ? (
                  <>
                    <span style={{ whiteSpace: "pre-wrap" }}>{draft}</span>
                    <div className="sckoll-sub-actions" style={{ marginTop: "1.5rem" }}>
                      <button type="button" className="sckoll-button sckoll-button-acid sckoll-button-small" onClick={() => void onCopy()}>
                        {copied ? "Copied ✓" : "Copy pitch"}
                      </button>
                      <Link href="/find-work" className="sckoll-button sckoll-button-outline sckoll-button-small">
                        Pick an opportunity
                      </Link>
                    </div>
                  </>
                ) : (
                  <span>Your structured pitch appears here. Nothing is sent automatically — you approve every word.</span>
                )}
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
