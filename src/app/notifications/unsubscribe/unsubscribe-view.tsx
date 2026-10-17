"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Mark from "@/components/Mark";

function UnsubscribeForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const incomplete = !token || !email;
  const [status, setStatus] = useState<"working" | "done" | "error">(incomplete ? "error" : "working");
  const [message, setMessage] = useState(incomplete ? "This unsubscribe link is incomplete." : "Turning off email notifications…");
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

  useEffect(() => {
    if (incomplete) return;
    fetch(`${apiUrl}/v1/notifications/unsubscribe?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) throw new Error(data.message ?? "Failed.");
        setStatus("done");
        setMessage(data.message ?? "Email notifications off.");
      })
      .catch(() => {
        setStatus("error");
        setMessage("This link is invalid or expired.");
      });
  }, [params, apiUrl, incomplete, token, email]);

  return (
    <div className="sckoll-auth-card">
      <div className="sckoll-auth-card-heading">
        <p className="sckoll-kicker">Email preferences</p>
        <h2>{status === "working" ? "Working…" : status === "done" ? "Unsubscribed" : "Link issue"}</h2>
        <p className={status === "error" ? "sckoll-auth-error" : "sckoll-auth-success"}>{message}</p>
      </div>
      <div className="sckoll-auth-form">
        <Link href="/notifications" className="sckoll-button sckoll-button-dark">
          Manage preferences <span>↗</span>
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
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
          <h1>No more mails.</h1>
        </div>
        <Suspense>
          <UnsubscribeForm />
        </Suspense>
      </section>
    </main>
  );
}
