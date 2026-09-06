"use client";

import Link from "next/link";
import { useState } from "react";
import FlipWord from "@/components/FlipWord";

const NAV_MENUS = [
  {
    label: "For talent",
    columns: [
      { heading: "Find work", items: ["Browse opportunities", "Recommended for you", "Saved searches"] },
      { heading: "Win more work", items: ["Build your profile", "AI proposal assistant", "Track your pipeline"] },
    ],
  },
  {
    label: "For teams",
    columns: [
      { heading: "Find people", items: ["Search talent", "Post a project", "Explore agencies"] },
      { heading: "Work better", items: ["Shortlist together", "Milestones & contracts", "Team workspace"] },
    ],
  },
  {
    label: "Why Sckoll",
    columns: [
      { heading: "The platform", items: ["How it works", "Matching engine", "Trust & safety"] },
      { heading: "Learn", items: ["Success stories", "Resources", "Pricing"] },
    ],
  },
];

const SIGNALS = [
  { value: "24/7", label: "opportunity radar" },
  { value: "0.82+", label: "fit threshold" },
  { value: "1", label: "workspace for both sides" },
  { value: "$0", label: "to start" },
];

const SEARCH_TABS = ["Find work", "Find talent"] as const;

type SearchMode = (typeof SEARCH_TABS)[number];

const OPPORTUNITIES = [
  { type: "PROJECT", title: "Brand identity sprint", company: "Northstar Labs", detail: "Fixed price · $1,200–$2,000", score: "96%" },
  { type: "ROLE", title: "Senior backend engineer", company: "Meridian Health", detail: "Full-time · Remote", score: "91%" },
  { type: "CONTRACT", title: "Technical writer for docs", company: "Openlane", detail: "Hourly · $35–$55/hr", score: "87%" },
];

const AUDIENCE_PATHS = [
  { eyebrow: "For talent", title: "Find work that fits your actual strengths.", description: "Skip endless scrolling and resume black holes. Sckoll surfaces relevant work, helps you make a sharper pitch, and keeps every opportunity moving.", cta: "Find your next opportunity", href: "#signals", accent: "dark" },
  { eyebrow: "For teams", title: "Find reliable people without becoming a recruiter.", description: "Describe what you need, discover high-intent talent, and move from shortlist to signed contract in one focused workspace.", cta: "Find the right talent", href: "#talent", accent: "acid" },
];

const CATEGORIES = [
  { name: "Development & IT", count: "1,240+ skills", icon: "</>" },
  { name: "Design & Creative", count: "680+ skills", icon: "✦" },
  { name: "Writing & Content", count: "420+ skills", icon: "Aa" },
  { name: "Sales & Marketing", count: "390+ skills", icon: "↗" },
  { name: "Finance & Operations", count: "250+ skills", icon: "₦" },
  { name: "Engineering", count: "180+ skills", icon: "⌁" },
  { name: "Customer Support", count: "160+ skills", icon: "◌" },
  { name: "Consulting", count: "120+ skills", icon: "◎" },
];

const WORKFLOW = [
  { number: "01", title: "Create your signal", description: "Tell Sckoll what you can do, what you need, or who you want to hire." },
  { number: "02", title: "Discover the fit", description: "See relevant opportunities or people ranked by skills, proof, and intent." },
  { number: "03", title: "Make a stronger move", description: "Generate a focused application, pitch, shortlist, or project brief." },
  { number: "04", title: "Agree with confidence", description: "Keep scope, conversations, milestones, and terms in one place." },
  { number: "05", title: "Deliver and grow", description: "Complete the work, get paid securely, and build a trusted track record." },
];

const FEATURES = [
  { number: "01", title: "A feed that learns you", description: "Stop resetting filters every morning. Your opportunity feed gets sharper as Sckoll learns your work, preferences, and outcomes.", accent: "acid" },
  { number: "02", title: "Proposals with a point of view", description: "Turn your context into a tailored application or pitch instead of sending the same paragraph to everyone.", accent: "dark" },
  { number: "03", title: "A hiring room, not a spreadsheet", description: "Compare talent, share notes, agree on terms, and move a strong match into a real project without losing the thread.", accent: "soft" },
];

