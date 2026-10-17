import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Sckoll v1 auth + profiles schema.
 * - users: email/password (nullable hash for Google-only accounts) + google_sub for stable linking.
 * - sessions: opaque-token sessions (sha256 hash stored, raw token in HttpOnly cookie).
 * - verification_tokens / password_reset_tokens: single-use, expiring.
 * - profiles: one row per user, role from the sign-up switch (talent|client|both).
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  googleSub: text("google_sub").unique(),
  role: text("role", { enum: ["talent", "client", "both"] })
    .notNull()
    .default("talent"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  location: text("location"),
  availability: text("availability"),
  hourlyRate: text("hourly_rate"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  links: jsonb("links").$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;

/**
 * Marketplace: client-posted work. Talent discovers via /v1/opportunities,
 * applies in Phase 4. Status is a soft lifecycle — rows are never hard-deleted.
 */
export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull().default("development-it"),
  type: text("type", { enum: ["project", "role", "contract"] }).notNull().default("project"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  rateType: text("rate_type", { enum: ["fixed", "hourly", "salary"] }).notNull().default("fixed"),
  location: text("location"),
  remote: boolean("remote").notNull().default(true),
  status: text("status", { enum: ["draft", "open", "closed"] }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Canonical skill taxonomy backing categories + matching. Seeded, not user input. */
export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  category: text("category").notNull(),
});

/** Append-only audit trail for marketplace actions (Phase 3+: create/status). */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Talent applications to opportunities. One row per (opportunity, talent).
 * Status lifecycle: applied → shortlisted → accepted | rejected; accepted is
 * terminal and closes the opportunity to new applies (Phase 4+).
 */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    talentId: uuid("talent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pitch: text("pitch").notNull(),
    bidAmount: integer("bid_amount"),
    bidType: text("bid_type", { enum: ["fixed", "hourly"] }).notNull().default("fixed"),
    status: text("status", { enum: ["applied", "shortlisted", "accepted", "rejected"] })
      .notNull()
      .default("applied"),
    fitScore: integer("fit_score"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("applications_opp_idx").on(t.opportunityId),
    index("applications_talent_idx").on(t.talentId),
    uniqueIndex("applications_opp_talent_unique").on(t.opportunityId, t.talentId),
  ],
);

/** Talent-saved searches with email alert toggle (digest in Phase 6). */
export const savedSearches = pgTable("saved_searches", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull().default(""),
  filters: jsonb("filters").$type<Record<string, string>>().notNull().default({}),
  emailAlerts: boolean("email_alerts").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;

/** GIN full-text index over title + description for marketplace search. */
export const opportunitiesFts = index("opportunities_fts_idx").using(
  "gin",
  sql`to_tsvector('english', ${opportunities.title} || ' ' || ${opportunities.description})`,
);
