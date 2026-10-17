"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ApiError, GOOGLE_CLIENT_ID, api } from "@/lib/api";
import Mark from "@/components/Mark";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function GoogleButton({ role }: { role: "talent" | "client" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const holder = useRef<HTMLDivElement>(null);

  const onCredential = useCallback(
    async (res: { credential: string }) => {
      setError(null);
      try {
        await api.google({ idToken: res.credential, role });
        router.push("/profile/setup");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Google sign-in failed.");
      }
    },
    [role, router],
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !holder.current || ready) return;
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential });
    window.google.accounts.id.renderButton(holder.current, { theme: "filled_black", size: "large", width: 320 });
    setReady(true);
  }, [onCredential, ready]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <>
        <div className="sckoll-auth-divider">
          <span>or continue with</span>
        </div>
        <p className="sckoll-auth-note" style={{ marginTop: 0 }}>
          Google sign-in activates once the site owner connects it — email sign-in works now.
        </p>
      </>
    );
  }
  return (
    <>
      {GOOGLE_CLIENT_ID && <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />}
      <div className="sckoll-auth-divider">
        <span>or continue with</span>
      </div>
      {error && <p className="sckoll-auth-error">{error}</p>}
      <div ref={holder} className="sckoll-google-holder" />
    </>
  );
}

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"talent" | "client">(
    params.get("role") === "client" ? "client" : "talent",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      if (isSignUp) {
        const name = String(form.get("name") ?? "");
        await api.signup({ email, name, password, role });
        router.push("/profile/setup");
      } else {
        await api.login({ email, password });
        router.push("/profile");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sckoll-auth-card">
      <div className="sckoll-auth-card-heading">
        <p className="sckoll-kicker">{isSignUp ? "Create account" : "Sign in"}</p>
        <h2>{isSignUp ? "Join Sckoll" : "Welcome back"}</h2>
        <p>
          {isSignUp
            ? "Choose how you want to use the marketplace."
            : "Sign in to your opportunity and work workspace."}
        </p>
      </div>
      {isSignUp && (
        <div className="sckoll-role-switch" role="tablist" aria-label="Account type">
          <button
            type="button"
            className={role === "talent" ? "active" : ""}
            onClick={() => setRole("talent")}
          >
            I want to find work
          </button>
          <button
            type="button"
            className={role === "client" ? "active" : ""}
            onClick={() => setRole("client")}
          >
            I want to hire
          </button>
        </div>
      )}
      {error && <p className="sckoll-auth-error">{error}</p>}
      <form
        className="sckoll-auth-form"
        action={(form) => {
          void onSubmit(form);
        }}
      >
        <label>
          Email address
          <input required type="email" name="email" placeholder="you@example.com" autoComplete="email" />
        </label>
        {isSignUp && (
          <label>
            Full name
            <input required type="text" name="name" placeholder="Your name" autoComplete="name" />
          </label>
        )}
        <label>
          Password
          <input
            required
            minLength={8}
            type="password"
            name="password"
            placeholder="At least 8 characters"
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </label>
        {isSignUp && (
          <label className="sckoll-auth-check">
            <input type="checkbox" required />{" "}
            <span>
              I agree to the Sckoll <Link href="/terms">terms</Link> and <Link href="/privacy">privacy notice</Link>.
            </span>
          </label>
        )}
        <button type="submit" className="sckoll-button sckoll-button-dark" disabled={busy}>
          {busy ? "Working…" : isSignUp ? "Create account" : "Continue"}
          <span>↗</span>
        </button>
      </form>
      {!isSignUp && (
        <p className="sckoll-auth-switch">
          Forgot your password? <Link href="/reset-password">Reset it</Link>
        </p>
      )}
      <GoogleButton role={role} />
      <p className="sckoll-auth-switch">
        {isSignUp ? "Already have an account?" : "New to Sckoll?"}{" "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link>
      </p>
      <p className="sckoll-auth-note">Signed in sessions stay on this device for 30 days.</p>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
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
          <p className="sckoll-kicker">{isSignUp ? "Start with the work" : "Welcome back"}</p>
          <h1>{isSignUp ? "Build your next move." : "Keep the work moving."}</h1>
          <p>
            {isSignUp
              ? "Create one profile for discovering work, finding talent, and turning the right signal into an outcome."
              : "Return to your opportunity feed, proposals, shortlists, and active work."}
          </p>
          <div className="sckoll-auth-points">
            <span>✓ Context-aware matching</span>
            <span>✓ Human-approved actions</span>
            <span>✓ Secure work trails</span>
          </div>
        </div>
        <Suspense>
          <AuthForm mode={mode} />
        </Suspense>
      </section>
    </main>
  );
}
