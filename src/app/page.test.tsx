import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch for matches and highlights
const mockMatches = [
  {
    id: "ars-mci-live",
    sportId: "football",
    leagueId: "premier-league",
    leagueName: "Premier League",
    homeTeamName: "Arsenal FC",
    homeTeamShort: "ARS",
    awayTeamName: "Manchester City",
    awayTeamShort: "MCI",
    status: "live",
    minute: 68,
    period: "2nd Half",
    homeScore: 2,
    awayScore: 1,
    startTime: new Date().toISOString(),
    venue: "Emirates Stadium",
    isFeatured: true,
    viewersCount: 78000,
  },
];

vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string) => {
    if (url.includes("/v1/matches")) {
      return {
        ok: true,
        json: async () => ({ matches: mockMatches }),
      };
    }
    if (url.includes("/v1/highlights")) {
      return {
        ok: true,
        json: async () => ({ highlights: [] }),
      };
    }
    return {
      ok: true,
      json: async () => ({ ok: true }),
    };
  })
);

describe("Match Streaming Homepage", () => {
  it("renders Sckoll streaming header and brand", async () => {
    render(<HomePage />);

    expect(screen.getAllByText("SCKOLL").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LIVE").length).toBeGreaterThan(0);
    expect(screen.getByText("Live Matches")).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Standings")).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
  });

  it("renders the sports navigation filter pills", async () => {
    render(<HomePage />);

    expect(screen.getByText("All Sports")).toBeInTheDocument();
    expect(screen.getByText("Football")).toBeInTheDocument();
    expect(screen.getByText("Basketball")).toBeInTheDocument();
  });

  it("renders live match schedule and status tabs", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/All Matches/)).toBeInTheDocument();
      expect(screen.getByText(/Live Now/)).toBeInTheDocument();
    });
  });
});
