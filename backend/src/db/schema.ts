import { pgTable, text, timestamp, uuid, boolean, jsonb, integer, index, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Users & Session Authentication
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  googleSub: text("google_sub").unique(),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["user", "vip", "admin"] }).notNull().default("user"),
  favoriteTeamId: text("favorite_team_id"),
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

/**
 * Sports Directory
 */
export const sports = pgTable("sports", {
  id: text("id").primaryKey(), // e.g. "football", "basketball", "tennis", "mma", "motorsport"
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

/**
 * Leagues & Competitions
 */
export const leagues = pgTable("leagues", {
  id: text("id").primaryKey(), // e.g. "premier-league", "champions-league", "la-liga", "serie-a", "bundesliga", "nba", "ufc"
  sportId: text("sport_id")
    .notNull()
    .references(() => sports.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shortName: text("short_name"),
  country: text("country"),
  logoUrl: text("logo_url"),
  season: text("season").default("2026/27"),
  displayOrder: integer("display_order").notNull().default(0),
});

/**
 * Teams & Competitors
 */
export const teams = pgTable("teams", {
  id: text("id").primaryKey(), // e.g. "arsenal", "real-madrid", "lakers"
  leagueId: text("league_id")
    .notNull()
    .references(() => leagues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  logoUrl: text("logo_url"),
  stadium: text("stadium"),
  primaryColor: text("primary_color").default("#10b981"),
});

export interface MatchStats {
  possession: [number, number]; // [home, away]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  saves: [number, number];
}

/**
 * Live & Scheduled Matches
 */
export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(), // e.g. "ars-mci-2026", "rma-bar-2026"
    sportId: text("sport_id")
      .notNull()
      .references(() => sports.id, { onDelete: "cascade" }),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    homeTeamId: text("home_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    awayTeamId: text("away_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["upcoming", "live", "ht", "finished", "postponed"] })
      .notNull()
      .default("upcoming"),
    minute: integer("minute").notNull().default(0),
    period: text("period").notNull().default("Scheduled"), // "Scheduled", "1st Half", "Halftime", "2nd Half", "Extra Time", "FT"
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    venue: text("venue"),
    round: text("round"),
    isFeatured: boolean("is_featured").notNull().default(false),
    viewersCount: integer("viewers_count").notNull().default(0),
    stats: jsonb("stats").$type<MatchStats>().default({
      possession: [50, 50],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      saves: [0, 0],
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("matches_status_idx").on(t.status),
    index("matches_league_idx").on(t.leagueId),
    index("matches_start_time_idx").on(t.startTime),
  ]
);

/**
 * Multi-Server Stream Feeds
 */
export const streams = pgTable(
  "streams",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    serverName: text("server_name").notNull(), // e.g. "Server 1 (Ultra HD 1080p)", "Server 2 (English 60fps)"
    streamType: text("stream_type", { enum: ["hls", "iframe", "mp4", "embed"] })
      .notNull()
      .default("hls"),
    streamUrl: text("stream_url").notNull(),
    quality: text("quality").notNull().default("1080p"), // "4K", "1080p", "720p", "Auto"
    language: text("language").notNull().default("EN"),
    bitrate: text("bitrate").default("6000 kbps"),
    isDefault: boolean("is_default").notNull().default(false),
    isWorking: boolean("is_working").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("streams_match_idx").on(t.matchId)]
);

/**
 * Live Match Events (Goals, Cards, Substitutions)
 */
export const matchEvents = pgTable(
  "match_events",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    minute: integer("minute").notNull(),
    type: text("type", { enum: ["goal", "yellow_card", "red_card", "sub", "penalty", "var"] }).notNull(),
    teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
    player: text("player").notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("match_events_match_idx").on(t.matchId, t.minute)]
);

export interface PlayerInfo {
  number: number;
  name: string;
  pos: string;
  captain?: boolean;
}

/**
 * Match Lineups & Tactics
 */
export const lineups = pgTable(
  "lineups",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    formation: text("formation").notNull().default("4-3-3"),
    startingEleven: jsonb("starting_eleven").$type<PlayerInfo[]>().notNull().default([]),
    substitutes: jsonb("substitutes").$type<PlayerInfo[]>().notNull().default([]),
    coach: text("coach"),
  },
  (t) => [uniqueIndex("lineups_match_team_unique").on(t.matchId, t.teamId)]
);

/**
 * Real-Time Fan Live Chat
 */
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    username: text("username").notNull(),
    userBadge: text("user_badge").notNull().default("FAN"), // "FAN", "VIP", "MOD", "PRO"
    message: text("message").notNull(),
    teamFlair: text("team_flair"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_messages_match_idx").on(t.matchId, t.createdAt)]
);

/**
 * Match Reactions
 */
export const chatReactions = pgTable(
  "chat_reactions",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type").notNull(), // 'goal' | 'fire' | 'clap' | 'goat' | 'shock' | 'heart'
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("chat_reactions_match_type_unique").on(t.matchId, t.reactionType)]
);

/**
 * Match Highlights & VOD Recaps
 */
export const highlights = pgTable(
  "highlights",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    matchId: text("match_id").references(() => matches.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    competition: text("competition").notNull(),
    videoUrl: text("video_url").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    duration: text("duration").notNull().default("08:30"),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("highlights_match_idx").on(t.matchId)]
);

/**
 * League Standings & Form
 */
export const leagueStandings = pgTable(
  "league_standings",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    leagueId: text("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    drawn: integer("drawn").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    goalsFor: integer("goals_for").notNull().default(0),
    goalsAgainst: integer("goals_against").notNull().default(0),
    goalDiff: integer("goal_diff").notNull().default(0),
    points: integer("points").notNull().default(0),
    form: text("form").notNull().default("W,W,D,L,W"),
  },
  (t) => [uniqueIndex("standings_league_team_unique").on(t.leagueId, t.teamId)]
);

/**
 * User Favorites (Followed Teams or Matches)
 */
export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: text("target_type", { enum: ["team", "match", "league"] }).notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_favorites_user_target_unique").on(t.userId, t.targetType, t.targetId)]
);

export type User = typeof users.$inferSelect;
export type Sport = typeof sports.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Stream = typeof streams.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type Lineup = typeof lineups.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Highlight = typeof highlights.$inferSelect;
export type LeagueStanding = typeof leagueStandings.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
