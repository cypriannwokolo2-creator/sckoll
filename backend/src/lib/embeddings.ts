/**
 * Semantic matching v1. Deterministic local embedder (384-dim, L2-normalized)
 * behind a provider interface — swap in a hosted model later without touching
 * callers. Text only; no PII leaves the process.
 */

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { embeddings } from "../db/schema.js";

export const EMBEDDING_DIM = 384;

export interface EmbedProvider {
  embed(texts: string[]): Promise<number[][]>;
}

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 200);
}

export function localEmbed(text: string): number[] {
  const vec = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;
  for (const token of tokens) {
    const h1 = fnv1a(token);
    const h2 = fnv1a(`s:${token}`);
    vec[h1 % EMBEDDING_DIM]! += 1;
    vec[h2 % EMBEDDING_DIM]! += 0.5;
  }
  const norm = Math.sqrt(vec.reduce((n, v) => n + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export const localProvider: EmbedProvider = {
  embed: async (texts: string[]) => texts.map(localEmbed),
};

let provider: EmbedProvider = localProvider;

/** Swap the embedder (hosted model) without touching callers. */
export function setEmbedProvider(p: EmbedProvider): void {
  provider = p;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  return provider.embed(texts);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += a[i]! * b[i]!;
  return dot;
}

/** Map cosine (-1..1) onto the 50..99 fit scale. */
export function vectorFit(cosineSim: number): number {
  return Math.round(50 + ((cosineSim + 1) / 2) * 49);
}

/** Hybrid blend: 40% rules + 60% semantic, each on 50..99. */
export function blendFit(rules: number, vector: number): number {
  return Math.round(rules * 0.4 + vector * 0.6);
}

export function opportunityText(input: { title: string; description: string; skills: string[] }): string {
  return `${input.title}\n${input.description}\nSkills: ${input.skills.join(", ")}`;
}

export function profileText(input: { headline?: string | null; bio?: string | null; skills: string[] }): string {
  return `${input.headline ?? ""}\n${input.bio ?? ""}\nSkills: ${input.skills.join(", ")}`;
}

// --- Store helpers (embeddings table holds JSON arrays; pgvector reserved for scale) ---

type StoreDb = ReturnType<typeof getDb>;

export async function upsertEmbedding(
  db: StoreDb,
  ownerType: "opportunity" | "profile",
  ownerId: string,
  vector: number[],
): Promise<void> {
  await db
    .insert(embeddings)
    .values({ ownerType, ownerId, embedding: JSON.stringify(vector), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [embeddings.ownerType, embeddings.ownerId],
      set: { embedding: JSON.stringify(vector), updatedAt: new Date() },
    });
}

export async function getEmbeddings(
  db: StoreDb,
  ownerType: "opportunity" | "profile",
  ownerIds: string[],
): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  if (ownerIds.length === 0) return map;
  const rows = await db
    .select()
    .from(embeddings)
    .where(and(eq(embeddings.ownerType, ownerType), inArray(embeddings.ownerId, ownerIds)));
  for (const row of rows) {
    const v = parseVector(row.embedding);
    if (v) map.set(row.ownerId, v);
  }
  return map;
}

export function parseVector(raw: string): number[] | null {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v) && v.length === EMBEDDING_DIM && v.every((n) => typeof n === "number")) return v as number[];
    return null;
  } catch {
    return null;
  }
}
