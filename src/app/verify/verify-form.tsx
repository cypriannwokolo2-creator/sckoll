"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import Mark from "@/components/Mark";

function VerifyForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const incomplete = !token || !email;
  const [status, setStatus] = useState<"working" | "done" | "error">(incomplete ? "error" : "working");
  const [message, setMessage] = useState(incomplete ? "This confirmation link is incomplete." : "Confirming your email…");

  const [resent, setResent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onResend(form: FormData) {
    setBusy(true);
    try {
      await api.resend(String(form.get("email") ?? email));
      setResent("Fresh link sent — check your inbox.");
    } catch (e) {
      setResent(e instanceof ApiError ? e.message : "Could not send a fresh link.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (incomplete) return;
    api
      .verify({ token, email })
      .then(() => {
        setStatus("done");
        setMessage("Email confirmed — welcome to Sckoll.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof ApiError ? e.message : "Confirmation failed.");
      });
  }, [incomplete, token, email]);

  return (
    <div className="sckoll-auth-card">
      <div className="sckoll-auth-card-heading">
        <p className="sckoll-kicker">Email confirmation</p>
        <h2>{status === "working" ? "Confirming…" : status === "done" ? "Confirmed" : "Link issue"}</h2>
        <p className={status === "error" ? "sckoll-auth-error" : "sckoll-auth-success"}>{message}</p>
      </div>
      <div className="sckoll-auth-form">
        <Link href={status === "done" ? "/profile/setup" : "/"} className="sckoll-button sckoll-button-dark">
          {status === "done" ? "Continue to your profile" : "Return home"} <span>↗</span>
        </Link>
      </div>
      {status === "error" && (
        <form className="sckoll-auth-form" action={(f) => void onResend(f)}>
          <label>
            Email address
            <input required type="email" name="email" defaultValue={email} placeholder="you@example.com" />
          </label>
          <button type="submit" className="sckoll-button sckoll-button-light" disabled={busy}>
            {busy ? "Sending…" : "Send a fresh link"} <span>↗</span>
          </button>
          {resent && <p className="sckoll-auth-success">{resent}</p>}
        </form>
      )}
    </div>
  );
}

export default function VerifyPage() {
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
          <p className="sckoll-kicker">One click</p>
          <h1>Confirm it&apos;s you.</h1>
        </div>
        <Suspense>
          <VerifyForm />
        </Suspense>
      </section>
    </main>
  );
}
