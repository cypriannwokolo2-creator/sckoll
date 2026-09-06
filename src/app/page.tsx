import Link from "next/link";
import FlipWord from "@/components/FlipWord";

const SIGNALS = [
  { value: "24/7", label: "opportunity radar" },
  { value: "0.82+", label: "fit threshold" },
  { value: "1", label: "workspace for both sides" },
  { value: "$0", label: "to start" },
];

const OPPORTUNITIES = [
  { type: "PROJECT", title: "Brand identity sprint", company: "Northstar Labs · Client lead", score: "96%", skills: "3 shared skills" },
  { type: "ROLE", title: "Senior backend engineer", company: "Meridian Health · Full-time", score: "91%", skills: "5 shared skills" },
  { type: "CONTRACT", title: "Technical writer for docs", company: "Openlane · Early-stage team", score: "87%", skills: "4 shared skills" },
];

const AUDIENCE_PATHS = [
  { eyebrow: "For talent", title: "Find work that fits your actual strengths.", description: "Skip the endless scrolling and resume black holes. Sckoll surfaces relevant work, helps you make a sharper pitch, and keeps every opportunity moving.", cta: "Find your next opportunity", href: "#signals", accent: "bg-black text-white" },
  { eyebrow: "For teams", title: "Find reliable people without becoming a recruiter.", description: "Describe what you need, discover high-intent talent, and move from shortlist to signed contract in one focused workspace.", cta: "Find the right talent", href: "#engine", accent: "bg-acid text-black" },
];

const CATEGORIES = [
  "Development & IT",
  "Design & Creative",
  "Writing & Content",
  "Sales & Marketing",
  "Finance & Operations",
  "Engineering",
  "Customer Support",
  "Consulting",
];

const WORKFLOW = [
  { number: "01", title: "Create your signal", description: "Tell Sckoll what you can do, what you need, or who you want to hire." },
  { number: "02", title: "Discover the fit", description: "See relevant opportunities or people ranked by skills, proof, and intent." },
  { number: "03", title: "Make a stronger move", description: "Generate a focused application, pitch, shortlist, or project brief." },
  { number: "04", title: "Agree with confidence", description: "Keep scope, conversations, milestones, and terms in one place." },
  { number: "05", title: "Deliver and grow", description: "Complete the work, get paid securely, and build a trusted track record." },
];

const TRUST_POINTS = [
  "Verified profiles and professional graph linking",
  "Scam detection across opportunities and conversations",
  "Milestone-safe contracts, payments, and hiring trails",
];

