"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api, type AppNotification, type NotificationPrefs } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  "user.welcome": "Welcome",
  "auth.verified": "Verified",
  "application.received": "Application",
  "application.status": "Status",
  "shortlist.added": "Shortlist",
  "search.alert": "Match alert",
};

export default function NotificationsView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [digestMsg, setDigestMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.notifications(30, 0), api.notificationPrefs()])
      .then(([n, p]) => {
        setItems(n.notifications);
        setUnread(n.unread);
        setPrefs(p.prefs);
        setTypes(p.types);
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onReadAll() {
    try {
      await api.markNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnread(0);
    } catch {
      // keep state
    }
  }

  async function onToggleMute(type: string) {
    if (!prefs) return;
    const muted = prefs.mutedEvents.includes(type)
      ? prefs.mutedEvents.filter((t) => t !== type)
      : [...prefs.mutedEvents, type];
    try {
      const res = await api.patchNotificationPrefs({ mutedEvents: muted });
      setPrefs(res.prefs);
    } catch {
      // keep state
    }
  }

  async function onToggleChannel(key: "emailEnabled" | "inappEnabled") {
    if (!prefs) return;
    try {
      const res = await api.patchNotificationPrefs({ [key]: !prefs[key] });
      setPrefs(res.prefs);
    } catch {
      // keep state
    }
  }

  async function onDigest() {
    setDigestMsg(null);
    try {
      const res = await api.runDigest();
      setDigestMsg(res.digests > 0 ? `Digest sent — ${res.digests} saved search${res.digests === 1 ? "" : "es"} had new matches.` : "No new matches since your last check.");
      const fresh = await api.notifications(30, 0);
      setItems(fresh.notifications);
      setUnread(fresh.unread);
    } catch (e) {
      setDigestMsg(e instanceof ApiError ? e.message : "Digest failed.");
    }
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
          <p className="sckoll-kicker">Stay in the loop</p>
          <h1>Notifications{unread > 0 ? ` (${unread})` : ""}.</h1>
          <p>Applications, shortlists, matches, and account events — email plus in-app, your call.</p>
          <div className="sckoll-auth-points">
            <span>✓ Never notified about your own actions</span>
            <span>✓ One-click unsubscribe on every mail</span>
            <span>✓ Capped so a busy day never spams you</span>
          </div>
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">Inbox</p>
            <h2>What happened</h2>
          </div>
          {loading ? (
            <div className="sckoll-skeleton" style={{ height: "10rem" }} />
          ) : (
            <>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button type="button" className="sckoll-button sckoll-button-light sckoll-button-small" onClick={() => void onReadAll()}>
                  Mark all read
                </button>
                <button type="button" className="sckoll-button sckoll-button-outline sckoll-button-small" onClick={() => void onDigest()}>
                  Check saved searches
                </button>
              </div>
              {digestMsg && <p className="sckoll-auth-success">{digestMsg}</p>}
              {items.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Quiet for now. Apply to work or post a project to get things moving.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.6rem", marginBottom: "1.5rem" }}>
                  {items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      style={{
                        display: "block",
                        border: "1px solid rgba(255,255,255,0.13)",
                        borderRadius: "0.55rem",
                        padding: "0.7rem 0.9rem",
                        opacity: n.readAt ? 0.65 : 1,
                      }}
                    >
                      <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", color: "var(--acid)" }}>
                        {(TYPE_LABELS[n.type] ?? n.type).toUpperCase()}
                        {!n.readAt ? " · NEW" : ""}
                      </span>
                      <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginTop: "0.2rem" }}>{n.title}</span>
                      {n.body && <span style={{ display: "block", fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.2rem" }}>{n.body}</span>}
                    </Link>
                  ))}
                </div>
              )}
              {prefs && (
                <>
                  <div className="sckoll-auth-card-heading" style={{ marginTop: "1rem" }}>
                    <p className="sckoll-kicker">Preferences</p>
                    <h2 style={{ fontSize: "1.4rem" }}>Channels</h2>
                  </div>
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    {(["emailEnabled", "inappEnabled"] as const).map((key) => (
                      <label key={key} className="sckoll-auth-check">
                        <input type="checkbox" checked={prefs[key]} onChange={() => void onToggleChannel(key)} />
                        <span>{key === "emailEnabled" ? "Email notifications" : "In-app notifications"}</span>
                      </label>
                    ))}
                    <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: "0.5rem 0 0" }}>Mute per event (email + in-app):</p>
                    {types.map((t) => (
                      <label key={t} className="sckoll-auth-check">
                        <input type="checkbox" checked={!prefs.mutedEvents.includes(t)} onChange={() => void onToggleMute(t)} />
                        <span>{TYPE_LABELS[t] ?? t}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
