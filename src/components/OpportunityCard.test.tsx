import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type MatchScore, type Opportunity } from "@/lib/api";
import OpportunityCard from "./OpportunityCard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string | { pathname?: string }; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

const OPP: Opportunity & MatchScore = {
  id: "00000000-0000-0000-0000-000000000001",
  clientId: "client-1",
  category: "development-it",
  type: "project",
  title: "Build a design system for a fintech",
  description: "We need a complete token and component library.",
  skills: ["react", "typescript"],
  budgetMin: 1200,
  budgetMax: 2000,
  rateType: "fixed",
  location: null,
  remote: true,
  status: "open",
  createdAt: "2026-10-17T10:00:00.000Z",
  updatedAt: "2026-10-17T11:00:00.000Z",
  fit: 92,
  fitRules: 70,
  fitVector: 95,
  reasons: ["react", "typescript"],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpportunityCard", () => {
  it("renders type, category, budget and remote flag", () => {
    render(<OpportunityCard opp={OPP} viewerSkills={[]} />);

    expect(screen.getByRole("heading", { name: OPP.title })).toBeInTheDocument();
    expect(screen.getByText(/PROJECT · DEVELOPMENT IT/)).toBeInTheDocument();
    expect(screen.getByText(/Fixed price · \$1,200–\$2,000/)).toBeInTheDocument();
    expect(screen.getByText(/Remote/)).toBeInTheDocument();
  });

  it("shows the fit badge only when the viewer has skills", () => {
    const { unmount } = render(<OpportunityCard opp={OPP} viewerSkills={["react"]} />);
    expect(screen.getByText(/75% FIT/)).toBeInTheDocument();
    unmount();

    render(<OpportunityCard opp={OPP} viewerSkills={[]} />);
    expect(screen.queryByText(/% FIT/)).not.toBeInTheDocument();
  });

  it("surfaces the ranking reasons", () => {
    render(<OpportunityCard opp={OPP} viewerSkills={[]} />);
    expect(screen.getByText(/Why: react · typescript/)).toBeInTheDocument();
  });

  it("emits a click match event with the ranking scores", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () =>
      ({ ok: true, status: 200, json: async () => ({ ok: true }) }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<OpportunityCard opp={OPP} viewerSkills={[]} />);
    await user.click(screen.getByRole("link", { name: "View details" }));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const eventCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/v1/match-events"));
    expect(eventCall).toBeDefined();
    expect(JSON.parse(String(eventCall![1]?.body))).toEqual({
      eventType: "click",
      targetType: "opportunity",
      targetId: OPP.id,
      scoreRules: 70,
      scoreVector: 95,
      finalScore: 92,
    });
    await waitFor(() => expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", `/find-work/${OPP.id}`));
  });
});
