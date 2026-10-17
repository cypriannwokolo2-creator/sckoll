import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPage, { type ProductPageProps } from "@/components/ProductPage";

const CATEGORIES = [
  "development-it",
  "design-creative",
  "writing-content",
  "sales-marketing",
  "finance-operations",
  "engineering",
  "customer-support",
  "consulting",
];

const PAGES: Record<string, ProductPageProps> = {
  "how-it-works": {
    eyebrow: "The Sckoll workflow",
    title: "A better path from opportunity to outcome.",
    description: "One marketplace for discovering work, finding people, making the pitch, agreeing on terms, and keeping momentum after the match.",
    primaryLabel: "Create your free profile",
    primaryHref: "/sign-up",
    secondaryLabel: "Explore the trust layer",
    secondaryHref: "/trust",
    tone: "paper",
    features: [
      { label: "01 / DISCOVER", title: "Let the right signal come to you", description: "Your radar aggregates opportunities and demand across the places you would otherwise search manually." },
      { label: "02 / MATCH", title: "Rank fit by more than keywords", description: "Skills, proof, seniority, intent, and context combine into a match you can understand." },
      { label: "03 / MOVE", title: "Keep the human in control", description: "AI drafts the next action. You decide what gets sent, signed, and started." },
    ],
    steps: [
      { number: "01", title: "Create your signal", description: "Tell Sckoll what you can do, what you need, or who you want to hire." },
      { number: "02", title: "Discover the fit", description: "See relevant opportunities or people ranked by skills and proof." },
      { number: "03", title: "Make a stronger move", description: "Generate a focused application, pitch, shortlist, or project brief." },
      { number: "04", title: "Agree with confidence", description: "Keep terms, scope, milestones, and conversations together." },
    ],
  },
  "matching-engine": {
    eyebrow: "Why Sckoll",
    title: "Matching that understands the work behind the words.",
    description: "Sckoll combines semantic profile understanding with skills, seniority, proof, and intent so the feed gets more useful over time.",
    primaryLabel: "Build your match profile",
    primaryHref: "/sign-up",
    secondaryLabel: "Find work",
    secondaryHref: "/find-work",
    tone: "dark",
    features: [
      { label: "CONTEXT", title: "Understands the brief", description: "A project is more than a title. Sckoll reads the outcome, constraints, and signals behind it." },
      { label: "EVIDENCE", title: "Uses proof of work", description: "Profiles become stronger when experience, links, results, and skills work together." },
      { label: "CONTROL", title: "Explains the fit", description: "See the shared skills and reasons behind a recommendation before you act." },
    ],
  },
  "trust": {
    eyebrow: "Trust & safety",
    title: "Move quickly without stepping into the dark.",
    description: "Sckoll is designed for real people, real money, and the messy middle between a promising match and completed work.",
    primaryLabel: "Create a verified profile",
    primaryHref: "/sign-up",
    secondaryLabel: "Read the workflow",
    secondaryHref: "/how-it-works",
    tone: "paper",
    features: [
      { label: "IDENTITY", title: "Verified professional profiles", description: "Link your professional graph and build trust from real experience and proof." },
      { label: "SAFETY", title: "Scam detection built in", description: "High-risk language and off-platform leakage patterns are flagged before they become costly." },
      { label: "PAYMENTS", title: "Milestone-safe work", description: "Keep scope, approvals, payment events, and audit trails connected to the contract." },
    ],
  },
  "talent-search": {
    eyebrow: "For teams",
    title: "Search talent by the outcome you need.",
    description: "Use structured context, fit signals, and proof of work to move from a broad search to a shortlist you can trust.",
    primaryLabel: "Start a talent search",
    primaryHref: "/sign-up?role=client",
    secondaryLabel: "See team workspace",
    secondaryHref: "/team-workspace",
    tone: "dark",
    features: [
      { label: "SEARCH", title: "Start with the work", description: "Describe the project, role, or outcome before filtering down to a person." },
      { label: "FIT", title: "See relevant evidence", description: "Review shared skills, project proof, seniority, and intent in one view." },
      { label: "DECIDE", title: "Shortlist together", description: "Keep notes and decisions visible to the people involved in hiring." },
    ],
  },
  "pricing": {
    eyebrow: "Simple by design",
    title: "Start free. Pay when Sckoll moves work forward.",
    description: "Create your profile and explore the marketplace without a subscription trap. Upgrade when you need more automation, collaboration, or volume.",
    primaryLabel: "Sign up free",
    primaryHref: "/sign-up",
    secondaryLabel: "Talk to the team",
    secondaryHref: "/contact",
    tone: "acid",
    stats: [{ value: "$0", label: "to create a profile" }, { value: "1", label: "workspace for both sides" }, { value: "0", label: "black-box commitments" }],
    features: [
      { label: "FREE", title: "Start with your profile", description: "One profile, open discovery, match-ranked feeds, and standard applications. Free while the marketplace grows." },
      { label: "PRO", title: "Move with more leverage", description: "Proposal assistant drafts, saved-search alerts, pipeline analytics, and priority placement in shortlists." },
      { label: "TEAMS", title: "Scale your hiring motion", description: "Shared hiring rooms, team notes, milestone contracts, and payment rails with audit trails." },
    ],
  },
  "about": {
    eyebrow: "The Sckoll premise",
    title: "Good work should find the people ready to do it.",
    description: "Sckoll is building a more useful work marketplace—one that respects the time of the people looking for opportunity and the teams trying to find them.",
    primaryLabel: "Join Sckoll",
    primaryHref: "/sign-up",
    secondaryLabel: "See the engine",
    secondaryHref: "/how-it-works",
    tone: "dark",
    features: [
      { label: "THE PROBLEM", title: "Too much work is still manual", description: "People scroll, copy, paste, fill forms, chase replies, and manage work across disconnected tools." },
      { label: "THE IDEA", title: "Let intelligence handle the repetition", description: "Sckoll uses context and automation to make discovery and execution more focused." },
      { label: "THE STANDARD", title: "Keep people in control", description: "The system can recommend and draft. People still decide what happens next." },
    ],
  },
  "privacy": {
    eyebrow: "Sckoll policies · Updated October 2026",
    title: "Privacy that respects the work behind your profile.",
    description: "Sckoll collects the minimum needed to run the marketplace: your account details, profile content, and the activity required for matching, messaging, and payments. We never sell personal data.",
    primaryLabel: "Return home",
    primaryHref: "/",
    secondaryLabel: "Contact Sckoll",
    secondaryHref: "/contact",
    tone: "paper",
    features: [
      { label: "COLLECT", title: "What we collect", description: "Account details (name, email, password hash), profile content you publish, and operational records such as sessions, applications, and payment events." },
      { label: "USE", title: "How we use it", description: "To operate accounts, rank matches, deliver transactional email, prevent fraud, and meet legal obligations. No advertising profiles, no data brokerage." },
      { label: "CONTROL", title: "Your control", description: "Edit your profile anytime, sign out to end sessions, request export or deletion of your data via the contact page. Deletion removes your profile and personal records." },
    ],
  },
  "terms": {
    eyebrow: "Sckoll policies · Updated October 2026",
    title: "Clear terms for a two-sided marketplace.",
    description: "By using Sckoll you agree to use the platform honestly: real identities, lawful work, and human-approved actions. Either side may close an account that misrepresents skills, posts fraudulent work, or abuses messaging.",
    primaryLabel: "Return home",
    primaryHref: "/",
    secondaryLabel: "Contact Sckoll",
    secondaryHref: "/contact",
    tone: "paper",
    features: [
      { label: "ACCOUNTS", title: "Your account, your responsibility", description: "Keep credentials private, keep your profile truthful, and keep conversations on the platform until a contract is agreed." },
      { label: "WORK", title: "Work agreements stand on their terms", description: "Scope, milestones, and payment terms agreed in a contract bind both sides. Sckoll provides the trail; parties perform the work." },
      { label: "FAIR USE", title: "No spam, scams, or scraping", description: "Bulk outreach, misleading listings, and automated harvesting lead to removal. Report abuse via the contact page." },
    ],
  },
  "agencies": {
    eyebrow: "For agencies and solopreneurs",
    title: "Scale outreach without losing your voice.",
    description: "Aggregate leads, keep your client pipeline organized, and use context-aware drafts to turn more conversations into work.",
    primaryLabel: "Build an agency workspace",
    primaryHref: "/sign-up?role=client",
    secondaryLabel: "See the proposal assistant",
    secondaryHref: "/proposal-assistant",
    tone: "dark",
    features: [
      { label: "AGGREGATE", title: "Bring leads into one radar", description: "Stop checking every board, inbox, and referral channel separately." },
      { label: "PERSONALIZE", title: "Pitch from context", description: "Generate focused outreach that starts from the prospect and the work." },
      { label: "SCALE", title: "Keep every opportunity moving", description: "Track follow-ups, next actions, and active client conversations in one pipeline." },
    ],
  },
  "resources": {
    eyebrow: "Sckoll resources",
    title: "Practical guidance for moving work forward.",
    description: "Guides, playbooks, and product notes for finding work, hiring talent, writing better proposals, and building trust.",
    primaryLabel: "Start with how it works",
    primaryHref: "/how-it-works",
    secondaryLabel: "Contact Sckoll",
    secondaryHref: "/contact",
    tone: "paper",
    cards: [
      { label: "GUIDE", title: "Write a brief people can act on", description: "Make the outcome, context, and constraints clear.", href: "/post-project" },
      { label: "PLAYBOOK", title: "Build a profile with proof", description: "Turn scattered experience into a strong signal.", href: "/profile" },
      { label: "NOTE", title: "Why fit beats volume", description: "Better matching reduces wasted effort on both sides.", href: "/matching-engine" },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  return page ? { title: `${page.title} — Sckoll`, description: page.description } : { title: "Sckoll" };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (CATEGORIES.includes(slug)) {
    const name = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" & ");
    return <ProductPage eyebrow="Browse Sckoll" title={`${name} work and talent.`} description={`Explore ${name.toLowerCase()} opportunities, skills, and people matched around the work that needs to get done.`} primaryLabel="Explore this category" primaryHref="/sign-up" secondaryLabel="Search all work" secondaryHref="/find-work" tone="paper" stats={[{ value: "LIVE", label: "category discovery" }, { value: "FIT", label: "semantic matching" }, { value: "SAFE", label: "verified workflow" }]} features={[{ label: "DISCOVER", title: `Find ${name.toLowerCase()} opportunities`, description: "Search projects, contracts, and roles with context behind every result." }, { label: "MATCH", title: "Show your strongest proof", description: "Build a profile that connects your experience to the work you want next." }, { label: "MOVE", title: "Turn interest into action", description: "Draft a pitch, shortlist a person, or start a clear agreement." }]} />;
  }
  if (!PAGES[slug]) notFound();
  return <ProductPage {...PAGES[slug]} />;
}
