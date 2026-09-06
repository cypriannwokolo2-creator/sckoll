import Link from "next/link";

export type ProductCard = {
  label: string;
  title: string;
  description: string;
  href?: string;
};

export type ProductPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  stats?: Array<{ value: string; label: string }>;
  features?: ProductCard[];
  steps?: Array<{ number: string; title: string; description: string }>;
  cards?: ProductCard[];
  tone?: "dark" | "acid" | "paper";
};

function Mark() {
  return (
    <span className="sckoll-mark sckoll-mark-small" aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none">
        <path d="M6 11.5 16 18l10-6.5M6 19.5 16 26l10-6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 4.5 16 11l10-6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".38" />
      </svg>
    </span>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" className="sckoll-inline-icon" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 15 15 5M7 5h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProductPage({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  stats = [],
  features = [],
  steps = [],
  cards = [],
  tone = "dark",
}: ProductPageProps) {
  return (
    <div className="sckoll-subpage">
      <header className="sckoll-subheader">
        <nav className="sckoll-subnav" aria-label="Product navigation">
          <Link href="/" className="sckoll-brand" aria-label="Sckoll home">
            <Mark />
            <span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span>
          </Link>
          <div className="sckoll-subnav-links">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/find-work">Find work</Link>
            <Link href="/find-talent">Find talent</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="sckoll-subnav-actions">
            <Link href="/sign-in">Log in</Link>
            <Link href="/sign-up" className="sckoll-button sckoll-button-acid sckoll-button-small">Sign up</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className={`sckoll-subhero sckoll-subhero-${tone}`}>
          <div className="sckoll-container">
            <Link href="/" className="sckoll-breadcrumb">← Back to Sckoll</Link>
            <p className="sckoll-sub-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="sckoll-sub-description">{description}</p>
            <div className="sckoll-sub-actions">
              <Link href={primaryHref} className="sckoll-button sckoll-button-acid">{primaryLabel} <Arrow /></Link>
              {secondaryLabel && secondaryHref && <Link href={secondaryHref} className="sckoll-button sckoll-button-outline">{secondaryLabel} <Arrow /></Link>}
            </div>
          </div>
        </section>

        {stats.length > 0 && (
          <section className="sckoll-sub-stats"><div className="sckoll-container sckoll-sub-stats-grid">{stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div></section>
        )}

        {cards.length > 0 && (
          <section className="sckoll-subsection"><div className="sckoll-container"><div className="sckoll-subsection-heading"><p className="sckoll-kicker">Explore the workspace</p><h2>Everything you need to make the next move.</h2></div><div className="sckoll-sub-card-grid">{cards.map((card) => <article key={card.title} className="sckoll-sub-card"><p>{card.label}</p><h3>{card.title}</h3><span>{card.description}</span>{card.href && <Link href={card.href}>Open page <Arrow /></Link>}</article>)}</div></div></section>
        )}

        {features.length > 0 && (
          <section className="sckoll-subsection sckoll-subsection-white"><div className="sckoll-container"><div className="sckoll-subsection-heading"><p className="sckoll-kicker">What you get</p><h2>Designed around the work, not the paperwork.</h2></div><div className="sckoll-sub-feature-grid">{features.map((feature) => <article key={feature.title} className="sckoll-sub-feature"><p>{feature.label}</p><h3>{feature.title}</h3><span>{feature.description}</span>{feature.href && <Link href={feature.href}>Learn more <Arrow /></Link>}</article>)}</div></div></section>
        )}

        {steps.length > 0 && (
          <section className="sckoll-subsection"><div className="sckoll-container"><div className="sckoll-subsection-heading"><p className="sckoll-kicker">The flow</p><h2>Clear steps. Fewer open tabs.</h2></div><div className="sckoll-sub-step-grid">{steps.map((step) => <article key={step.number}><strong>{step.number}</strong><div /><h3>{step.title}</h3><p>{step.description}</p></article>)}</div></div></section>
        )}

        <section className="sckoll-sub-cta"><div className="sckoll-container"><p className="sckoll-kicker">Ready when you are</p><h2>Put the next opportunity in motion.</h2><Link href={primaryHref} className="sckoll-button sckoll-button-dark">{primaryLabel} <Arrow /></Link></div></section>
      </main>

      <footer className="sckoll-subfooter"><div className="sckoll-container"><div className="sckoll-subfooter-top"><div><div className="sckoll-brand"><Mark /><span className="font-wordmark text-xs uppercase tracking-[.28em] text-white">SCKOLL</span></div><p>Less scrolling. Fewer black holes. More work that fits.</p></div><div><strong>Explore</strong><Link href="/find-work">Find work</Link><Link href="/find-talent">Find talent</Link><Link href="/categories/development-it">Categories</Link></div><div><strong>Company</strong><Link href="/how-it-works">How it works</Link><Link href="/trust">Trust &amp; safety</Link><Link href="/contact">Contact</Link></div></div><div className="sckoll-subfooter-bottom"><span>© 2026 Sckoll</span><span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span></div></div></footer>
    </div>
  );
}
