import type { Metadata } from "next";
import Link from "next/link";

const CATEGORIES = [
  ["development-it", "Development & IT", "Software, web, mobile, data, and technical systems."],
  ["design-creative", "Design & Creative", "Brand, product, visual, and experience design."],
  ["writing-content", "Writing & Content", "Editorial, technical, copy, and content operations."],
  ["sales-marketing", "Sales & Marketing", "Growth, demand, partnerships, and customer acquisition."],
  ["finance-operations", "Finance & Operations", "Planning, analysis, administration, and operations."],
  ["engineering", "Engineering", "Civil, mechanical, electrical, and specialist engineering."],
  ["customer-support", "Customer Support", "Support, success, community, and service operations."],
  ["consulting", "Consulting", "Strategy, research, transformation, and specialist advice."],
] as const;

export const metadata: Metadata = {
  title: "Categories — Sckoll",
  description: "Explore Sckoll work and talent categories.",
};

export default function CategoriesPage() {
  return (
    <main className="sckoll-directory-page">
      <section className="sckoll-directory-hero"><div className="sckoll-container"><Link href="/" className="sckoll-breadcrumb">← Back to Sckoll</Link><p className="sckoll-sub-eyebrow">Marketplace directory</p><h1>Find your lane.</h1><p>Explore the work and talent categories that power the Sckoll marketplace.</p></div></section>
      <section className="sckoll-directory-section"><div className="sckoll-container"><div className="sckoll-directory-grid">{CATEGORIES.map(([slug, title, description]) => <Link key={slug} href={`/categories/${slug}`} className="sckoll-directory-card"><span>EXPLORE ↗</span><h2>{title}</h2><p>{description}</p></Link>)}</div></div></section>
    </main>
  );
}
