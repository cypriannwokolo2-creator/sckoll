import type { MetadataRoute } from "next";

const BASE = "https://www.sckoll.com";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE}`, lastModified: new Date(), changeFrequency: "always", priority: 1.0 },
    { url: `${BASE}/schedule`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/standings`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/highlights`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/status`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${BASE}/sign-in`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/sign-up`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const res = await fetch(`${API_URL}/v1/matches`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      for (const m of data.matches ?? []) {
        routes.push({
          url: `${BASE}/watch/${m.id}`,
          lastModified: new Date(m.startTime || Date.now()),
          changeFrequency: m.status === "live" ? "always" : "hourly",
          priority: m.isFeatured ? 0.9 : 0.7,
        });
      }
    }
  } catch {}

  return routes;
}
