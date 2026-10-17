/**
 * Idempotent dev seed: skills taxonomy + 30 sample opportunities.
 * Run: cd backend && SEED_CLIENT_EMAIL=you@example.com npm run db:seed
 * The client must already exist (sign up first); opportunities attach to them.
 */
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

import { getDb, closeDb } from "./client.js";
import { opportunities, skills, users } from "./schema.js";
import { loadEnv } from "../env.js";

const TAXONOMY: Array<{ slug: string; label: string; category: string }> = [
  { slug: "react", label: "React", category: "development-it" },
  { slug: "typescript", label: "TypeScript", category: "development-it" },
  { slug: "postgres", label: "PostgreSQL", category: "development-it" },
  { slug: "react-native", label: "React Native", category: "development-it" },
  { slug: "brand-identity", label: "Brand Identity", category: "design-creative" },
  { slug: "product-design", label: "Product Design", category: "design-creative" },
  { slug: "motion", label: "Motion Design", category: "design-creative" },
  { slug: "technical-writing", label: "Technical Writing", category: "writing-content" },
  { slug: "copywriting", label: "Copywriting", category: "writing-content" },
  { slug: "seo-content", label: "SEO Content", category: "writing-content" },
  { slug: "growth", label: "Growth Marketing", category: "sales-marketing" },
  { slug: "partnerships", label: "Partnerships", category: "sales-marketing" },
  { slug: "financial-modeling", label: "Financial Modeling", category: "finance-operations" },
  { slug: "operations", label: "Operations", category: "finance-operations" },
];

const SAMPLES: Array<{
  category: (typeof TAXONOMY)[number]["category"];
  type: "project" | "role" | "contract";
  title: string;
  description: string;
  skills: string[];
  budgetMin?: number;
  budgetMax?: number;
  rateType: "fixed" | "hourly" | "salary";
}> = [
  {
    category: "development-it",
    type: "project",
    title: "Brand identity sprint for a fintech launch",
    description:
      "We are launching a consumer fintech product in six weeks and need a complete brand identity: logo system, color and type direction, and a 20-page guideline document. You will work directly with the founder and a product designer. Two structured feedback rounds per week, async-first communication, and a clear definition of done before we start.",
    skills: ["brand-identity", "product-design"],
    budgetMin: 1200,
    budgetMax: 2000,
    rateType: "fixed",
  },
  {
    category: "development-it",
    type: "role",
    title: "Senior backend engineer for a health platform",
    description:
      "Meridian Health is hiring a senior backend engineer to own our appointment and records APIs. Our stack is Postgres, Fastify, and TypeScript with strict code review and integration tests on every route. Remote-first across European and African time zones, quarterly on-sites, and a genuine on-call rotation that respects sleep.",
    skills: ["typescript", "postgres"],
    rateType: "salary",
  },
  {
    category: "writing-content",
    type: "contract",
    title: "Technical writer for developer documentation",
    description:
      "Openlane needs a technical writer to rebuild our API reference and quickstart guides from the ground up. You should read OpenAPI specs fluently, write runnable code samples in TypeScript, and interview engineers to extract what they forgot to document. Ten hours per week to start, scaling with output quality.",
    skills: ["technical-writing", "typescript"],
    budgetMin: 35,
    budgetMax: 55,
    rateType: "hourly",
  },
];

async function main() {
  const env = loadEnv();
  const db = getDb(env.DATABASE_URL);
  const existing = await db.select({ id: opportunities.id }).from(opportunities).limit(1);
  for (const skill of TAXONOMY) {
    await db.insert(skills).values(skill).onConflictDoNothing();
  }
  console.log(`skills ensured (${TAXONOMY.length})`);
  if (existing.length > 0) {
    console.log("opportunities already seeded, skipping");
    await closeDb();
    return;
  }
  const email = process.env.SEED_CLIENT_EMAIL;
  if (!email) throw new Error("Set SEED_CLIENT_EMAIL to an existing verified client account.");
  const client = (await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1))[0];
  if (!client) throw new Error(`No user found for SEED_CLIENT_EMAIL=${email}`);
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const base = SAMPLES[i % SAMPLES.length]!;
    rows.push({ ...base, title: i < SAMPLES.length ? base.title : `${base.title} (batch ${Math.floor(i / SAMPLES.length) + 1})`, clientId: client.id });
  }
  await db.insert(opportunities).values(rows);
  console.log(`seeded ${rows.length} opportunities for ${email}`);
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
