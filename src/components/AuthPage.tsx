"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const [role, setRole] = useState<"talent" | "client">("talent");

  return (
    <main className="sckoll-auth-page">
      <div className="sckoll-auth-brand"><Link href="/"><span className="sckoll-mark sckoll-mark-small" aria-hidden="true">↗</span><span className="font-wordmark uppercase tracking-[.28em]">SCKOLL</span></Link></div>
      <section className="sckoll-auth-layout">
        <div className="sckoll-auth-message"><p className="sckoll-kicker">{isSignUp ? "Start with the work" : "Welcome back"}</p><h1>{isSignUp ? "Build your next move." : "Keep the work moving."}</h1><p>{isSignUp ? "Create one profile for discovering work, finding talent, and turning the right signal into an outcome." : "Return to your opportunity feed, proposals, shortlists, and active work."}</p><div className="sckoll-auth-points"><span>✓ Context-aware matching</span><span>✓ Human-approved actions</span><span>✓ Secure work trails</span></div></div>
        <div className="sckoll-auth-card">
          <div className="sckoll-auth-card-heading"><p className="sckoll-kicker">{isSignUp ? "Create account" : "Sign in"}</p><h2>{isSignUp ? "Join Sckoll" : "Welcome back"}</h2><p>{isSignUp ? "Choose how you want to use the marketplace." : "Your real authentication provider will connect here."}</p></div>
          {isSignUp && <div className="sckoll-role-switch" role="tablist" aria-label="Account type"><button type="button" className={role === "talent" ? "active" : ""} onClick={() => setRole("talent")}>I want to find work</button><button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>I want to hire</button></div>}
          <form className="sckoll-auth-form" action="/coming-soon" method="get"><label>Email address<input required type="email" name="email" placeholder="you@example.com" /></label>{isSignUp && <label>Full name<input required type="text" name="name" placeholder="Your name" /></label>}<label>Password<input required minLength={8} type="password" name="password" placeholder="At least 8 characters" /></label>{isSignUp && <label className="sckoll-auth-check"><input type="checkbox" required /> <span>I agree to the Sckoll terms and privacy notice.</span></label>}<button type="submit" className="sckoll-button sckoll-button-dark">{isSignUp ? "Create account" : "Continue"}<span>↗</span></button></form>
          <div className="sckoll-auth-divider"><span>or continue with</span></div><button type="button" className="sckoll-social-button">Continue with Google <span>G</span></button>
          <p className="sckoll-auth-switch">{isSignUp ? "Already have an account?" : "New to Sckoll?"} <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
          <p className="sckoll-auth-note">Authentication is being connected to the production account system. Your form is ready for the secure provider handoff.</p>
        </div>
      </section>
    </main>
  );
}
