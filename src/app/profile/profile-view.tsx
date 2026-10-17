"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api, type Profile, type PublicUser } from "@/lib/api";
import Mark from "@/components/Mark";

export default function ProfileView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function onSave(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const skills = String(form.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      const res = await api.patchProfile({
        headline: String(form.get("headline") ?? "") || undefined,
        bio: String(form.get("bio") ?? "") || undefined,
        location: String(form.get("location") ?? "") || undefined,
        availability: String(form.get("availability") ?? "") || undefined,
        hourlyRate: String(form.get("hourlyRate") ?? "") || undefined,
        skills,
      });
      setProfile(res.profile);
      setEditing(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await api.logout().catch(() => undefined);
    router.push("/");
  }

  if (loading || !user) {
    return (
      <main className="sckoll-auth-page">
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Loading your profile…</p>
      </main>
    );
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
          <p className="sckoll-kicker">Your professional signal</p>
          <h1>{user.name ?? "Your profile"}</h1>
          <p>{profile?.headline ?? "Add a headline so matching knows what to rank you for."}</p>
          {!user.emailVerified && <p style={{ color: "#ffb4b4" }}>Email not verified yet — check your inbox.</p>}
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">{user.role}</p>
            <h2>{user.email}</h2>
            <p>{(profile?.skills ?? []).join(" · ") || "No skills yet."}</p>
          </div>
          {error && <p className="sckoll-auth-error">{error}</p>}
          {editing ? (
            <form className="sckoll-auth-form" action={(f) => void onSave(f)}>
              <label>
                Headline
                <input name="headline" defaultValue={profile?.headline ?? ""} />
              </label>
              <label>
                Bio
                <input name="bio" defaultValue={profile?.bio ?? ""} />
              </label>
              <label>
                Skills (comma separated)
                <input name="skills" defaultValue={(profile?.skills ?? []).join(", ")} />
              </label>
              <label>
                Location
                <input name="location" defaultValue={profile?.location ?? ""} />
              </label>
              <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
                {busy ? "Saving…" : "Save"} <span>↗</span>
              </button>
            </form>
          ) : (
            <div className="sckoll-auth-form">
              <button type="button" className="sckoll-button sckoll-button-dark" onClick={() => setEditing(true)}>
                Edit profile <span>↗</span>
              </button>
              <button type="button" className="sckoll-social-button" onClick={() => void onLogout()}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
