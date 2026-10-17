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
  avatarUrl: text("avatar_url"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  links: jsonb("links").$type<Record<string, string>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Client shortlists: talent saved with team notes, optional opportunity context. */
export const shortlists = pgTable(
  "shortlists",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    talentId: uuid("talent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("shortlists_client_talent_unique").on(t.clientId, t.talentId)],
);

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
  lastDigestAt: timestamp("last_digest_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Per-user notification channel preferences. One row per user, created on demand. */
export const notificationPrefs = pgTable("notification_prefs", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  inappEnabled: boolean("inapp_enabled").notNull().default(true),
  /** Per-event email toggles, e.g. {"application.received": false}. Absent = enabled. */
  mutedEvents: jsonb("muted_events").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** In-app notification inbox. Email delivery is handled at fan-out, not stored. */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link").notNull().default("/notifications"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

export type Opportunity = typeof opportunities.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type ShortlistEntry = typeof shortlists.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
/** Work agreements created from accepted applications. One per opportunity. */
export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    talentId: uuid("talent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scope: text("scope").notNull(),
    status: text("status", { enum: ["draft", "active", "completed", "cancelled"] })
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("contracts_opportunity_unique").on(t.opportunityId)],
);

/** Payment-tied delivery checkpoints. Client funds scope; approvals release trust. */
export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amount: integer("amount"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: text("status", { enum: ["pending", "submitted", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("milestones_contract_idx").on(t.contractId)],
);

/** Contract-scoped messaging with read receipts + scam-pattern flags. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    flagged: boolean("flagged").notNull().default(false),
    flagReason: text("flag_reason"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_contract_idx").on(t.contractId, t.createdAt)],
);

/** Two-sided reviews, only on completed contracts, one per side. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    raterId: uuid("rater_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rateeId: uuid("ratee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    text: text("text").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reviews_contract_rater_unique").on(t.contractId, t.raterId)],
);

/** Dispute flags → admin review queue stub. */
export const contractFlags = pgTable("contract_flags", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["open", "resolved"] }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContractRow = typeof contracts.$inferSelect;

/** GIN full-text index over title + description for marketplace search. */
export const opportunitiesFts = index("opportunities_fts_idx").using(
  "gin",
  sql`to_tsvector('english', ${opportunities.title} || ' ' || ${opportunities.description})`,
);
