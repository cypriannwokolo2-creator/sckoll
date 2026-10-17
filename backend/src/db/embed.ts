/**
 * Backfill semantic embeddings for all opportunities + profiles.
 * Run: cd backend && npm run db:embed
 * Safe to re-run (upserts). No PII leaves the process (local embedder).
 */
import dotenv from "dotenv";

dotenv.config();

import { getDb, closeDb } from "./client.js";
import { opportunities, profiles } from "./schema.js";
import { loadEnv } from "../env.js";
import { embedTexts, opportunityText, profileText, upsertEmbedding } from "../lib/embeddings.js";

async function main() {
  const env = loadEnv();
  const db = getDb(env.DATABASE_URL);
  const opps = await db.select().from(opportunities);
  let n = 0;
  for (let i = 0; i < opps.length; i += 20) {
    const batch = opps.slice(i, i + 20);
    const vecs = await embedTexts(batch.map((o) => opportunityText({ title: o.title, description: o.description, skills: o.skills ?? [] })));
    for (let j = 0; j < batch.length; j++) {
      const v = vecs[j];
      if (v) {
        await upsertEmbedding(db, "opportunity", batch[j]!.id, v);
        n++;
      }
    }
  }
  console.log(`embedded ${n} opportunities`);
  const profs = await db.select().from(profiles);
  let m = 0;
  for (let i = 0; i < profs.length; i += 20) {
    const batch = profs.slice(i, i + 20);
    const vecs = await embedTexts(batch.map((p) => profileText({ headline: p.headline, bio: p.bio, skills: p.skills ?? [] })));
    for (let j = 0; j < batch.length; j++) {
      const v = vecs[j];
      if (v) {
        await upsertEmbedding(db, "profile", batch[j]!.userId, v);
        m++;
      }
    }
  }
  console.log(`embedded ${m} profiles`);
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
