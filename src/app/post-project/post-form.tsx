"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api } from "@/lib/api";

const CATEGORIES = [
  "development-it",
  "design-creative",
  "writing-content",
  "sales-marketing",
  "finance-operations",
  "engineering",
  "customer-support",
  "consulting",
];

export default function PostProjectForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((res) => {
        if (res.user.role !== "client" && res.user.role !== "both") {
          router.push("/profile/setup");
        }
      })
      .catch(() => router.push("/sign-in?next=/post-project"))
      .finally(() => setChecking(false));
  }, [router]);

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const skills = String(form.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const budgetMin = Number(form.get("budgetMin"));
      const budgetMax = Number(form.get("budgetMax"));
      const res = await api.postOpportunity({
        category: String(form.get("category") ?? "development-it"),
        type: String(form.get("type") ?? "project"),
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        skills,
        ...(Number.isFinite(budgetMin) && budgetMin > 0 ? { budgetMin } : {}),
        ...(Number.isFinite(budgetMax) && budgetMax > 0 ? { budgetMax } : {}),
        rateType: String(form.get("rateType") ?? "fixed"),
        location: String(form.get("location") ?? "") || undefined,
        remote: form.get("remote") === "on",
      });
      router.push(`/find-work/${res.opportunity.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not post your project.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="sckoll-auth-page">
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Checking your account…</p>
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
          <p className="sckoll-kicker">For clients and founders</p>
          <h1>Post the outcome.</h1>
          <p>Name what needs to be true when the work is done — not a vague job description.</p>
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">New project</p>
            <h2>Describe your project</h2>
          </div>
          {error && <p className="sckoll-auth-error">{error}</p>}
          <form className="sckoll-auth-form" action={(f) => void onSubmit(f)}>
            <label>
              Title (min 10 characters)
              <input required name="title" minLength={10} maxLength={160} placeholder="Build a realtime dashboard…" />
            </label>
            <label>
              Description (min 50 characters)
              <textarea required name="description" rows={5} minLength={50} maxLength={5000} placeholder="Outcome, constraints, timing, skills that matter…" />
            </label>
            <label>
              Type
              <select name="type" defaultValue="project">
                <option value="project">Project</option>
                <option value="role">Role</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <label>
              Category
              <select name="category" defaultValue="development-it">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/-/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Skills (comma separated)
              <input name="skills" placeholder="react, typescript" />
            </label>
            <label>
              Budget min ($)
              <input name="budgetMin" type="number" min={0} placeholder="3000" />
            </label>
            <label>
              Budget max ($)
              <input name="budgetMax" type="number" min={0} placeholder="5000" />
            </label>
            <label>
              Rate type
              <select name="rateType" defaultValue="fixed">
                <option value="fixed">Fixed price</option>
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </label>
            <label className="sckoll-auth-check">
              <input type="checkbox" name="remote" defaultChecked /> <span>Remote friendly</span>
            </label>
            <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
              {busy ? "Posting…" : "Post project"} <span>↗</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
