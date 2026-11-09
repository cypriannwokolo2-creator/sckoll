import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSports,
  fetchMatches,
  fetchMatch,
  fetchChat,
  postChatMessage,
  postReaction,
  fetchLeagues,
  fetchStandings,
  fetchHighlights,
} from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Match Streaming API Client", () => {
  it("fetchSports parses sports list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      sports: [{ id: "football", name: "Football", slug: "football", icon: "⚽", displayOrder: 1, liveCount: 3 }]
    })));

    const sports = await fetchSports();
    expect(sports.length).toBe(1);
    expect(sports[0].id).toBe("football");
    expect(sports[0].liveCount).toBe(3);
  });

  it("fetchMatches passes query parameters and returns matches", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      matches: [{ id: "ars-mci-live", homeTeamName: "Arsenal", awayTeamName: "Man City", status: "live" }]
    }));
    vi.stubGlobal("fetch", fetchMock);

    const matches = await fetchMatches({ sport: "football", status: "live" });
    expect(matches.length).toBe(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("sport=football"),
      expect.anything()
    );
  });

  it("fetchMatch returns match with streams and lineups", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      match: { id: "ars-mci-live", homeTeamName: "Arsenal" },
      streams: [{ id: "s-1", serverName: "Server 1", streamType: "hls" }],
      events: [],
      lineups: { home: null, away: null },
    })));

    const res = await fetchMatch("ars-mci-live");
    expect(res).not.toBeNull();
    expect(res?.match.id).toBe("ars-mci-live");
    expect(res?.streams.length).toBe(1);
  });

  it("postChatMessage sends payload and returns created message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      message: { id: "m-1", username: "Fan1", message: "Goal!", userBadge: "FAN" }
    })));

    const msg = await postChatMessage("ars-mci-live", {
      username: "Fan1",
      message: "Goal!",
      userBadge: "FAN",
    });

    expect(msg).not.toBeNull();
    expect(msg?.username).toBe("Fan1");
  });

  it("postReaction posts reaction type", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: true })));

    const ok = await postReaction("ars-mci-live", "goal");
    expect(ok).toBe(true);
  });

  it("fetchStandings returns league standings table", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      standings: [{ teamName: "Arsenal", rank: 1, points: 35 }]
    })));

    const table = await fetchStandings("premier-league");
    expect(table.length).toBe(1);
    expect(table[0].teamName).toBe("Arsenal");
  });
});
