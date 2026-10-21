import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, api } from "./api";

/**
 * Contract test for the typed client: every `api.*` method must hit the documented
 * path with the documented verb. Rename a route on the server without updating the
 * client and this fails.
 */

type Case = { key: keyof typeof api; args: readonly unknown[]; path: string; verb: string };

const CASES: Case[] = [
  { key: "config", args: [], path: "/v1/auth/config", verb: "GET" },
  { key: "signup", args: [{ email: "a@b.com", name: "A", password: "longenough1", role: "talent" }], path: "/v1/auth/signup", verb: "POST" },
  { key: "login", args: [{ email: "a@b.com", password: "longenough1" }], path: "/v1/auth/login", verb: "POST" },
  { key: "logout", args: [], path: "/v1/auth/logout", verb: "POST" },
  { key: "me", args: [], path: "/v1/me", verb: "GET" },
  { key: "verify", args: [{ token: "tok", email: "a@b.com" }], path: "/v1/auth/verify", verb: "POST" },
  { key: "resend", args: ["a@b.com"], path: "/v1/auth/resend", verb: "POST" },
  { key: "forgot", args: ["a@b.com"], path: "/v1/auth/forgot", verb: "POST" },
  { key: "reset", args: [{ token: "tok", email: "a@b.com", password: "longenough1" }], path: "/v1/auth/reset", verb: "POST" },
  { key: "patchProfile", args: [{ headline: "Designer" }], path: "/v1/profiles/me", verb: "PATCH" },
  { key: "contact", args: [{ name: "A", email: "a@b.com", topic: "hi", message: "hello" }], path: "/v1/contact", verb: "POST" },
  { key: "opportunities", args: [{ q: "react" }], path: "/v1/opportunities?q=react", verb: "GET" },
  { key: "opportunity", args: ["o1"], path: "/v1/opportunities/o1", verb: "GET" },
  {
    key: "postOpportunity",
    args: [{ category: "development-it", type: "project", title: "T", description: "D", skills: ["react"], rateType: "fixed", remote: true }],
    path: "/v1/opportunities",
    verb: "POST",
  },
  { key: "closeOpportunity", args: ["o1"], path: "/v1/opportunities/o1", verb: "DELETE" },
  { key: "updateOpportunity", args: ["o1", { title: "New title" }], path: "/v1/opportunities/o1", verb: "PATCH" },
  { key: "categories", args: [], path: "/v1/categories", verb: "GET" },
  { key: "talentSearch", args: [{ q: "react", skills: "react" }], path: "/v1/talent/search?q=react&skills=react", verb: "GET" },
  { key: "apply", args: ["o1", { pitch: "Hi" }], path: "/v1/opportunities/o1/apply", verb: "POST" },
  { key: "withdrawApplication", args: ["a1"], path: "/v1/applications/a1", verb: "DELETE" },
  { key: "pipeline", args: [], path: "/v1/pipeline/me", verb: "GET" },
  { key: "oppApplications", args: ["o1"], path: "/v1/opportunities/o1/applications", verb: "GET" },
  { key: "setApplicationStatus", args: ["a1", "shortlisted"], path: "/v1/applications/a1", verb: "PATCH" },
  { key: "savedSearches", args: [], path: "/v1/saved-searches", verb: "GET" },
  { key: "createSavedSearch", args: [{ query: "react" }], path: "/v1/saved-searches", verb: "POST" },
  { key: "deleteSavedSearch", args: ["s1"], path: "/v1/saved-searches/s1", verb: "DELETE" },
  { key: "publicProfile", args: ["u1"], path: "/v1/profiles/u1", verb: "GET" },
  { key: "shortlists", args: [], path: "/v1/shortlists", verb: "GET" },
  { key: "addShortlist", args: [{ talentId: "u1" }], path: "/v1/shortlists", verb: "POST" },
  { key: "patchShortlist", args: ["sl1", { notes: "n" }], path: "/v1/shortlists/sl1", verb: "PATCH" },
  { key: "removeShortlist", args: ["sl1"], path: "/v1/shortlists/sl1", verb: "DELETE" },
  { key: "notifications", args: [], path: "/v1/notifications?limit=20&offset=0", verb: "GET" },
  { key: "markNotificationsRead", args: [["n1"]], path: "/v1/notifications/read", verb: "POST" },
  { key: "notificationPrefs", args: [], path: "/v1/notifications/prefs", verb: "GET" },
  { key: "patchNotificationPrefs", args: [{ emailEnabled: false }], path: "/v1/notifications/prefs", verb: "PATCH" },
  { key: "runDigest", args: [], path: "/v1/notifications/digest-run", verb: "POST" },
  { key: "myContracts", args: [], path: "/v1/contracts/me", verb: "GET" },
  { key: "contractDetail", args: ["c1"], path: "/v1/contracts/c1", verb: "GET" },
  { key: "createContract", args: ["a1", "Scope of work"], path: "/v1/contracts", verb: "POST" },
  { key: "patchContract", args: ["c1", { status: "active" }], path: "/v1/contracts/c1", verb: "PATCH" },
  { key: "addMilestone", args: ["c1", { title: "M1", amount: 500 }], path: "/v1/contracts/c1/milestones", verb: "POST" },
  { key: "patchMilestone", args: ["m1", "approved"], path: "/v1/milestones/m1", verb: "PATCH" },
  { key: "contractMessages", args: ["c1"], path: "/v1/contracts/c1/messages", verb: "GET" },
  { key: "sendContractMessage", args: ["c1", "hello"], path: "/v1/contracts/c1/messages", verb: "POST" },
  { key: "markMessagesRead", args: ["c1"], path: "/v1/contracts/c1/messages/read", verb: "POST" },
  { key: "postReview", args: [{ contractId: "c1", stars: 5, text: "great" }], path: "/v1/reviews", verb: "POST" },
  { key: "flagContract", args: ["c1", "scope creep"], path: "/v1/contracts/c1/flag", verb: "POST" },
  { key: "fundMilestone", args: ["m1"], path: "/v1/milestones/m1/fund", verb: "POST" },
  { key: "releaseMilestone", args: ["m1"], path: "/v1/milestones/m1/release", verb: "POST" },
  { key: "contractPayments", args: ["c1"], path: "/v1/contracts/c1/payments", verb: "GET" },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client contract", () => {
  it("covers every exported endpoint", () => {
    expect(CASES.map((c) => c.key).sort()).toEqual(Object.keys(api).sort());
  });

  it.each(CASES)("$key → $verb $path", async ({ key, args, path, verb }) => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })) as unknown as ReturnType<typeof vi.fn>;
    vi.stubGlobal("fetch", fetchMock);

    await (api[key] as unknown as (...a: unknown[]) => Promise<unknown>)(...args);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(`${API_URL}${path}`);
    expect(init?.method ?? "GET").toBe(verb);
    if (init?.body != null) expect(() => JSON.parse(String(init.body))).not.toThrow();
  });
});
