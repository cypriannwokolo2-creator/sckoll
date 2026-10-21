import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthNavActions from "./AuthNavActions";

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

describe("AuthNavActions", () => {
  it("offers sign-in and sign-up to a visitor", async () => {
    stubSession(null);

    render(<AuthNavActions />);

    expect(await screen.findByRole("link", { name: "Log in" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/sign-up");
  });

  it("offers the workspace to a signed-in member instead", async () => {
    stubSession(USER);

    render(<AuthNavActions />);

    const workspace = await screen.findByRole("link", { name: "Your workspace" });
    expect(workspace).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
  });

  it("honours a custom sign-up label and href", async () => {
    stubSession(null);

    render(<AuthNavActions signUpLabel="Sign up free" signUpHref="/sign-up?role=client" />);

    expect(await screen.findByRole("link", { name: "Sign up free" })).toHaveAttribute(
      "href",
      "/sign-up?role=client",
    );
  });

  it("keeps the custom link class on the workspace link", async () => {
    stubSession(USER);

    render(<AuthNavActions linkClassName="sckoll-login" />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Your workspace" })).toHaveClass("sckoll-login"),
    );
  });
});
