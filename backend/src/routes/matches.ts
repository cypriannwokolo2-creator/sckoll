import type { FastifyInstance } from "fastify";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client.js";
import {
  matches,
  teams,
  leagues,
  sports,
  streams,
  matchEvents,
  lineups,
} from "../db/schema.js";
import type { Env } from "../env.js";

const querySchema = z.object({
  sport: z.string().optional(),
  league: z.string().optional(),
  status: z.enum(["live", "upcoming", "finished", "all"]).optional(),
  date: z.string().optional(), // 'today', 'tomorrow', 'yesterday' or YYYY-MM-DD
  q: z.string().optional(),
});

export async function registerMatchRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/sports: Directory of sports with active count
  app.get("/v1/sports", async (_req, reply) => {
    const allSports = await db.select().from(sports).orderBy(sports.displayOrder);
    const liveMatches = await db
      .select({ sportId: matches.sportId, count: sql<number>`count(*)::int` })
      .from(matches)
      .where(eq(matches.status, "live"))
      .groupBy(matches.sportId);

    const liveMap = new Map(liveMatches.map((r) => [r.sportId, r.count]));

    return {
      sports: allSports.map((s) => ({
        ...s,
        liveCount: liveMap.get(s.id) ?? 0,
      })),
    };
  });

  // GET /v1/matches: Live and scheduled matches
  app.get("/v1/matches", async (req, reply) => {
    const parse = querySchema.safeParse(req.query);
    if (!parse.success) {
      return reply.code(400).send({ error: "Invalid query params", details: parse.error.issues });
    }

    const { sport, league, status, q } = parse.data;

    let conditions = [];

    if (sport && sport !== "all") {
      conditions.push(eq(matches.sportId, sport));
    }

    if (league && league !== "all") {
      conditions.push(eq(matches.leagueId, league));
    }

    if (status && status !== "all") {
      conditions.push(eq(matches.status, status));
    }

    const result = await db
      .select({
        id: matches.id,
        sportId: matches.sportId,
        leagueId: matches.leagueId,
        leagueName: leagues.name,
        leagueCountry: leagues.country,
        leagueLogo: leagues.logoUrl,
        homeTeamId: matches.homeTeamId,
        homeTeamName: teams.name,
        homeTeamShort: teams.shortName,
        homeTeamLogo: teams.logoUrl,
        awayTeamId: matches.awayTeamId,
        awayTeamName: sql<string>`away_team.name`,
        awayTeamShort: sql<string>`away_team.short_name`,
        awayTeamLogo: sql<string>`away_team.logo_url`,
        status: matches.status,
        minute: matches.minute,
        period: matches.period,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        startTime: matches.startTime,
        venue: matches.venue,
        round: matches.round,
        isFeatured: matches.isFeatured,
        viewersCount: matches.viewersCount,
      })
      .from(matches)
      .innerJoin(leagues, eq(matches.leagueId, leagues.id))
      .innerJoin(teams, eq(matches.homeTeamId, teams.id))
      .innerJoin(sql`teams AS away_team`, sql`matches.away_team_id = away_team.id`)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        sql`CASE WHEN matches.status = 'live' THEN 0 WHEN matches.status = 'upcoming' THEN 1 ELSE 2 END`,
        desc(matches.isFeatured),
        matches.startTime
      );

    let filtered = result;
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      filtered = result.filter(
        (m) =>
          m.homeTeamName.toLowerCase().includes(term) ||
          m.awayTeamName.toLowerCase().includes(term) ||
          m.leagueName.toLowerCase().includes(term)
      );
    }

    return { matches: filtered, total: filtered.length };
  });

  // GET /v1/matches/:id: Detailed match view with streams, events, lineups
  app.get("/v1/matches/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    const matchRows = await db
      .select({
        id: matches.id,
        sportId: matches.sportId,
        leagueId: matches.leagueId,
        leagueName: leagues.name,
        leagueCountry: leagues.country,
        leagueLogo: leagues.logoUrl,
        homeTeamId: matches.homeTeamId,
        homeTeamName: teams.name,
        homeTeamShort: teams.shortName,
        homeTeamLogo: teams.logoUrl,
        homeTeamColor: teams.primaryColor,
        awayTeamId: matches.awayTeamId,
        awayTeamName: sql<string>`away_team.name`,
        awayTeamShort: sql<string>`away_team.short_name`,
        awayTeamLogo: sql<string>`away_team.logo_url`,
        awayTeamColor: sql<string>`away_team.primary_color`,
        status: matches.status,
        minute: matches.minute,
        period: matches.period,
        homeScore: matches.homeScore,
        awayScore: matches.awayScore,
        startTime: matches.startTime,
        venue: matches.venue,
        round: matches.round,
        isFeatured: matches.isFeatured,
        viewersCount: matches.viewersCount,
        stats: matches.stats,
      })
      .from(matches)
      .innerJoin(leagues, eq(matches.leagueId, leagues.id))
      .innerJoin(teams, eq(matches.homeTeamId, teams.id))
      .innerJoin(sql`teams AS away_team`, sql`matches.away_team_id = away_team.id`)
      .where(eq(matches.id, id))
      .limit(1);

    if (matchRows.length === 0) {
      return reply.code(404).send({ error: "Match not found" });
    }

    const match = matchRows[0];

    // Fetch streams
    const streamRows = await db
      .select()
      .from(streams)
      .where(and(eq(streams.matchId, id), eq(streams.isWorking, true)))
      .orderBy(desc(streams.isDefault), streams.createdAt);

    // Fetch live events
    const eventRows = await db
      .select()
      .from(matchEvents)
      .where(eq(matchEvents.matchId, id))
      .orderBy(desc(matchEvents.minute), desc(matchEvents.createdAt));

    // Fetch lineups
    const lineupRows = await db.select().from(lineups).where(eq(lineups.matchId, id));

    const homeLineup = lineupRows.find((l) => l.teamId === match.homeTeamId);
    const awayLineup = lineupRows.find((l) => l.teamId === match.awayTeamId);

    return {
      match,
      streams: streamRows,
      events: eventRows,
      lineups: {
        home: homeLineup ?? null,
        away: awayLineup ?? null,
      },
    };
  });

  // POST /v1/matches: Create a match
  app.post("/v1/matches", async (req, reply) => {
    const schema = z.object({
      id: z.string(),
      sportId: z.string().default("football"),
      leagueId: z.string(),
      homeTeamId: z.string(),
      awayTeamId: z.string(),
      startTime: z.string(),
      venue: z.string().optional(),
      round: z.string().optional(),
      isFeatured: z.boolean().default(false),
      status: z.enum(["upcoming", "live", "ht", "finished", "postponed"]).default("upcoming"),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const data = parsed.data;
    const inserted = await db
      .insert(matches)
      .values({
        id: data.id,
        sportId: data.sportId,
        leagueId: data.leagueId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        startTime: new Date(data.startTime),
        venue: data.venue,
        round: data.round,
        isFeatured: data.isFeatured,
        status: data.status,
      })
      .returning();

    return reply.code(201).send({ match: inserted[0] });
  });

  // PATCH /v1/matches/:id: Live score, minute, status update
  app.patch("/v1/matches/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      homeScore: z.number().int().min(0).optional(),
      awayScore: z.number().int().min(0).optional(),
      minute: z.number().int().min(0).max(130).optional(),
      period: z.string().optional(),
      status: z.enum(["upcoming", "live", "ht", "finished", "postponed"]).optional(),
      viewersCount: z.number().int().min(0).optional(),
      stats: z.any().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const updated = await db
      .update(matches)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, id))
      .returning();

    if (updated.length === 0) {
      return reply.code(404).send({ error: "Match not found" });
    }

    return { match: updated[0] };
  });

  // POST /v1/matches/:id/events: Add live event (goal, card, substitution)
  app.post("/v1/matches/:id/events", async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      minute: z.number().int().min(0),
      type: z.enum(["goal", "yellow_card", "red_card", "sub", "penalty", "var"]),
      teamId: z.string().optional(),
      player: z.string().min(1),
      detail: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const event = await db
      .insert(matchEvents)
      .values({
        matchId: id,
        ...parsed.data,
      })
      .returning();

    return reply.code(201).send({ event: event[0] });
  });
}
