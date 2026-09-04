import FlipWord from "@/components/FlipWord";

const MODULES = [
  {
    title: "Find Work & Clients",
    desc: "A feed of real jobs and clients near you — scored by AI so you know who to chase first.",
    tag: "Core",
    icon: "M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  },
  {
    title: "AI Proposals & Quotes",
    desc: "Turn a lead into a scoped, priced proposal in seconds — in your voice, ready to send.",
    tag: "AI",
    icon: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  },
  {
    title: "Contracts & E-Signature",
    desc: "Lock in scope, price, and timeline with a contract your client signs in one click.",
    tag: "Core",
    icon: "M9 12l2 2 4-4M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  {
    title: "Deliver the Job",
    desc: "A simple board — to do, in progress, done. You and your client always know the status.",
    tag: "Core",
    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  },
  {
    title: "Invoices & Payments",
    desc: "Invoice on approval and get paid via bank transfer, mobile money, or card. Escrow-safe.",
    tag: "Core",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    title: "Verified Profile",
    desc: "A public profile with your work, reviews, and verification — instant credibility, day one.",
    tag: "Core",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    title: "AI Outreach & Replies",
    desc: "First messages, follow-ups, and suggested replies over WhatsApp and email — AI drafts, you send.",
    tag: "AI",
    icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  },
  {
    title: "Jobs & Schedule",
    desc: "Every gig, deadline, and delivery date in one calendar — no more notebook chaos.",
    tag: "Core",
    icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  },
  {
    title: "AI Work Assistant",
    desc: "Scores leads, drafts proposals and contracts, breaks signed deals into a task board — 24/7.",
    tag: "AI",
    icon: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8",
  },
];

const INDUSTRIES = [
  "Tech & Software",
  "Engineering",
  "Medicine & Health",
  "Law",
  "Agriculture",
  "Finance",
  "Education",
  "Construction",
  "Creative & Design",
  "Logistics",
  "Hospitality",
  "Real Estate",
  "Media",
  "Retail",
  "Government",
  "Energy",
  "Transport",
  "Security",
  "Sports",
  "Science",
];

const STEPS = [
  {
    num: "01",
    title: "Find & win work",
    desc: "Set up a verified profile, get AI-scored leads, and send outreach that actually gets replies.",
  },
  {
    num: "02",
    title: "Propose & sign",
    desc: "AI drafts the proposal and contract from the lead. Your client signs in one click.",
  },
  {
    num: "03",
    title: "Deliver & get paid",
    desc: "Track the job to done, invoice on approval, and collect via local payment rails.",
  },
];

const FAQS = [
  {
    q: "Who is Sckoll for?",
    a: "Every occupation. Developers, engineers, doctors, lawyers, farmers, designers, drivers, chefs — if you do work for clients, Sckoll runs the business side of it.",
  },
  {
    q: "What does Sckoll actually do?",
    a: "The full flow from lead to payment: find work, send AI-drafted proposals, get contracts signed, deliver the job, and collect payment — all in one platform instead of five disconnected tools.",
  },
  {
    q: "How does the AI help?",
    a: "It scores every lead, drafts your proposals, contracts, and outreach in your voice, and turns a signed contract into a task board automatically. You review and approve every step.",
  },
  {
    q: "How do I get paid?",
    a: "Built for emerging markets first: bank transfers, mobile money, and cards. Payment is requested the moment your client approves the work.",
  },
  {
    q: "What does it cost?",
    a: "Free to start. No subscription traps — pay only for what you use, like AI credits, when you need more than your free monthly allowance.",
  },
];

export default function Home() {
  return (
    <>
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
        <nav className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black px-6">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="#a3ff00" />
                <path d="M7 12l9 6 9-6" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 20l9 6 9-6" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
              </svg>
              <span className="font-wordmark text-base uppercase tracking-widest text-white">Sckoll</span>
            </a>
            <div className="hidden items-center gap-2 lg:flex">
              <a className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white" href="#platform">Platform</a>
              <a className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white" href="#industries">Industries</a>
              <a className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white" href="#how">How it works</a>
              <a className="rounded-md px-3 py-2 text-sm font-bold text-neutral-400 transition-colors hover:text-white" href="#faq">FAQ</a>
            </div>
          </div>
          <div className="hidden items-center gap-5 lg:flex">
            <a className="text-sm text-neutral-300 underline decoration-white underline-offset-4 hover:text-white" href="#">Log In</a>
            <a className="glow-acid-hover rounded-xl bg-acid px-4 py-2 text-sm font-semibold text-black" href="#">Sign Up Free</a>
            <a className="rounded-xl border border-white px-4 py-2 text-sm font-medium text-white" href="#">Get a Demo</a>
          </div>
          <button type="button" aria-label="Open menu" className="flex h-9 w-9 items-center justify-center rounded-md text-white lg:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────── */}
        <section className="relative min-h-[88vh] overflow-hidden bg-black">
          <div className="bg-grid absolute inset-0 opacity-60" />
          <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-acid/10 blur-[140px]" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 pb-24 pt-48 md:pt-56">
            <div className="max-w-3xl">
              <h1 className="font-maven text-6xl font-black leading-[1.02] tracking-tight text-white lg:text-7xl">
                <span className="block md:inline">Find work.</span>{" "}
                <span className="block md:inline">
                  Get <FlipWord />
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <span className="flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-widest text-black">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Every Occupation
              </span>
              <span className="hidden items-center gap-4 text-white sm:flex">
                <span className="h-px w-10 border-t border-white/30" />
                <span className="font-wordmark text-3xl font-black">&amp;</span>
                <span className="h-px w-10 border-t border-white/30" />
              </span>
              <span className="text-left leading-tight">
                <span className="block font-wordmark text-2xl font-bold uppercase tracking-wide text-white">Lead to Payment</span>
                <span className="hidden font-wordmark text-2xl tracking-wide text-neutral-400 sm:block">In One Flow</span>
              </span>
            </div>

            <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-between gap-4 border-y border-white/15 py-8 md:mt-10 md:flex-col md:items-start md:gap-6">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-acid text-black">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block font-wordmark text-base font-bold tracking-wide text-white">AI-scored leads, proposals & contracts —</span>
                  <span className="block font-wordmark text-base tracking-wide text-neutral-400">deliver the job and get paid, all in one place</span>
                </span>
              </div>
              <a href="#platform" className="flex items-center gap-2 rounded-xl bg-white/10 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/20">
                Explore the Platform
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M9 7h8v8" /></svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Stats band ────────────────────────────────── */}
        <section className="border-b border-white/10 bg-[#050505]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-12 text-center sm:grid-cols-4">
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight text-acid">20</p>
              <p className="mt-1 text-xs text-neutral-400">industries, one platform</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight">1</p>
              <p className="mt-1 text-xs text-neutral-400">flow: lead to payment</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight">AI</p>
              <p className="mt-1 text-xs text-neutral-400">in every step</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold tracking-tight">$0</p>
              <p className="mt-1 text-xs text-neutral-400">to start, no subscription</p>
            </div>
          </div>
        </section>

        {/* ── Modules / marketplace ─────────────────────── */}
        <section id="platform" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-maven text-4xl font-black tracking-tight text-white lg:text-5xl">The whole business, in one place</h2>
              <p className="mt-3 max-w-xl text-neutral-400">
                Finding work, closing it, delivering, getting paid — the hard parts, handled. You just do the work you&apos;re good at.
              </p>
            </div>
            <a href="#" className="rounded-xl bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/20">
              See all modules
            </a>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <div key={m.title} className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 transition-colors hover:border-acid/50">
                <div>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-acid/10">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-acid" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={m.icon} />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">{m.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${m.tag === "AI" ? "bg-acid text-black" : "bg-white/10 text-neutral-300"}`}>
                    {m.tag === "AI" ? "AI-powered" : "Built in"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Industries ────────────────────────────────── */}
        <section id="industries" className="border-y border-white/10 bg-black py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <h2 className="font-maven text-4xl font-black tracking-tight text-white lg:text-5xl">Whatever you do, you run on Sckoll</h2>
              <p className="mx-auto mt-3 max-w-xl text-neutral-400">
                Not a tool for one trade. Every occupation runs the same flow — find work, sign, deliver, get paid.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {INDUSTRIES.map((n) => (
                <span key={n} className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition-colors hover:border-acid/60 hover:text-acid">
                  {n}
                </span>
              ))}
              <span className="rounded-full bg-acid px-5 py-2.5 text-sm font-bold text-black">…and every occupation</span>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────── */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="font-maven text-4xl font-black tracking-tight text-white lg:text-5xl">From lead to paid, in three steps</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.num} className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-8">
                <span className="font-maven text-5xl font-black text-acid">{s.num}</span>
                <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section id="faq" className="border-t border-white/10 bg-black py-20">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-10 text-center font-maven text-4xl font-black tracking-tight text-white">FAQ</h2>
            <div className="divide-y divide-white/10">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-white [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg className="h-5 w-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none">
                      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-400">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────── */}
        <section className="bg-[#050505] py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-maven text-5xl font-black tracking-tight text-white lg:text-6xl">
              Run your work on <span className="text-acid">Sckoll.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-neutral-400">
              Free to start. Every occupation, one flow, lead to payment.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#" className="glow-acid glow-acid-hover rounded-xl bg-acid px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-black">
                Sign Up Free
              </a>
              <a href="#" className="rounded-xl border border-white px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white">
                Get a Demo
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="9" fill="#a3ff00" />
              <path d="M7 12l9 6 9-6" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 20l9 6 9-6" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
            </svg>
            <span className="font-wordmark text-sm uppercase tracking-widest text-white">Sckoll</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <a href="#" className="transition-colors hover:text-white">Privacy</a>
            <a href="#" className="transition-colors hover:text-white">Terms</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </div>
          <p className="text-xs text-neutral-600">© 2026 Sckoll</p>
        </div>
      </footer>
    </>
  );
}
