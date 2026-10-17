CREATE INDEX IF NOT EXISTS "opportunities_fts_idx" ON "opportunities" USING gin (to_tsvector('english', "title" || ' ' || "description"));
