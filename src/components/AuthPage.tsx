"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ApiError, api, googleSignInUrl } from "@/lib/api";
import { useSession } from "@/lib/session";
import { SIGNED_IN_HOME } from "@/lib/session-hint";
import Mark from "@/components/Mark";

/** Copy for each failure the API's Google callback can bounce back with. */
const GOOGLE_ERROR_COPY: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Please try again.",
  google_state: "Your Google sign-in link expired. Please try again.",
  google_unverified: "That Google email is not verified, so it cannot be linked to an account.",
  google_disabled: "Google sign-in is not available right now.",
};

/**
 * Google sign-in is a full-page redirect through the API: no third-party
 * script, no popup, no client id in the browser. The API owns the OAuth
 * client, exchanges the code server-side and sets the session cookie.
 */
function GoogleButton({ role, mode }: { role: "talent" | "client"; mode: "sign-in" | "sign-up" }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .config()
      .then((config) => {
        if (alive) setEnabled(config.google_enabled);
      })
      .catch(() => {
        /* leave the button hidden: the API decides what is available */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div className="sckoll-auth-divider">
        <span>or continue with</span>
      </div>
      <a className="sckoll-google-link" href={googleSignInUrl(mode, role)}>
        <svg className="sckoll-google-link-mark" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        Continue with Google
      </a>
    </>
  );
}

function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const [role, setRole] = useState<"talent" | "client">(
    params.get("role") === "client" ? "client" : "talent",
  );
  // The API bounces a failed Google flow back here with ?error=<code>. It is
  // derived during render, so it shows immediately and needs no effect.
  const callbackError = GOOGLE_ERROR_COPY[params.get("error") ?? ""] ?? null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const shownError = error ?? callbackError;

  async function onSubmit(form: FormData) {
    setError(null);
    setBusy(true);
    try {
      const email = String(form.get("email") ?? "");
      const password = String(form.get("password") ?? "");
      if (isSignUp) {
        const name = String(form.get("name") ?? "");
        await api.signup({ email, name, password, role });
        // The session now exists: tell the app, so the nav and the routing
        // hint know the visitor is a member from here on.
        session.refresh();
        router.push("/profile/setup");
      } else {
        await api.login({ email, password });
        session.refresh();
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
            role="tab"
            aria-selected={role === "talent"}
            className={role === "talent" ? "active" : ""}
            onClick={() => setRole("talent")}
          >
            I want to find work
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "client"}
            className={role === "client" ? "active" : ""}
            onClick={() => setRole("client")}
          >
            I want to hire
          </button>
        </div>
      )}
      {shownError && <p className="sckoll-auth-error">{shownError}</p>}
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
      <GoogleButton role={role} mode={mode} />
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
  const router = useRouter();
  const session = useSession();

  // Someone who already had a session when they landed here has no business
  // on the auth pages: send them to their workspace instead of a form they
  // cannot use. A visitor who signs in with the form below is not bounced —
  // `settled` stays "visitor" for them.
  const gate = session.settled;

  useEffect(() => {
    if (gate === "member") router.replace(SIGNED_IN_HOME);
  }, [gate, router]);

  if (!gate) {
    return (
      <main className="sckoll-auth-page">
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Checking your session…</p>
      </main>
    );
  }

  if (gate === "member") {
    return (
      <main className="sckoll-auth-page">
        <p style={{ textAlign: "center", color: "#aeb4bc" }}>Taking you to your workspace…</p>
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