function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg bg-acid text-black ${small ? "h-7 w-7" : "h-9 w-9"}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" className={small ? "h-5 w-5" : "h-6 w-6"} fill="none">
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-maven text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#f1f6e9] text-[#0b0c0e]">
      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 lg:px-8">
        <nav className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between gap-4 rounded-2xl border border-transparent bg-black px-6 transition-all duration-200">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Mark />
              <span className="font-wordmark text-base uppercase tracking-widest text-white">SCKOLL</span>
            </Link>
            <div className="hidden items-center gap-2 lg:flex">
              <a href="#engine" className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white">How it works</a>
              <a href="#signals" className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white">Find work</a>
              <a href="#talent" className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white">Find talent</a>
              <a href="#trust" className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white">Trust</a>
            </div>
          </div>
          <div className="hidden items-center gap-5 lg:flex">
            <Link href="#" className="text-sm text-neutral-300 underline decoration-white underline-offset-4 hover:text-white">Log In</Link>
            <Link href="#start" className="rounded-xl bg-acid px-4 py-2 text-sm font-semibold text-black transition-shadow hover:shadow-[0_0_20px_rgba(163,255,0,0.35)]">Sign Up Free</Link>
            <Link href="#talent" className="rounded-xl border border-white bg-transparent px-4 py-2 text-sm font-medium text-white">Hire talent</Link>
          </div>
          <button type="button" aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-md text-white lg:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </nav>
      </header>

      <main>
        <section className="relative min-h-[85vh] bg-black text-white">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="absolute left-1/2 top-24 h-[600px] w-[600px] -translate-x-1/2 rounded-full border border-acid/10" />
          <div className="absolute left-1/2 top-44 h-[380px] w-[380px] -translate-x-1/2 rounded-full border border-white/5" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 bg-acid/10 blur-[150px]" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 pb-24 pt-48 md:px-0 md:pt-48">
            <div className="max-w-4xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-acid/30 bg-acid/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-acid">
                <span className="h-1.5 w-1.5 rounded-full bg-acid" />
                The work marketplace for both sides
              </div>
              <h1 className="font-maven text-6xl font-black leading-[1.02] tracking-tight text-white lg:text-7xl">
                <span className="block md:inline">Don&apos;t chase,</span>{" "}
                <span className="block md:inline">get <FlipWord /></span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">Sckoll connects people ready to work with teams ready to move—then helps both sides go from first signal to signed outcome.</p>
            </div>

            <div className="w-full max-w-4xl" id="start">
              <form action="#signals" method="get" className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 backdrop-blur sm:flex-row">
                <label htmlFor="marketplace-search" className="sr-only">Search work or talent</label>
                <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 text-black">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
                  <input id="marketplace-search" name="q" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-neutral-500" placeholder="Search jobs, projects, skills, or talent" />
                </div>
                <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-acid px-6 text-sm font-bold text-black transition-transform hover:-translate-y-0.5">Search Sckoll <ArrowUpRight /></button>
              </form>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500"><span>Popular:</span>{CATEGORIES.slice(0, 4).map((category) => <a key={category} href="#categories" className="rounded-full border border-white/10 px-3 py-1.5 transition-colors hover:border-acid/40 hover:text-acid">{category}</a>)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <span className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-black"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>Verified work</span>
              <span className="hidden items-center gap-4 text-white sm:flex"><span className="h-px w-10 border-t border-white/30" /><span className="font-wordmark text-3xl font-black">&amp;</span><span className="h-px w-10 border-t border-white/30" /></span>
              <span className="text-left leading-tight"><span className="block font-wordmark text-2xl font-bold uppercase tracking-wide text-white">Opportunity to outcome</span><span className="hidden font-wordmark text-2xl tracking-wide text-neutral-400 sm:block">Work, one flow</span></span>
            </div>
          </div>
        </section>

        <section className="border-b bg-[#f1f6e9]"><div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-12 text-center sm:grid-cols-4">{SIGNALS.map((signal) => <Stat key={signal.label} {...signal} />)}</div></section>

        <section className="mx-auto max-w-6xl px-6 py-16" id="paths">
          <div className="mb-8"><p className="text-sm uppercase tracking-widest text-[#5b6470]">One marketplace, two clear paths</p><h2 className="mt-2 max-w-2xl font-maven text-3xl font-semibold tracking-tight">Whether you&apos;re winning work or finding the person to do it.</h2></div>
          <div className="grid gap-4 md:grid-cols-2" id="talent">{AUDIENCE_PATHS.map((path) => <article key={path.title} className={`rounded-2xl p-7 ${path.accent}`}><p className={`text-xs font-bold uppercase tracking-[.2em] ${path.accent.includes("black") ? "text-acid" : "text-black/60"}`}>{path.eyebrow}</p><h3 className="mt-12 max-w-md font-maven text-3xl font-bold leading-tight">{path.title}</h3><p className={`mt-4 max-w-md text-sm leading-relaxed ${path.accent.includes("black") ? "text-neutral-300" : "text-black/70"}`}>{path.description}</p><a href={path.href} className={`mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${path.accent.includes("black") ? "bg-white text-black" : "bg-black text-white"}`}>{path.cta}<ArrowUpRight /></a></article>)}</div>
        </section>

        <section className="border-y bg-white" id="signals"><div className="mx-auto max-w-6xl px-6 py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-[#5b6470]">The opportunity feed</p><h2 className="mt-2 font-maven text-3xl font-semibold tracking-tight">The best-fit work and talent, right now.</h2></div><Link href="#" className="rounded-xl border border-black/15 px-4 py-2 text-sm font-semibold transition-colors hover:bg-[#f1f6e9]">Open the full feed <span className="ml-1">→</span></Link></div><div className="mt-8 grid gap-4 sm:grid-cols-3">{OPPORTUNITIES.map((opportunity) => <article key={opportunity.title} className="rounded-2xl border border-black/10 bg-[#f1f6e9] p-5 transition-transform hover:-translate-y-1"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.2em] text-[#5b6470]">{opportunity.type}</p><h3 className="mt-2 font-medium">{opportunity.title}</h3></div><span className="whitespace-nowrap rounded-full bg-acid px-2 py-1 text-xs font-medium">{opportunity.score} fit</span></div><p className="mt-2 text-sm text-[#5b6470]">{opportunity.company}</p><div className="mt-5 flex items-center justify-between border-t border-black/10 pt-3 text-xs text-[#5b6470]"><span>{opportunity.skills}</span><span className="font-semibold text-black">View →</span></div></article>)}</div></div></section>

        <section className="mx-auto max-w-6xl px-6 py-16" id="categories"><div className="grid gap-8 md:grid-cols-[.75fr_1.25fr] md:items-end"><div><p className="text-sm uppercase tracking-widest text-[#5b6470]">Explore by category</p><h2 className="mt-2 font-maven text-3xl font-semibold tracking-tight">Every kind of work has a place here.</h2></div><div className="flex flex-wrap gap-3">{CATEGORIES.map((category) => <a key={category} href="#signals" className="rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-black hover:bg-black hover:text-white">{category}<span className="ml-2 text-[#5b6470]">↗</span></a>)}</div></div></section>

        <section className="border-y bg-[#f1f6e9]" id="engine"><div className="mx-auto max-w-6xl px-6 py-16"><div className="mb-8"><p className="text-sm uppercase tracking-widest text-[#5b6470]">How Sckoll works</p><h2 className="mt-2 font-maven text-3xl font-semibold tracking-tight">From signal to signed work—or a strong hire.</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{WORKFLOW.map((step) => <article key={step.number} className="rounded-2xl border border-black/10 bg-white p-5"><span className="font-mono text-xs text-[#5b6470]">{step.number}</span><div className="my-10 h-px bg-gradient-to-r from-black/20 to-transparent" /><h3 className="text-lg font-bold">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-[#5b6470]">{step.description}</p></article>)}</div></div></section>

        <section className="border-b bg-white" id="trust"><div className="mx-auto max-w-6xl px-6 py-16"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm uppercase tracking-widest text-[#5b6470]">The trust layer</p><h2 className="mt-2 max-w-2xl font-maven text-3xl font-semibold tracking-tight">Move faster without adding another full-time job.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#5b6470]">For people winning work and lean teams finding talent—the messy middle is where Sckoll does the heavy lifting.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3">{TRUST_POINTS.map((point, index) => <div key={point} className="rounded-2xl border border-black/10 bg-[#f1f6e9] p-6"><span className="font-mono text-xs text-[#5b6470]">0{index + 1}</span><p className="mt-16 text-lg font-bold leading-snug">{point}</p></div>)}</div></div></section>

        <section className="border-t bg-[#eaf4d8]" id="pricing"><div className="mx-auto max-w-6xl px-6 py-16 text-center"><p className="text-sm uppercase tracking-widest text-[#5b6470]">Simple by design</p><h2 className="mt-3 font-maven text-3xl font-semibold tracking-tight">Free to start. Pay when Sckoll moves work forward.</h2><p className="mx-auto mt-3 max-w-xl text-sm text-[#5b6470]">Win your next contract, bypass the resume black hole, or source reliable talent without adding a recruiter.</p><div className="mt-6 flex flex-wrap items-center justify-center gap-3"><Link href="#start" className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">Sign up free</Link><Link href="#talent" className="rounded-xl border border-black/15 px-6 py-3 text-sm font-semibold hover:bg-white">Talk to the team</Link></div></div></section>
      </main>

      <footer className="bg-black text-white"><div className="mx-auto flex min-h-[470px] max-w-7xl flex-col justify-between px-8 pb-6 pt-16"><div className="flex flex-col gap-12 text-sm md:flex-row md:gap-16"><div><p className="mb-3 font-medium text-neutral-400">Product</p><div className="flex flex-col space-y-2 text-lg font-semibold"><a href="#engine">How it works</a><a href="#signals">Opportunity feed</a><a href="#trust">Trust layer</a></div></div><div><p className="mb-3 font-medium text-neutral-400">For</p><div className="flex flex-col space-y-1.5 text-base font-semibold opacity-90"><a href="#signals">Freelancers</a><a href="#signals">Job seekers</a><a href="#talent">Founders &amp; agencies</a></div></div><div><p className="mb-3 font-medium text-neutral-400">Explore</p><div className="flex flex-col space-y-1.5 text-base font-semibold opacity-90"><a href="#categories">Categories</a><a href="#pricing">Pricing</a><a href="#">Contact</a></div></div><div className="max-w-xs"><p className="mb-3 font-medium text-neutral-400">The premise</p><p className="text-base leading-relaxed text-neutral-300">Less scrolling. Fewer black holes. More work that fits.</p></div></div><div className="my-24 flex flex-col items-start gap-6 tracking-tighter md:flex-row md:items-center"><Mark small /><span className="font-wordmark text-5xl font-black leading-none tracking-tight md:text-[11vw]">sckoll</span></div><div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-900 pt-4 text-[11px] text-neutral-500"><span>Copyright © 2026 Sckoll. All rights reserved.</span><div className="flex gap-4"><a href="#">Privacy</a><a href="#">Terms</a><a href="#start">Get started</a></div></div></div></footer>
    </div>
  );
}
