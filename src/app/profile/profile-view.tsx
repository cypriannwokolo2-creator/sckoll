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
      const links: Record<string, string> = {};
      for (const key of ["website", "github", "linkedin"] as const) {
        const value = String(form.get(key) ?? "").trim();
        if (value) links[key] = value;
      }
      const avatar = String(form.get("avatarUrl") ?? "").trim();
      const res = await api.patchProfile({
        headline: String(form.get("headline") ?? "") || undefined,
        bio: String(form.get("bio") ?? "") || undefined,
        location: String(form.get("location") ?? "") || undefined,
        availability: String(form.get("availability") ?? "") || undefined,
        hourlyRate: String(form.get("hourlyRate") ?? "") || undefined,
        ...(avatar ? { avatarUrl: avatar } : {}),
        skills,
        ...(Object.keys(links).length > 0 ? { links } : {}),
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
                Photo URL
                <input name="avatarUrl" type="url" defaultValue={profile?.avatarUrl ?? ""} />
              </label>
              <label>
                Bio
                <textarea name="bio" rows={3} defaultValue={profile?.bio ?? ""} />
              </label>
              <label>
                Skills (comma separated)
                <input name="skills" defaultValue={(profile?.skills ?? []).join(", ")} />
              </label>
              <label>
                Availability
                <input name="availability" defaultValue={profile?.availability ?? ""} />
              </label>
              <label>
                Hourly rate
                <input name="hourlyRate" defaultValue={profile?.hourlyRate ?? ""} />
              </label>
              <label>
                Website
                <input name="website" type="url" defaultValue={profile?.links?.website ?? ""} />
              </label>
              <label>
                GitHub
                <input name="github" type="url" defaultValue={profile?.links?.github ?? ""} />
              </label>
              <label>
                LinkedIn
                <input name="linkedin" type="url" defaultValue={profile?.links?.linkedin ?? ""} />
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
              <Link href="/pipeline" className="sckoll-button sckoll-button-acid">
                Your pipeline <span>↗</span>
              </Link>
              <Link href="/recommended" className="sckoll-social-button" style={{ textDecoration: "none", justifyContent: "center" }}>
                Recommended for you
              </Link>
              <Link href="/saved-searches" className="sckoll-social-button" style={{ textDecoration: "none", justifyContent: "center" }}>
                Saved searches
              </Link>
              {user.role !== "talent" && (
                <Link href="/post-project" className="sckoll-social-button" style={{ textDecoration: "none", justifyContent: "center" }}>
                  Post a project
                </Link>
              )}
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
