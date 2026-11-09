import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchCard } from "./MatchCard";

const testMatch = {
  id: "rma-bar-live",
  sportId: "football",
  leagueId: "la-liga",
  leagueName: "La Liga",
  leagueCountry: "Spain",
  leagueLogo: null,
  homeTeamId: "real-madrid",
  homeTeamName: "Real Madrid CF",
  homeTeamShort: "RMA",
  homeTeamLogo: null,
  awayTeamId: "barcelona",
  awayTeamName: "FC Barcelona",
  awayTeamShort: "BAR",
  awayTeamLogo: null,
  status: "live" as const,
  minute: 34,
  period: "1st Half",
  homeScore: 1,
  awayScore: 1,
  startTime: new Date().toISOString(),
  venue: "Santiago Bernabéu",
  round: "El Clásico",
  isFeatured: true,
  viewersCount: 114000,
};

describe("MatchCard Component", () => {
  it("renders match details, team names, and live scores", () => {
    render(<MatchCard match={testMatch} />);

    expect(screen.getByText("Real Madrid CF")).toBeInTheDocument();
    expect(screen.getByText("FC Barcelona")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBe(2);
    expect(screen.getByText(/34'/)).toBeInTheDocument();
    expect(screen.getByText("Watch Live")).toBeInTheDocument();
  });
});
