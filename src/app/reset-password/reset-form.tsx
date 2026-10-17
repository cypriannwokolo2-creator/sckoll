"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import Mark from "@/components/Mark";

function ResetForm() {
  const params = useSearchParams();
  const presetToken = params.get("token") ?? "";
  const presetEmail = params.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(presetToken ? null : "Enter your email and we will send a reset link.");
  const [busy, setBusy] = useState(false);

  async function onForgot(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      await api.forgot(String(form.get("email") ?? ""));
      setDone("If that email exists, a reset link is on its way.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send the link.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      await api.reset({
        token: String(form.get("token") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      setDone("Password updated — sign in with your new password.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sckoll-auth-card">
      <div className="sckoll-auth-card-heading">
        <p className="sckoll-kicker">Account recovery</p>
        <h2>Reset password</h2>
      </div>
      {error && <p className="sckoll-auth-error">{error}</p>}
      {done && <p className="sckoll-auth-success">{done}</p>}
      {presetToken ? (
        <form className="sckoll-auth-form" action={(f) => void onReset(f)}>
          <input type="hidden" name="token" value={presetToken} />
          <label>
            Email address
            <input required type="email" name="email" defaultValue={presetEmail} />
          </label>
          <label>
            New password
            <input required minLength={8} type="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" />
          </label>
          <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
            {busy ? "Working…" : "Set new password"} <span>↗</span>
          </button>
        </form>
      ) : (
        <form className="sckoll-auth-form" action={(f) => void onForgot(f)}>
          <label>
            Email address
            <input required type="email" name="email" placeholder="you@example.com" />
          </label>
          <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"} <span>↗</span>
          </button>
        </form>
      )}
      <p className="sckoll-auth-switch">
        Remembered it? <Link href="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <p className="sckoll-kicker">Locked out</p>
          <h1>Get back in.</h1>
        </div>
        <Suspense>
          <ResetForm />
        </Suspense>
      </section>
    </main>
  );
}
