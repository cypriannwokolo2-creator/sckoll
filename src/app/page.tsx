import Link from "next/link";

const FEATURES = [
  {
    title: "Fast Delivery",
    desc: "Sub-100ms send times via globally distributed infrastructure.",
    icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  },
  {
    title: "99.99% Uptime",
    desc: "Enterprise-grade reliability backed by an SLA.",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
  {
    title: "Smart Automations",
    desc: "Trigger emails based on user behavior. Welcome flows, re-engagement, and more.",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    title: "Visual Editor",
    desc: "Drag-and-drop email builder with 50+ responsive templates.",
    icon: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  },
  {
    title: "Real-Time Analytics",
    desc: "Track opens, clicks, bounces, and engagement as they happen.",
    icon: "M18 20V10M12 20V4M6 20v-6",
  },
  {
    title: "Webhooks & API",
    desc: "RESTful API with SDKs for Node.js, Python, Go, Ruby, and PHP.",
    icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  },
];

const STEPS = [
  { num: "01", title: "Create account", desc: "Sign up free. No credit card required." },
  { num: "02", title: "Get your API key", desc: "Copy your key and start sending in minutes." },
  { num: "03", title: "Send at scale", desc: "We handle deliverability, compliance, and infrastructure." },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    desc: "For side projects and testing.",
    features: ["1,000 emails/month", "1 API key", "Basic templates", "Community support"],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "For growing businesses.",
    features: [
      "50,000 emails/month",
      "Unlimited API keys",
      "50+ templates",
      "Automations & sequences",
      "A/B testing",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For high-volume senders.",
    features: [
      "Unlimited emails",
      "Dedicated IPs",
      "Custom templates",
      "SSO & SAML",
      "99.99% SLA",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const FAQS = [
  {
    q: "How is Sckoll different from SendGrid or Mailgun?",
    a: "Sckoll offers faster delivery, cleaner APIs, and more transparent pricing. We don't charge extra for dedicated IPs or advanced features.",
  },
  {
    q: "Is the free tier really free?",
    a: "Yes. 1,000 emails per month, forever. No credit card required. No trial expiration.",
  },
  {
    q: "What programming languages do you support?",
    a: "Official SDKs for Node.js, Python, Go, Ruby, PHP, and Java. Any language that can make HTTP requests works via our REST API.",
  },
  {
    q: "Can I migrate from my current provider?",
    a: "Yes. One-click migration tools for SendGrid, Mailgun, Postmark, and Amazon SES. Zero downtime guaranteed.",
  },
  {
    q: "What compliance certifications do you have?",
    a: "SOC 2 Type II, GDPR, and CCPA compliant. HIPAA support available on Enterprise plans.",
  },
];

export default function Home() {
  return (
    <>
      {/* ── Header ───────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#lg)" />
              <path d="M8 12l8 6 8-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 20l8 6 8-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            Sckoll
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Log in</a>
            <a href="#pricing" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Start Free
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────── */}
        <section className="pt-32 pb-20 px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-6 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-400">
              Email infrastructure built for developers
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
              Email that
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"> just works</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Send transactional emails, marketing campaigns, and API-driven messages with
              near-perfect deliverability. One API, zero headaches.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a href="#pricing" className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
                Start Sending Free →
              </a>
              <a href="#features" className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
                See Features
              </a>
            </div>

            {/* Code snippet */}
            <div className="mx-auto max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden text-left shadow-2xl shadow-indigo-500/5">
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-zinc-500 font-mono">send.js</span>
              </div>
              <pre className="p-4 text-[13px] leading-relaxed font-mono text-zinc-400 overflow-x-auto">
                <span className="text-purple-400">import</span>
                {" { Sckoll } "}
                <span className="text-purple-400">from</span>
                {" "}
                <span className="text-green-400">&apos;@sckoll/sdk&apos;</span>;{"\n\n"}
                <span className="text-purple-400">const</span>
                {" sckoll = "}
                <span className="text-blue-400">new</span>
                {" Sckoll("}
                <span className="text-green-400">&apos;sk_live_...&apos;</span>
                {");\n\n"}
                <span className="text-purple-400">await</span>
                {" sckoll.emails.send({\n"}
                {"  from: "}
                <span className="text-green-400">&apos;hello@sckoll.com&apos;</span>
                {",\n"}
                {"  to: "}
                <span className="text-green-400">&apos;user@example.com&apos;</span>
                {",\n"}
                {"  subject: "}
                <span className="text-green-400">&apos;Welcome aboard&apos;</span>
                {",\n"}
                {"  html: "}
                <span className="text-green-400">&apos;&lt;h1&gt;Hi!&lt;/h1&gt;&apos;</span>
                {"\n});"}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────── */}
        <section id="features" className="py-24 px-6 border-t border-zinc-800">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Everything you need
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                A complete email platform. Send, track, and optimize — all from a single API.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────── */}
        <section className="py-24 px-6 border-t border-zinc-800 bg-zinc-900/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="text-zinc-400 mb-16">Three steps. That&apos;s it.</p>
            <div className="grid sm:grid-cols-3 gap-8">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col items-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold">
                    {s.num}
                  </div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-zinc-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────── */}
        <section id="pricing" className="py-24 px-6 border-t border-zinc-800">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Simple pricing
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                Start free. Pay only when you scale.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 items-start">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-xl border p-8 ${
                    p.popular
                      ? "border-indigo-500 bg-zinc-900 shadow-lg shadow-indigo-500/10 relative"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                  <p className="text-sm text-zinc-400 mb-6">{p.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    {p.period && <span className="text-zinc-500 text-sm ml-1">{p.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.3 4.3L6.3 11.3 2.7 7.7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#"
                    className={`block w-full text-center rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                      p.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-500"
                        : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {p.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────── */}
        <section id="faq" className="py-24 px-6 border-t border-zinc-800 bg-zinc-900/30">
          <div className="mx-auto max-w-2xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                FAQ
              </h2>
            </div>
            <div className="space-y-0 divide-y divide-zinc-800">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-6">
                  <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-zinc-100 list-none [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg className="h-5 w-5 text-zinc-500 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none">
                      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_70%)]" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 relative">
              Ready to send better email?
            </h2>
            <p className="text-indigo-100 text-lg mb-8 relative">
              Start free. Upgrade when you&apos;re ready.
            </p>
            <a
              href="#pricing"
              className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors relative"
            >
              Get Started Free →
            </a>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-zinc-800 py-12 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-sm">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#lg2)" />
              <path d="M8 12l8 6 8-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 20l8 6 8-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".4" />
              <defs>
                <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            Sckoll
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Status</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Docs</a>
          </div>
          <p className="text-xs text-zinc-600">© 2026 Sckoll, Inc.</p>
        </div>
      </footer>
    </>
  );
}
