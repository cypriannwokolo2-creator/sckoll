import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSession } from "./use-session";

type SessionUser = { id: string; email: string; name: string | null; role: string; emailVerified: boolean };

const USER: SessionUser = {
  id: "u-1",
  email: "member@sckoll.com",
  name: "Member",
  role: "talent",
  emailVerified: true,
};

function stubSession(session: SessionUser | null) {
  const fn = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () =>
    session
      ? ({ ok: true, status: 200, json: async () => ({ ok: true, user: session, profile: null }) } as unknown as Response)
      : ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) } as unknown as Response),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSession", () => {
  it("starts in the loading state and resolves to signed-in", async () => {
    stubSession(USER);

    const { result } = renderHook(() => useSession());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("signed-in"));
    expect(result.current).toMatchObject({ user: { id: "u-1" } });
  });

  it("resolves to signed-out for an anonymous visitor", async () => {
    stubSession(null);

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.status).toBe("signed-out"));
  });

  it("treats a failed request as signed out so signing in stays possible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const { result } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.status).toBe("signed-out"));
  });

  it("shares one request between consumers on the same page", async () => {
    const fn = stubSession(USER);

    const first = renderHook(() => useSession());
    const second = renderHook(() => useSession());

    await waitFor(() => {
      expect(first.result.current.status).toBe("signed-in");
      expect(second.result.current.status).toBe("signed-in");
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