const TRUST_POINTS = [
  "Verified profiles and professional graph linking",
  "Scam detection across opportunities and conversations",
  "Milestone-safe contracts, payments, and hiring trails",
];

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`sckoll-mark ${small ? "sckoll-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M6 11.5 16 18l10-6.5M6 19.5 16 26l10-6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 4.5 16 11l10-6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".38" />
      </svg>
    </span>
  );
}

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 15 15 5M7 5h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-maven text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}

export default function Home() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("Find work");

  const isTalentSearch = searchMode === "Find work";

  return (
    <div className="sckoll-page">
      <header className="sckoll-header">
        <nav className="sckoll-nav" aria-label="Main navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark />
            <span className="font-wordmark text-base uppercase tracking-widest text-white">SCKOLL</span>
          </Link>

          <div className="sckoll-desktop-nav">
            {NAV_MENUS.map((menu) => (
              <div key={menu.label} className="sckoll-menu-wrap">
                <button type="button" className={`sckoll-nav-button ${openMenu === menu.label ? "sckoll-nav-button-open" : ""}`} onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)} aria-expanded={openMenu === menu.label}>
                  {menu.label}
                  <svg viewBox="0 0 16 16" className={`sckoll-chevron ${openMenu === menu.label ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4" /></svg>
                </button>
                {openMenu === menu.label && (
                  <div className="sckoll-dropdown">
                    {menu.columns.map((column) => (
                      <div key={column.heading} className="sckoll-dropdown-column">
                        <p className="sckoll-dropdown-heading">{column.heading}</p>
                        {column.items.map((item) => <a key={item} href="#engine" className="sckoll-dropdown-link" onClick={() => setOpenMenu(null)}>{item}<ArrowUpRight /></a>)}
                      </div>
                    ))}
                    <div className="sckoll-dropdown-callout">
                      <span className="sckoll-mini-dot" />
                      <p>One workspace for work that moves.</p>
                      <a href="#start">Get started <ArrowUpRight /></a>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <a href="#categories" className="sckoll-nav-button">Categories</a>
            <a href="#pricing" className="sckoll-nav-button">Pricing</a>
          </div>

          <div className="sckoll-nav-actions">
            <Link href="#start" className="sckoll-login">Log in</Link>
            <Link href="#start" className="sckoll-button sckoll-button-acid sckoll-button-small">Sign up free</Link>
            <Link href="#talent" className="sckoll-button sckoll-button-outline sckoll-button-small sckoll-hire-button">Hire talent</Link>
          </div>

          <button type="button" className="sckoll-mobile-trigger" aria-label={mobileMenu ? "Close menu" : "Open menu"} aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">{mobileMenu ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
        </nav>
        {mobileMenu && (
          <div className="sckoll-mobile-menu">
            {NAV_MENUS.map((menu) => <details key={menu.label} className="sckoll-mobile-group"><summary>{menu.label}<span>+</span></summary><div>{menu.columns.flatMap((column) => column.items).map((item) => <a key={item} href="#engine" onClick={() => setMobileMenu(false)}>{item}</a>)}</div></details>)}
            <a href="#categories" onClick={() => setMobileMenu(false)}>Categories</a>
            <a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a>
            <div className="sckoll-mobile-actions"><Link href="#start" className="sckoll-button sckoll-button-acid">Sign up free</Link><Link href="#talent" className="sckoll-button sckoll-button-outline">Hire talent</Link></div>
          </div>
        )}
      </header>

      <main>
        <section className="sckoll-hero">
          <div className="sckoll-grid" />
          <div className="sckoll-hero-glow" />
          <div className="sckoll-hero-ring sckoll-hero-ring-one" />
          <div className="sckoll-hero-ring sckoll-hero-ring-two" />
          <div className="sckoll-hero-content">
            <div className="sckoll-eyebrow-dark"><span className="sckoll-status-dot" />The work marketplace for both sides</div>
            <h1 className="sckoll-hero-title">Don&apos;t chase,<br /><span>get <FlipWord /></span></h1>
            <p className="sckoll-hero-copy">Sckoll connects people ready to work with teams ready to move—then helps both sides go from first signal to signed outcome.</p>

            <div className="sckoll-search-shell" id="start">
              <div className="sckoll-search-tabs" role="tablist" aria-label="Marketplace search mode">
                {SEARCH_TABS.map((tab) => <button key={tab} type="button" role="tab" aria-selected={searchMode === tab} className={searchMode === tab ? "sckoll-search-tab-active" : ""} onClick={() => setSearchMode(tab)}>{tab}</button>)}
              </div>
              <form action="#signals" method="get" className="sckoll-search-form">
                <label htmlFor="marketplace-search" className="sr-only">{isTalentSearch ? "Search jobs and projects" : "Search for talent"}</label>
                <div className="sckoll-search-input"><SearchIcon /><input id="marketplace-search" name="q" placeholder={isTalentSearch ? "Search jobs, projects, or skills" : "Search by role, skill, or talent"} /></div>
                <button type="submit" className="sckoll-button sckoll-button-acid">Search <ArrowUpRight /></button>
              </form>
              <div className="sckoll-search-footer"><span>{isTalentSearch ? "Popular searches" : "Popular talent"}</span><div>{(isTalentSearch ? CATEGORIES.slice(0, 4).map((category) => category.name) : ["Product designers", "React developers", "Marketing leads", "Virtual assistants"]).map((item) => <a key={item} href="#categories">{item}</a>)}</div></div>
            </div>

            <div className="sckoll-hero-proof"><span className="sckoll-proof-pill"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="m9 12 2 2 4-4" /></svg>Verified work</span><span className="sckoll-proof-divider">&amp;</span><span><strong>Opportunity to outcome</strong><small>Work, one flow</small></span></div>
          </div>
        </section>

        <section className="sckoll-stats"><div className="sckoll-container sckoll-stats-grid">{SIGNALS.map((signal) => <Stat key={signal.label} {...signal} />)}</div></section>

        <section className="sckoll-container sckoll-section" id="paths">
          <div className="sckoll-section-heading"><div><p className="sckoll-kicker">One marketplace, two clear paths</p><h2>Work moves differently when the right people meet.</h2></div><p>Built for the people doing the work and the people trying to get the work done.</p></div>
          <div className="sckoll-path-grid" id="talent">{AUDIENCE_PATHS.map((path) => <article key={path.title} className={`sckoll-path-card sckoll-path-${path.accent}`}><p className="sckoll-card-eyebrow">{path.eyebrow}</p><h3>{path.title}</h3><p>{path.description}</p><a href={path.href} className="sckoll-card-link">{path.cta}<ArrowUpRight /></a></article>)}</div>
        </section>

        <section className="sckoll-section sckoll-section-white" id="signals"><div className="sckoll-container"><div className="sckoll-section-heading"><div><p className="sckoll-kicker">The opportunity feed</p><h2>The best-fit work and talent, right now.</h2></div><a href="#start" className="sckoll-text-button">Open the full feed <ArrowUpRight /></a></div><div className="sckoll-opportunity-grid">{OPPORTUNITIES.map((opportunity) => <article key={opportunity.title} className="sckoll-opportunity-card"><div className="sckoll-opportunity-top"><div><p className="sckoll-opportunity-type">{opportunity.type}</p><h3>{opportunity.title}</h3></div><span>{opportunity.score}<small>fit</small></span></div><p className="sckoll-opportunity-company">{opportunity.company}</p><div className="sckoll-opportunity-meta"><span>{opportunity.detail}</span><a href="#start">View <ArrowUpRight /></a></div></article>)}</div></div></section>

        <section className="sckoll-section" id="categories"><div className="sckoll-container"><div className="sckoll-section-heading"><div><p className="sckoll-kicker">Explore by category</p><h2>Every kind of work has a place here.</h2></div><p>Find your lane, then let the matching engine do the sorting.</p></div><div className="sckoll-category-grid">{CATEGORIES.map((category) => <a key={category.name} href="#signals" className="sckoll-category-card"><span className="sckoll-category-icon">{category.icon}</span><span><strong>{category.name}</strong><small>{category.count}</small></span><ArrowUpRight /></a>)}</div></div></section>

        <section className="sckoll-section sckoll-section-white" id="engine"><div className="sckoll-container"><div className="sckoll-section-heading"><div><p className="sckoll-kicker">How Sckoll works</p><h2>From signal to signed work—or a strong hire.</h2></div><p>One clear flow instead of five disconnected tools and a dozen open tabs.</p></div><div className="sckoll-workflow-grid">{WORKFLOW.map((step) => <article key={step.number} className="sckoll-workflow-card"><span>{step.number}</span><div className="sckoll-card-line" /><h3>{step.title}</h3><p>{step.description}</p></article>)}</div></div></section>

        <section className="sckoll-section sckoll-feature-section"><div className="sckoll-container"><div className="sckoll-section-heading"><div><p className="sckoll-kicker">Built for momentum</p><h2>Less admin. More meaningful moves.</h2></div><p>Sckoll takes the repetitive work out of finding, pitching, hiring, and delivering—without taking control away from you.</p></div><div className="sckoll-feature-grid">{FEATURES.map((feature) => <article key={feature.number} className={`sckoll-feature-card sckoll-feature-${feature.accent}`}><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.description}</p><a href="#start">Learn more <ArrowUpRight /></a></article>)}</div></div></section>

        <section className="sckoll-section sckoll-section-white" id="trust"><div className="sckoll-container"><div className="sckoll-trust-heading"><div><p className="sckoll-kicker">The trust layer</p><h2>Move faster without stepping into the dark.</h2></div><p>For people winning work and lean teams finding talent, the messy middle is where Sckoll does the heavy lifting.</p></div><div className="sckoll-trust-grid">{TRUST_POINTS.map((point, index) => <div key={point} className="sckoll-trust-card"><span>0{index + 1}</span><div className="sckoll-check">✓</div><p>{point}</p></div>)}</div></div></section>

        <section className="sckoll-quote-section"><div className="sckoll-container sckoll-quote-inner"><span className="sckoll-quote-mark">“</span><blockquote>Good work should find the people ready to do it.</blockquote><p>That&apos;s the premise behind Sckoll.</p></div></section>

        <section className="sckoll-pricing" id="pricing"><div className="sckoll-container sckoll-pricing-inner"><p className="sckoll-kicker">Simple by design</p><h2>Start with the work.<br /><span>Stay for the momentum.</span></h2><p>Win your next contract, bypass the resume black hole, or source reliable talent without adding another recruiter.</p><div><Link href="#start" className="sckoll-button sckoll-button-dark">Sign up free <ArrowUpRight /></Link><Link href="#talent" className="sckoll-button sckoll-button-light">Talk to the team <ArrowUpRight /></Link></div></div></section>
      </main>

      <footer className="sckoll-footer"><div className="sckoll-container"><div className="sckoll-footer-grid"><div className="sckoll-footer-brand"><div className="sckoll-brand"><Mark small /><span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span></div><p>Autonomous opportunity intelligence for every occupation.</p><span className="sckoll-footer-status"><span />Radar online · 24/7</span></div><div><p className="sckoll-footer-heading">Product</p><a href="#engine">How it works</a><a href="#signals">Opportunity feed</a><a href="#trust">Trust layer</a><a href="#pricing">Pricing</a></div><div><p className="sckoll-footer-heading">For</p><a href="#signals">Freelancers</a><a href="#signals">Job seekers</a><a href="#talent">Founders &amp; agencies</a><a href="#talent">Small teams</a></div><div><p className="sckoll-footer-heading">Explore</p><a href="#categories">Categories</a><a href="#start">Search work</a><a href="#talent">Search talent</a><a href="#start">Get started</a></div></div><div className="sckoll-footer-lockup"><Mark small /><span>sckoll</span></div><div className="sckoll-footer-bottom"><span>Copyright © 2026 Sckoll. All rights reserved.</span><div><a href="#">Privacy</a><a href="#">Terms</a><a href="#start">Contact</a></div></div></div></footer>
    </div>
  );
}
