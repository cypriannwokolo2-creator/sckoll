import type { FastifyInstance } from "fastify";
import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { leagues, leagueStandings, teams } from "../db/schema.js";
import type { Env } from "../env.js";

export async function registerLeagueRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/leagues: List all leagues
  app.get("/v1/leagues", async (_req, reply) => {
    const list = await db.select().from(leagues).orderBy(leagues.displayOrder);
    return { leagues: list };
  });

  // GET /v1/leagues/:id/standings: Full standings table for a league
  app.get("/v1/leagues/:id/standings", async (req, reply) => {
    const { id } = req.params as { id: string };

    const table = await db
      .select({
        id: leagueStandings.id,
        leagueId: leagueStandings.leagueId,
        teamId: leagueStandings.teamId,
        teamName: teams.name,
        teamShort: teams.shortName,
        teamLogo: teams.logoUrl,
        rank: leagueStandings.rank,
        played: leagueStandings.played,
        won: leagueStandings.won,
        drawn: leagueStandings.drawn,
        lost: leagueStandings.lost,
        goalsFor: leagueStandings.goalsFor,
        goalsAgainst: leagueStandings.goalsAgainst,
        goalDiff: leagueStandings.goalDiff,
        points: leagueStandings.points,
        form: leagueStandings.form,
      })
      .from(leagueStandings)
      .innerJoin(teams, eq(leagueStandings.teamId, teams.id))
      .where(eq(leagueStandings.leagueId, id))
      .orderBy(asc(leagueStandings.rank));

    return { standings: table };
  });
}
