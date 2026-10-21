import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("landing page auth calls to action", () => {
  it("shows sign-in and sign-up to a visitor", async () => {
    stubSession(null);

    render(<Home />);

    expect(await screen.findByRole("link", { name: "Log in" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getAllByRole("link", { name: /Sign up free/ }).length).toBeGreaterThan(0);
  });

  it("replaces the sign-in prompts for a signed-in member", async () => {
    stubSession(MEMBER);

    render(<Home />);

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    });
    const workspace = screen.getAllByRole("link", { name: "Your workspace" });
    expect(workspace.length).toBeGreaterThan(0);
    expect(workspace[0]).toHaveAttribute("href", "/profile");
  });

  it("keeps a signed-in member off the sign-up pages entirely", async () => {
    stubSession(MEMBER);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Your workspace" }).length).toBeGreaterThan(0);
    });
    const signUpLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/sign-up"));
    expect(signUpLinks).toHaveLength(0);
  });

  it("still shows the sign-up links to a visitor", async () => {
    stubSession(null);

    render(<Home />);

    await screen.findByRole("link", { name: "Log in" });
    const signUpLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/sign-up"));
    expect(signUpLinks.length).toBeGreaterThan(0);
  });
});
