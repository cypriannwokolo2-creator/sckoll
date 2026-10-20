import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileSetupForm from "./setup-form";

const { pushMock, meMock, patchProfileMock, routerMock } = vi.hoisted(() => {
  const pushMock = vi.fn();
  return {
    pushMock,
    meMock: vi.fn(),
    patchProfileMock: vi.fn(),
    routerMock: { push: pushMock, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string | { pathname?: string }; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : (href?.pathname ?? "#")} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  api: { me: meMock, patchProfile: patchProfileMock },
}));

function talentMe(emailVerified = false) {
  return { user: { id: "u1", role: "talent", emailVerified }, profile: { skills: ["react"] } };
}

beforeEach(() => {
  vi.clearAllMocks();
  meMock.mockResolvedValue(talentMe());
});

describe("ProfileSetupForm (talent quick start)", () => {
  it("shows only the three quick-start fields — no bio, payout or role re-ask", async () => {
    render(<ProfileSetupForm />);

    expect(await screen.findByPlaceholderText("Senior backend engineer")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add a skill…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Remote / Lagos / London")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /skip for now/i })).toHaveAttribute("href", "/find-work");

    // The old 14-field wall must not come back.
    expect(screen.queryByPlaceholderText(/bank/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/payout/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/bio/i)).not.toBeInTheDocument();
  });

  it("surfaces the email-verification notice for unverified users", async () => {
    render(<ProfileSetupForm />);
    expect(await screen.findByText(/check your email for a confirmation link/i)).toBeInTheDocument();
  });

  it("saves headline, skills chips and location, then lands on the feed", async () => {
    const user = userEvent.setup();
    meMock.mockResolvedValue({ user: { id: "u1", role: "talent", emailVerified: true }, profile: { skills: ["react"] } });
    patchProfileMock.mockResolvedValue({ ok: true, profile: {} });
    render(<ProfileSetupForm />);
    await screen.findByPlaceholderText("Senior backend engineer");

    await user.type(screen.getByPlaceholderText("Senior backend engineer"), "Senior backend engineer");
    const chipsInput = screen.getByPlaceholderText("Add a skill…");
    await user.type(chipsInput, "postgres");
    await user.keyboard("{Enter}");
    await user.type(chipsInput, "go, kafka");
    await user.keyboard("{Enter}");
    await user.type(screen.getByPlaceholderText("Remote / Lagos / London"), "Lagos");
    await user.click(screen.getByRole("button", { name: /start matching/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/find-work"));
    expect(patchProfileMock).toHaveBeenCalledWith({
      role: "talent",
      headline: "Senior backend engineer",
      location: "Lagos",
      skills: ["react", "postgres", "go", "kafka"],
    });
  });

  it("skipping never touches the profile (it is a plain link to the feed)", async () => {
    const user = userEvent.setup();
    render(<ProfileSetupForm />);
    await screen.findByPlaceholderText("Senior backend engineer");

    const skip = screen.getByRole("link", { name: /skip for now/i });
    expect(skip).toHaveAttribute("href", "/find-work");
    await user.click(skip);
    expect(patchProfileMock).not.toHaveBeenCalled();
  });

  it("keeps the user on the form when saving fails", async () => {
    const user = userEvent.setup();
    patchProfileMock.mockRejectedValue(new Error("boom"));
    render(<ProfileSetupForm />);
    await screen.findByPlaceholderText("Senior backend engineer");

    await user.click(screen.getByRole("button", { name: /start matching/i }));
    expect(await screen.findByText("Could not save your profile.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("redirects to sign-in when the session is gone", async () => {
    meMock.mockRejectedValue(new Error("unauthorized"));
    render(<ProfileSetupForm />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/sign-in"));
  });

  it("prefills existing headline and location on repeat visits", async () => {
    meMock.mockResolvedValue({
      user: { id: "u1", role: "talent", emailVerified: true },
      profile: { skills: ["react"], headline: "Staff engineer", location: "Accra" },
    });
    render(<ProfileSetupForm />);
    expect(await screen.findByDisplayValue("Staff engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Accra")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
  });
});

describe("ProfileSetupForm (client)", () => {
  it("shows next-step CTAs instead of the profile form", async () => {
    meMock.mockResolvedValue({
      user: { id: "c1", role: "client", emailVerified: true },
      profile: { skills: [] },
    });
    render(<ProfileSetupForm />);

    expect(await screen.findByRole("link", { name: /post your first project/i })).toHaveAttribute("href", "/post-project");
    expect(screen.getByRole("link", { name: /go to my workspace/i })).toHaveAttribute("href", "/profile");
    expect(screen.queryByPlaceholderText("Senior backend engineer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start matching/i })).not.toBeInTheDocument();
  });
});
