"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import Mark from "@/components/Mark";
import NotifBell from "@/components/NotifBell";
import { ApiError, api, type Contract, type ContractMessage, type Milestone, type Payment } from "@/lib/api";

export default function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [oppTitle, setOppTitle] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [messages, setMessages] = useState<ContractMessage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [names, setNames] = useState<{ client: string | null; talent: string | null }>({ client: null, talent: null });
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.contractDetail(id);
      setContract(res.contract);
      setOppTitle(res.opportunity?.title ?? "");
      setMilestones(res.milestones);
      setNames({ client: res.client?.name ?? null, talent: res.talent?.name ?? null });
      const me = await api.me().catch(() => null);
      if (me) setIsClient(me.user.id === res.contract.clientId);
      const thread = await api.contractMessages(id).catch(() => null);
      if (thread) setMessages(thread.messages);
      const trail = await api.contractPayments(id).catch(() => null);
      if (trail) setPayments(trail.payments);
      await api.markMessagesRead(id).catch(() => undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load this contract.");
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    api
      .contractDetail(id)
      .then(async (res) => {
        if (cancelled) return;
        setContract(res.contract);
        setOppTitle(res.opportunity?.title ?? "");
        setMilestones(res.milestones);
        setNames({ client: res.client?.name ?? null, talent: res.talent?.name ?? null });
        const me = await api.me().catch(() => null);
        if (!cancelled && me) setIsClient(me.user.id === res.contract.clientId);
        const thread = await api.contractMessages(id).catch(() => null);
        if (!cancelled && thread) setMessages(thread.messages);
        const trail = await api.contractPayments(id).catch(() => null);
        if (!cancelled && trail) setPayments(trail.payments);
        await api.markMessagesRead(id).catch(() => undefined);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Could not load this contract.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onAddMilestone(form: FormData) {
    if (!contract) return;
    setNotice(null);
    setBusy(true);
    try {
      const amount = Number(form.get("amount"));
      await api.addMilestone(contract.id, {
        title: String(form.get("title") ?? ""),
        ...(Number.isFinite(amount) && amount > 0 ? { amount } : {}),
      });
      (document.getElementById("milestone-form") as HTMLFormElement | null)?.reset();
      await load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not add milestone.");
    } finally {
      setBusy(false);
    }
  }

  async function onFund(mid: string, amount: number | null) {
    if (!amount) {
      setNotice("Set a milestone amount before funding.");
      return;
    }
    setNotice(null);
    setBusy(true);
    try {
      const res = await api.fundMilestone(mid);
      if (res.authorizationUrl) {
        window.open(res.authorizationUrl, "_blank", "noopener");
        setNotice("Checkout opened — complete payment, then refresh this page.");
      } else {
        setNotice("Funding already initialized for this milestone.");
      }
      const trail = await api.contractPayments(contract?.id ?? "").catch(() => null);
      if (trail) setPayments(trail.payments);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not start funding.");
    } finally {
      setBusy(false);
    }
  }

  async function onRelease(mid: string) {
    if (!confirm("Release held funds to talent?")) return;
    setNotice(null);
    setBusy(true);
    try {
      await api.releaseMilestone(mid);
      setNotice("Funds released to talent.");
      await load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not release.");
    } finally {
      setBusy(false);
    }
  }

  async function onMilestone(id: string, status: string) {
    setBusy(true);
    try {
      await api.patchMilestone(id, status);
      await load();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function onSend(form: FormData) {
    if (!contract) return;
    setNotice(null);
    try {
      const res = await api.sendContractMessage(contract.id, String(form.get("body") ?? ""));
      if (res.warning) setNotice(`Heads up: this message was flagged (${res.warning}). It was still delivered.`);
      setMessages((prev) => [...prev, res.message]);
      (document.getElementById("message-form") as HTMLFormElement | null)?.reset();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not send.");
    }
  }

  async function onReview(form: FormData) {
    if (!contract) return;
    setNotice(null);
    try {
      await api.postReview({ contractId: contract.id, stars: Number(form.get("stars") ?? 5), text: String(form.get("text") ?? "") });
      setNotice("Review posted — thank you.");
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not post review.");
    }
  }

  async function onFlag(form: FormData) {
    if (!contract) return;
    setNotice(null);
    try {
      await api.flagContract(contract.id, String(form.get("reason") ?? ""));
      setNotice("Flagged — our team will review this contract.");
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not flag.");
    }
  }

  async function onCancel() {
    if (!contract || !confirm("Cancel this contract?")) return;
    try {
      const res = await api.patchContract(contract.id, { status: "cancelled" });
      setContract(res.contract);
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : "Could not cancel.");
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
            <Link href="/contracts">Contracts</Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="sckoll-subhero sckoll-subhero-paper">
          <div className="sckoll-container">
            <Link href="/contracts" className="sckoll-breadcrumb">
              ← All contracts
            </Link>
            {error ? (
              <p className="sckoll-auth-error">{error}</p>
            ) : !contract ? (
              <>
                <div className="sckoll-skeleton" style={{ height: "3rem", width: "60%" }} />
                <div className="sckoll-skeleton" style={{ height: "1.2rem", width: "40%", marginTop: "2rem" }} />
              </>
            ) : (
              <>
                <p className="sckoll-sub-eyebrow">{contract.status} · {names.client ?? ""} ↔ {names.talent ?? ""}</p>
                <h1>{oppTitle || "Contract"}</h1>
                <p className="sckoll-sub-description">{contract.scope}</p>
                {notice && <p className="sckoll-auth-success" style={{ marginTop: "1rem" }}>{notice}</p>}
                {contract.status === "active" && (
                  <div className="sckoll-sub-actions">
                    <button type="button" className="sckoll-button sckoll-button-outline" onClick={() => void onCancel()}>
                      Cancel contract
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
        {contract && (
          <>
            <section className="sckoll-subsection">
              <div className="sckoll-container">
                <div className="sckoll-subsection-heading">
                  <p className="sckoll-kicker">Milestones</p>
                  <h2>Keep progress visible.</h2>
                </div>
                {milestones.length === 0 ? (
                  <div className="sckoll-empty">
                    <h3>No milestones yet.</h3>
                    <p>{isClient ? "Break the scope into funded checkpoints." : "The client will define milestones here."}</p>
                  </div>
                ) : (
                  <div className="sckoll-sub-step-grid">
                    {milestones.map((m) => (
                      <article key={m.id}>
                        <strong>{m.status.toUpperCase()}</strong>
                        <div />
                        <h3>{m.title}</h3>
                        <p>{m.amount != null ? `$${m.amount.toLocaleString()}` : "No amount set"}{m.dueDate ? ` · due ${new Date(m.dueDate).toLocaleDateString()}` : ""}</p>
                        {contract.status === "active" && (
                          <div className="sckoll-sub-actions" style={{ marginTop: "1rem" }}>
                            {!isClient && (m.status === "pending" || m.status === "rejected") && (
                              <button type="button" className="sckoll-button sckoll-button-acid sckoll-button-small" disabled={busy} onClick={() => void onMilestone(m.id, "submitted")}>
                                Submit work
                              </button>
                            )}
                            {isClient && m.status === "submitted" && (
                              <>
                                <button type="button" className="sckoll-button sckoll-button-acid sckoll-button-small" disabled={busy} onClick={() => void onMilestone(m.id, "approved")}>
                                  Approve
                                </button>
                                <button type="button" className="sckoll-button sckoll-button-outline sckoll-button-small" disabled={busy} onClick={() => void onMilestone(m.id, "rejected")}>
                                  Reject
                                </button>
                              </>
                            )}
                            {isClient && m.amount != null && m.status !== "approved" && (
                              <button type="button" className="sckoll-button sckoll-button-dark sckoll-button-small" disabled={busy} onClick={() => void onFund(m.id, m.amount)}>
                                Fund {`$${(m.amount / 100).toLocaleString()}`}
                              </button>
                            )}
                            {isClient && m.status === "approved" && (
                              <button type="button" className="sckoll-button sckoll-button-dark sckoll-button-small" disabled={busy} onClick={() => void onRelease(m.id)}>
                                Release funds
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
                {payments.length > 0 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <p className="sckoll-kicker" style={{ marginBottom: "0.75rem" }}>Money trail</p>
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                      {payments.map((pay) => (
                        <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.6rem 0.8rem", fontSize: "0.78rem" }}>
                          <span>{pay.direction === "in" ? "↓ Funded" : "↑ Released"} · {pay.currency} {(pay.amount / 100).toLocaleString()}</span>
                          <span style={{ color: "var(--muted)" }}>{pay.status}{pay.providerRef ? ` · ${pay.providerRef.slice(0, 18)}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isClient && contract.status === "active" && (
                  <form id="milestone-form" action={(f) => void onAddMilestone(f)} style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
                    <input name="title" required minLength={5} maxLength={200} placeholder="Milestone title" style={{ flex: "2 1 16rem", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.65rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                    <input name="amount" type="number" min={0} placeholder="$ amount" style={{ flex: "1 1 8rem", border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.65rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                    <button type="submit" className="sckoll-button sckoll-button-dark sckoll-button-small" disabled={busy}>
                      Add milestone
                    </button>
                  </form>
                )}
              </div>
            </section>
            <section className="sckoll-subsection sckoll-subsection-white">
              <div className="sckoll-container">
                <div className="sckoll-subsection-heading">
                  <p className="sckoll-kicker">Messages</p>
                  <h2>Keep the thread together.</h2>
                </div>
                {contract.status !== "active" ? (
                  <p style={{ color: "var(--muted)" }}>Messaging opens on active contracts.</p>
                ) : (
                  <>
                    <div style={{ display: "grid", gap: "0.6rem", maxWidth: "44rem", marginBottom: "1.25rem" }}>
                      {messages.length === 0 && <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No messages yet — say hello and align on the first milestone.</p>}
                      {messages.map((m) => (
                        <div key={m.id} style={{ border: "1px solid var(--line)", borderRadius: "0.7rem", padding: "0.7rem 0.9rem", background: m.flagged ? "rgba(255,180,0,0.08)" : "var(--white)" }}>
                          <p style={{ margin: 0, fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{m.body}</p>
                          {m.flagged && <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "#8a5a00" }}>⚠ Flagged: {m.flagReason}. Sckoll never asks you to move payment off-platform.</p>}
                        </div>
                      ))}
                    </div>
                    <form id="message-form" action={(f) => void onSend(f)} style={{ display: "flex", gap: "0.6rem", maxWidth: "44rem" }}>
                      <input name="body" required maxLength={5000} placeholder="Write a message…" style={{ flex: 1, border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.65rem 0.8rem", font: "inherit", fontSize: "0.85rem" }} />
                      <button type="submit" className="sckoll-button sckoll-button-dark sckoll-button-small">
                        Send
                      </button>
                    </form>
                  </>
                )}
              </div>
            </section>
            <section className="sckoll-subsection">
              <div className="sckoll-container">
                <div className="sckoll-sub-card-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <article className="sckoll-sub-card">
                    <p>REVIEWS</p>
                    <h3>{contract.status === "completed" ? "Rate this collaboration." : "Reviews open on completion."}</h3>
                    {contract.status === "completed" ? (
                      <form action={(f) => void onReview(f)} style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
                        <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 700 }}>
                          Stars
                          <select name="stars" defaultValue="5" style={{ border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.6rem", font: "inherit" }}>
                            {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} star{s === 1 ? "" : "s"}</option>)}
                          </select>
                        </label>
                        <label style={{ display: "grid", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 700 }}>
                          Notes
                          <textarea name="text" rows={3} maxLength={2000} placeholder="What went well?" style={{ border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.6rem", font: "inherit", fontSize: "0.85rem" }} />
                        </label>
                        <button type="submit" className="sckoll-button sckoll-button-dark sckoll-button-small">
                          Post review
                        </button>
                      </form>
                    ) : (
                      <span>Finish every milestone to unlock two-sided reviews.</span>
                    )}
                  </article>
                  <article className="sckoll-sub-card">
                    <p>SAFETY</p>
                    <h3>Something wrong?</h3>
                    <span>Flag scope creep, ghosting, or payment issues. Our team reviews every flag.</span>
                    <form action={(f) => void onFlag(f)} style={{ display: "grid", gap: "0.7rem", marginTop: "1rem" }}>
                      <textarea name="reason" required rows={3} minLength={10} maxLength={2000} placeholder="Describe the issue…" style={{ border: "1px solid var(--line)", borderRadius: "0.55rem", padding: "0.6rem", font: "inherit", fontSize: "0.85rem" }} />
                      <button type="submit" className="sckoll-button sckoll-button-outline sckoll-button-small">
                        Flag contract
                      </button>
                    </form>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
