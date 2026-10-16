import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";

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
