"use client";

import Link from "next/link";
import { useState } from "react";
import Mark from "@/components/Mark";
import { ApiError, api } from "@/lib/api";

export default function ContactForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      await api.contact({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        topic: String(form.get("topic") ?? "talent"),
        message: String(form.get("message") ?? ""),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send your message.");
    } finally {
      setBusy(false);
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
          <p className="sckoll-kicker">Talk to Sckoll</p>
          <h1>Tell us what you are trying to move.</h1>
          <p>Whether you are looking for work, talent, or a partnership — we read every message.</p>
        </div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading">
            <p className="sckoll-kicker">Contact</p>
            <h2>Send a message</h2>
          </div>
          {error && <p className="sckoll-auth-error">{error}</p>}
          {done ? (
            <p className="sckoll-auth-success">Message received — we reply within two business days.</p>
          ) : (
            <form className="sckoll-auth-form" action={(f) => void onSubmit(f)}>
              <label>
                Your name
                <input required name="name" maxLength={120} placeholder="Ada" autoComplete="name" />
              </label>
              <label>
                Email address
                <input required type="email" name="email" maxLength={254} placeholder="you@example.com" autoComplete="email" />
              </label>
              <label>
                Topic
                <select name="topic" defaultValue="talent">
                  <option value="talent">I am looking for work</option>
                  <option value="team">I need to find someone</option>
                  <option value="partner">Partnership or press</option>
                </select>
              </label>
              <label>
                Message
                <textarea required name="message" rows={5} minLength={10} maxLength={5000} placeholder="Give us the context…" />
              </label>
              <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
                {busy ? "Sending…" : "Send message"} <span>↗</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
