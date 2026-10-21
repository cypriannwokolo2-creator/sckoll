import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthCta from "./AuthCta";

type SessionUser = { id: string; email: string; name: string | null; role: string; emailVerified: boolean };

function user(role: string): SessionUser {
  return { id: "u-1", email: "member@sckoll.com", name: "Member", role, emailVerified: true };
}

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

describe("AuthCta", () => {
  it("points a visitor at the sign-up pitch", async () => {
    stubSession(null);

    render(<AuthCta href="/sign-up" label="Create your free profile" className="cta" />);

    const link = await screen.findByRole("link", { name: /Create your free profile/ });
    expect(link).toHaveAttribute("href", "/sign-up");
    expect(link).toHaveClass("cta");
  });

  it("sends a signed-in member to their workspace", async () => {
    stubSession(user("talent"));

    render(<AuthCta href="/sign-up" label="Create your free profile" />);

    const link = await screen.findByRole("link", { name: /Open your workspace/ });
    expect(link).toHaveAttribute("href", "/profile");
  });

  it("sends a signed-in client who was pitched hiring to post a project", async () => {
    stubSession(user("client"));

    render(<AuthCta href="/sign-up?role=client" label="Start a talent search" />);

    const link = await screen.findByRole("link", { name: /Post your first project/ });
    expect(link).toHaveAttribute("href", "/post-project");
  });

  it("keeps a signed-in talent away from the hiring pitch", async () => {
    stubSession(user("talent"));

    render(<AuthCta href="/sign-up?role=client" label="Start a talent search" />);

    const link = await screen.findByRole("link", { name: /Open your workspace/ });
    expect(link).toHaveAttribute("href", "/profile");
  });

  it("honours an explicit signed-in target", async () => {
    stubSession(user("talent"));

    render(
      <AuthCta
        href="/sign-up"
        label="Become an early story"
        signedInHref="/post-project"
        signedInLabel="Start your first project"
      />,
    );

    const link = await screen.findByRole("link", { name: /Start your first project/ });
    expect(link).toHaveAttribute("href", "/post-project");
  });

  it("renders children after the label", async () => {
    stubSession(null);

    render(
      <AuthCta href="/sign-up" label="Sign up" className="cta">
        <span>↗</span>
      </AuthCta>,
    );

    const link = await screen.findByRole("link", { name: /Sign up/ });
    expect(link.textContent).toContain("↗");
  });
});
