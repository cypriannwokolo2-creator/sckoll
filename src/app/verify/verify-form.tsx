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
