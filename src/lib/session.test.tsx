import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./session";

type SessionUser = { id: string; email: string; name: string | null; role: string; emailVerified: boolean };

const MEMBER: SessionUser = {
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

function Probe() {
  const session = useSession();
  return (
    <div>
      <span data-testid="status">{session.status}</span>
      <span data-testid="settled">{session.settled ?? "none"}</span>
      <button type="button" onClick={() => session.refresh()}>
        refresh
      </button>
    </div>
  );
}

function renderProbe() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SessionProvider", () => {
  it("resolves a member and records that they were one", async () => {
    stubSession(MEMBER);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-in"));
    expect(screen.getByTestId("settled")).toHaveTextContent("member");
  });

  it("resolves a visitor", async () => {
    stubSession(null);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
    expect(screen.getByTestId("settled")).toHaveTextContent("visitor");
  });

  it("treats a failed check as a visitor, so signing in stays possible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
  });

  it("keeps the first verdict when the session changes later", async () => {
    stubSession(MEMBER);
    const view = renderProbe();

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-in"));

    // Sign out: the live state changes, but the "settled" verdict stays.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: "unauthorized" }) } as unknown as Response)),
    );
    await act(async () => {
      screen.getByRole("button", { name: "refresh" }).click();
    });

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
    expect(screen.getByTestId("settled")).toHaveTextContent("member");
    view.unmount();
  });

  it("ignores a response that was already on its way when the session changed", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const fn = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(async () => {
      await gate;
      return { ok: true, status: 200, json: async () => ({ ok: true, user: MEMBER, profile: null }) } as unknown as Response;
    });
    vi.stubGlobal("fetch", fn);

    renderProbe();

    // The session changes while the first check is still in flight.
    await act(async () => {
      screen.getByRole("button", { name: "refresh" }).click();
    });
    release?.();

    // The stale response must not revive the session.
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("loading"));
    expect(screen.getByTestId("settled")).toHaveTextContent("none");
  });
});
