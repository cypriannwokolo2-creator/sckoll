import type { MetadataRoute } from "next";

const BASE = "https://www.sckoll.com";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

/** Cap per collection so a large catalog can never bloat the file or stall the build. */
const MAX_URLS_PER_COLLECTION = 300;
const PAGE_SIZE = 50;

const STATIC_SLUGS = [
  "find-talent",
  "how-it-works",
  "matching-engine",
  "trust",
  "pricing",
  "about",
  "privacy",
  "terms",
  "status",
  "agencies",
  "resources",
];

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

export const revalidate = 86400;

async function opportunityUrls(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];
  let cursor: string | null = null;
  for (let page = 0; page * PAGE_SIZE < MAX_URLS_PER_COLLECTION; page++) {
    const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch(`${API_URL}/v1/opportunities?${qs.toString()}`, { next: { revalidate: 86400 } });
    if (!res.ok) break;
    const data = (await res.json()) as {
      opportunities?: Array<{ id: string; updatedAt?: string }>;
      nextCursor?: string | null;
    };
    for (const opp of data.opportunities ?? []) {
      urls.push({
        url: `${BASE}/find-work/${opp.id}`,
        lastModified: opp.updatedAt ? new Date(opp.updatedAt) : new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      });
    }
    cursor = data.nextCursor ?? null;
    if (!cursor) break;
  }
  return urls;
}

async function profileUrls(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];
  for (let offset = 0; offset < MAX_URLS_PER_COLLECTION; offset += PAGE_SIZE) {
    const res = await fetch(`${API_URL}/v1/profiles?limit=${PAGE_SIZE}&offset=${offset}`, { next: { revalidate: 86400 } });
    if (!res.ok) break;
    const data = (await res.json()) as { profiles?: Array<{ id: string; updatedAt?: string }> };
    const rows = data.profiles ?? [];
    for (const profile of rows) {
      urls.push({
        url: `${BASE}/profile/${profile.id}`,
        lastModified: profile.updatedAt ? new Date(profile.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    if (rows.length < PAGE_SIZE) break;
  }
  return urls;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/find-work`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/find-talent`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...STATIC_SLUGS.map((slug) => ({ url: `${BASE}/${slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...CATEGORIES.map((c) => ({ url: `${BASE}/categories/${c}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
  ];

  let dynamic: MetadataRoute.Sitemap = [];
  try {
    const [opportunities, profiles] = await Promise.all([opportunityUrls(), profileUrls()]);
    dynamic = [...opportunities, ...profiles];
  } catch {
    // API unreachable during this render (build or revalidate): ship the static sitemap.
    // The daily revalidate retries, so this never permanently hides dynamic URLs.
    dynamic = [];
  }

  return [...staticPages, ...dynamic];
}
