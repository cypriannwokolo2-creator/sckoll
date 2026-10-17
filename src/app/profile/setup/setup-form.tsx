"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, api, type Profile } from "@/lib/api";
import Mark from "@/components/Mark";

export default function ProfileSetupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<"talent" | "client">("talent");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        setProfile(res.profile);
        if (res.user.role === "client" || res.user.role === "both") setRole("client");
        if (!res.user.emailVerified) {
          setNotice("Check your email for a confirmation link — you can set up your profile meanwhile.");
        }
      })
      .catch(() => router.push("/sign-in"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const skills = String(form.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      const res = await api.patchProfile({
        role,
        headline: String(form.get("headline") ?? "") || undefined,
        bio: String(form.get("bio") ?? "") || undefined,
        location: String(form.get("location") ?? "") || undefined,
        availability: String(form.get("availability") ?? "") || undefined,
        hourlyRate: String(form.get("hourlyRate") ?? "") || undefined,
        skills,
      });
      setProfile(res.profile);
      router.push("/profile");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="sckoll-auth-page">
        <div className="sckoll-auth-brand">
          <Link href="/">SCKOLL</Link>
        </div>
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Loading your workspace…</p>
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
          <p className="sckoll-kicker">Step 2 of 2</p>
          <h1>Shape your signal.</h1>
          <p>This is what matching ranks you on. You can edit it any time.</p>
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">Your profile</p>
            <h2>Build your profile</h2>
          </div>
          {notice && <p className="sckoll-auth-success">{notice}</p>}
          {error && <p className="sckoll-auth-error">{error}</p>}
          <div className="sckoll-role-switch" role="tablist" aria-label="Account type">
            <button type="button" className={role === "talent" ? "active" : ""} onClick={() => setRole("talent")}>
              I want to find work
            </button>
            <button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>
              I want to hire
            </button>
          </div>
          <form className="sckoll-auth-form" action={(f) => void onSubmit(f)}>
            <label>
              Headline
              <input name="headline" placeholder="Senior backend engineer" defaultValue={profile?.headline ?? ""} />
            </label>
            <label>
              Bio
              <input name="bio" placeholder="What you do best, in one line" defaultValue={profile?.bio ?? ""} />
            </label>
            <label>
              Skills (comma separated)
              <input name="skills" placeholder="react, postgres, technical writing" defaultValue={(profile?.skills ?? []).join(", ")} />
            </label>
            <label>
              Location
              <input name="location" placeholder="Remote / Lagos / London" defaultValue={profile?.location ?? ""} />
            </label>
            <label>
              Hourly rate
              <input name="hourlyRate" placeholder="$45/hr" defaultValue={profile?.hourlyRate ?? ""} />
            </label>
            <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
              {busy ? "Saving…" : "Save and continue"} <span>↗</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
