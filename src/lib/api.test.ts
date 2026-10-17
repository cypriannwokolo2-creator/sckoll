import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, api, budgetLabel, fitEstimate, trackMatchEvent } from "./api";

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function stubFetch(impl: (...args: FetchArgs) => Response | Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("budgetLabel", () => {
  it("labels a fixed range", () => {
    expect(budgetLabel({ budgetMin: 1200, budgetMax: 2000, rateType: "fixed" })).toBe("Fixed price · $1,200–$2,000");
  });

  it("labels an hourly range with /hr", () => {
    expect(budgetLabel({ budgetMin: 35, budgetMax: 55, rateType: "hourly" })).toBe("Hourly · $35–$55/hr");
  });

  it("labels salary ranges without /hr", () => {
    expect(budgetLabel({ budgetMin: 90000, budgetMax: 120000, rateType: "salary" })).toBe("Salary · $90,000–$120,000");
  });

  it("falls back to a single bound", () => {
    expect(budgetLabel({ budgetMin: 90000, budgetMax: null, rateType: "salary" })).toBe("Budget · $90,000");
    expect(budgetLabel({ budgetMin: null, budgetMax: 60, rateType: "hourly" })).toBe("Budget · $60/hr");
  });

  it("falls back sensibly when no budget is set", () => {
    expect(budgetLabel({ budgetMin: null, budgetMax: null, rateType: "fixed" })).toBe("Fixed price · On request");
    expect(budgetLabel({ budgetMin: null, budgetMax: null, rateType: "hourly" })).toBe("Hourly · Rate on request");
    expect(budgetLabel({ budgetMin: null, budgetMax: null, rateType: "salary" })).toBe("Full-time · Salary");
  });
});

describe("fitEstimate", () => {
  it("returns null when either side has no skills", () => {
    expect(fitEstimate([], ["react"])).toBeNull();
    expect(fitEstimate(["react"], [])).toBeNull();
    expect(fitEstimate([], [])).toBeNull();
  });

  it("rewards full overlap with the ceiling score", () => {
    expect(fitEstimate(["react"], ["react"])).toBe(99);
  });

  it("scales partial overlap and matches on substrings", () => {
    expect(fitEstimate(["react"], ["react", "typescript"])).toBe(75);
    expect(fitEstimate(["react"], ["react-native", "typescript"])).toBe(75);
  });

  it("ignores case", () => {
    expect(fitEstimate(["React"], ["react"])).toBe(99);
  });
});

describe("request", () => {
  it("returns the parsed payload and sends credentials + json headers", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true, user: { id: "u1" } }));
    const res = await api.login({ email: "a@b.com", password: "secret123" });

    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API_URL}/v1/auth/login`);
    expect(init?.credentials).toBe("include");
    expect((init?.headers as Record<string, string>)["content-type"]).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({ email: "a@b.com", password: "secret123" });
  });

  it("maps error responses to ApiError with the server's message", async () => {
    stubFetch(() => jsonResponse({ error: "invalid_credentials", message: "Email or password is wrong." }, 401));

    const err = await api.login({ email: "a@b.com", password: "wrong" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 401, code: "invalid_credentials", message: "Email or password is wrong." });
  });

  it("uses a fallback message when the body carries none", async () => {
    stubFetch(() => jsonResponse({}, 500));
    const err = (await api.me().catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(500);
    expect(err.message).toBe("Something went wrong.");
  });

  it("survives a non-JSON error body", async () => {
    stubFetch(() =>
      ({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("not json");
        },
      }) as unknown as Response,
    );
    const err = (await api.me().catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.message).toBe("Something went wrong.");
  });
});

describe("api.opportunities", () => {
  it("builds the query string and drops empty filters", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true, opportunities: [], nextCursor: null }));
    await api.opportunities({ q: "react", type: "", category: "engineering", limit: "12" });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API_URL}/v1/opportunities?q=react&category=engineering&limit=12`);
  });

  it("omits the query string when there are no filters", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true, opportunities: [], nextCursor: null }));
    await api.opportunities();
    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API_URL}/v1/opportunities`);
  });
});

describe("trackMatchEvent", () => {
  it("posts the event with keepalive and omits a null vector", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));

    trackMatchEvent({
      eventType: "click",
      targetType: "opportunity",
      targetId: "opp-1",
      scoreRules: 70,
      scoreVector: null,
      finalScore: 74,
    });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API_URL}/v1/match-events`);
    expect(init?.method).toBe("POST");
    expect(init?.keepalive).toBe(true);
    expect(init?.credentials).toBe("include");
    expect(JSON.parse(String(init?.body))).toEqual({
      eventType: "click",
      targetType: "opportunity",
      targetId: "opp-1",
      scoreRules: 70,
      finalScore: 74,
    });
  });

  it("includes scoreVector when present", async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));
    trackMatchEvent({ eventType: "view", targetType: "talent", targetId: "u9", scoreVector: 81, finalScore: 79 });

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]?.body));
    expect(body.scoreVector).toBe(81);
  });

  it("never throws or leaves an unhandled rejection when the network fails", async () => {
    stubFetch(() => Promise.reject(new Error("offline")));

    expect(() => trackMatchEvent({ eventType: "view", targetType: "opportunity", targetId: "x" })).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
});
