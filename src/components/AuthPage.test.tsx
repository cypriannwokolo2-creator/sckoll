import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthPage from "./AuthPage";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string | { pathname?: string }; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : (href?.pathname ?? "#")} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/script", () => ({ default: () => null }));

function stubFetch(body: unknown, status = 200) {
  const fn = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response,
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  pushMock.mockReset();
});

describe("AuthPage (sign-in)", () => {
  it("renders the sign-in form with validation wired on the inputs", () => {
    render(<AuthPage mode="sign-in" />);

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeRequired();
    const password = screen.getByPlaceholderText("At least 8 characters");
    expect(password).toBeRequired();
    expect(password).toHaveAttribute("minlength", "8");
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("surfaces the server's rejection and does not navigate", async () => {
    const user = userEvent.setup();
    stubFetch({ error: "invalid_credentials", message: "Email or password is wrong." }, 401);

    render(<AuthPage mode="sign-in" />);
    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "wrongpass1");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText("Email or password is wrong.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to the workspace after a successful login", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch({ ok: true, user: { id: "u1" } });

    render(<AuthPage mode="sign-in" />);
    await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "correct-horse");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/profile"));
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body ?? "{}"));
    expect(body).toEqual({ email: "a@b.com", password: "correct-horse" });
  });
});

describe("AuthPage (sign-up)", () => {
  it("shows the role switch and terms consent", () => {
    render(<AuthPage mode="sign-up" />);

    expect(screen.getByRole("heading", { name: "Join Sckoll" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "I want to find work" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "I want to hire" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your name")).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("sends the chosen role to the signup endpoint", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch({ ok: true, user: { id: "u2" } });

    render(<AuthPage mode="sign-up" />);
    await user.click(screen.getByRole("tab", { name: "I want to hire" }));
    await user.type(screen.getByPlaceholderText("you@example.com"), "new@client.com");
    await user.type(screen.getByPlaceholderText("Your name"), "New Client");
    await user.type(screen.getByPlaceholderText("At least 8 characters"), "brand-new-pass");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/profile/setup"));
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/v1/auth/signup");
    expect(JSON.parse(String(init?.body))).toMatchObject({ role: "client", email: "new@client.com", name: "New Client" });
  });
});
