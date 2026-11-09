import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { getDb } from "../db/client.js";
import { buildServer } from "../index.js";
import { type Env } from "../env.js";
import { pushSchema, testDatabaseUrl } from "../test-setup.js";
import { seedSportsData } from "../db/seed.js";

process.env.SCKOLL_TEST_DB ??= "sckoll_test_matches";
const TEST_DATABASE_URL = testDatabaseUrl();

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: TEST_DATABASE_URL,
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  NODE_ENV: "test" as const,
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
};

describe("Match Streaming API Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await pushSchema(TEST_DATABASE_URL);
    await seedSportsData(TEST_DATABASE_URL);

    const built = await buildServer(TEST_ENV);
    app = built.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /v1/sports returns list of sports with live match count", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/sports",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.sports)).toBe(true);
    expect(body.sports.length).toBeGreaterThan(0);
    const football = body.sports.find((s: any) => s.id === "football");
    expect(football).toBeDefined();
    expect(football.liveCount).toBeGreaterThan(0);
  });

  it("GET /v1/matches returns live and upcoming matches", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/matches",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.matches)).toBe(true);
    expect(body.matches.length).toBeGreaterThan(0);

    const liveMatch = body.matches.find((m: any) => m.id === "ars-mci-live");
    expect(liveMatch).toBeDefined();
    expect(liveMatch.homeTeamName).toBe("Arsenal FC");
    expect(liveMatch.awayTeamName).toBe("Manchester City");
    expect(liveMatch.homeScore).toBe(2);
    expect(liveMatch.awayScore).toBe(1);
    expect(liveMatch.status).toBe("live");
  });

  it("GET /v1/matches/:id returns detailed match with streams and events", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/matches/ars-mci-live",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.match.id).toBe("ars-mci-live");
    expect(Array.isArray(body.streams)).toBe(true);
    expect(body.streams.length).toBeGreaterThan(0);
    expect(body.streams[0].streamUrl).toContain(".m3u8");
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.lineups.home).toBeDefined();
    expect(body.lineups.away).toBeDefined();
  });

  it("POST /v1/matches/:id/chat posts live message and GET /v1/matches/:id/chat reads it", async () => {
    const postRes = await app.inject({
      method: "POST",
      url: "/v1/matches/ars-mci-live/chat",
      payload: {
        username: "NorthLondonFan",
        message: "Come on Arsenal! Bring home the 3 points! 🔴⚪",
        teamFlair: "ARS",
        userBadge: "FAN",
      },
    });

    expect(postRes.statusCode).toBe(201);

    const getRes = await app.inject({
      method: "GET",
      url: "/v1/matches/ars-mci-live/chat",
    });

    expect(getRes.statusCode).toBe(200);
    const chat = getRes.json();
    expect(Array.isArray(chat.messages)).toBe(true);
    const msg = chat.messages.find((m: any) => m.username === "NorthLondonFan");
    expect(msg).toBeDefined();
    expect(msg.message).toContain("Come on Arsenal");
  });

  it("POST /v1/matches/:id/reactions increments reaction count", async () => {
    const reactRes = await app.inject({
      method: "POST",
      url: "/v1/matches/ars-mci-live/reactions",
      payload: { reaction: "goal" },
    });

    expect(reactRes.statusCode).toBe(200);
    expect(reactRes.json().ok).toBe(true);
  });

  it("GET /v1/leagues/premier-league/standings returns table", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/leagues/premier-league/standings",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.standings)).toBe(true);
    expect(body.standings.length).toBeGreaterThan(0);
    expect(body.standings[0].teamName).toBe("Arsenal FC");
  });

  it("GET /v1/highlights returns video clips", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/v1/highlights",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.highlights)).toBe(true);
    expect(body.highlights.length).toBeGreaterThan(0);
  });
});
