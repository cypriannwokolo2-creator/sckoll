import type { Metadata } from "next";
import ProductPage from "@/components/ProductPage";

const CATEGORY_DATA: Record<string, { title: string; description: string; skills: string }> = {
  "development-it": { title: "Development & IT", description: "Software, web, mobile, data, and technical systems.", skills: "1,240+ skills" },
  "design-creative": { title: "Design & Creative", description: "Brand, product, visual, and experience design.", skills: "680+ skills" },
  "writing-content": { title: "Writing & Content", description: "Editorial, technical, copy, and content operations.", skills: "420+ skills" },
  "sales-marketing": { title: "Sales & Marketing", description: "Growth, demand, partnerships, and customer acquisition.", skills: "390+ skills" },
  "finance-operations": { title: "Finance & Operations", description: "Planning, analysis, administration, and operations.", skills: "250+ skills" },
  engineering: { title: "Engineering", description: "Civil, mechanical, electrical, and specialist engineering.", skills: "180+ skills" },
  "customer-support": { title: "Customer Support", description: "Support, success, community, and service operations.", skills: "160+ skills" },
  consulting: { title: "Consulting", description: "Strategy, research, transformation, and specialist advice.", skills: "120+ skills" },
};

export function generateStaticParams() {
  return Object.keys(CATEGORY_DATA).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const data = CATEGORY_DATA[category];
  return data ? { title: `${data.title} — Sckoll`, description: data.description } : { title: "Categories — Sckoll" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const data = CATEGORY_DATA[category];

  if (!data) {
    return null;
  }

  return (
    <ProductPage
      eyebrow="Browse Sckoll"
      title={`${data.title} work and talent.`}
      description={`Explore ${data.description.toLowerCase()} Find people and opportunities matched around the work that needs to get done.`}
      primaryLabel="Explore this category"
      primaryHref="/sign-up"
      secondaryLabel="Search all work"
      secondaryHref="/find-work"
      tone="paper"
      stats={[{ value: data.skills, label: "category skills" }, { value: "FIT", label: "semantic matching" }, { value: "SAFE", label: "verified workflow" }]}
      features={[
        { label: "DISCOVER", title: `Find ${data.title.toLowerCase()} opportunities`, description: "Search projects, contracts, and roles with context behind every result." },
        { label: "MATCH", title: "Show your strongest proof", description: "Build a profile that connects your experience to the work you want next." },
        { label: "MOVE", title: "Turn interest into action", description: "Draft a pitch, shortlist a person, or start a clear agreement." },
      ]}
    />
  );
}
