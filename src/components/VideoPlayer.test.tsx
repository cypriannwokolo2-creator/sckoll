import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VideoPlayer } from "./VideoPlayer";
import type { StreamSource } from "@/lib/api";

const mockStreams: StreamSource[] = [
  {
    id: "edge-1",
    matchId: "m1",
    serverName: "CDN Alpha (Frankfurt)",
    quality: "1080p 60fps",
    language: "ENG",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    streamType: "hls",
    isDefault: true,
    isWorking: true,
  },
  {
    id: "edge-2",
    matchId: "m1",
    serverName: "CDN Beta (London)",
    quality: "720p 60fps",
    language: "ENG",
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    streamType: "hls",
    isDefault: false,
    isWorking: true,
  },
];

describe("VideoPlayer Broadcast Match Streamer", () => {
  it("renders live match title and CDN edge server list", () => {
    render(
      <VideoPlayer
        streams={mockStreams}
        matchTitle="Arsenal vs Manchester City"
        isLive={true}
        homeTeamId="arsenal"
        awayTeamId="man-city"
        homeTeamName="Arsenal"
        awayTeamName="Manchester City"
        homeTeamShort="ARS"
        awayTeamShort="MCI"
      />
    );

    expect(screen.getByText("Arsenal vs Manchester City")).toBeDefined();
    expect(screen.getByText(/LIVE STREAM/i)).toBeDefined();
    expect(screen.getByText("CDN Alpha (Frankfurt)")).toBeDefined();
    expect(screen.getByText("CDN Beta (London)")).toBeDefined();
    expect(screen.getByText("+ Custom Feed / URL")).toBeDefined();
  });

  it("opens custom stream input modal when clicking custom feed button", () => {
    render(
      <VideoPlayer
        streams={mockStreams}
        matchTitle="Real Madrid vs Barcelona"
        isLive={true}
      />
    );

    const customBtn = screen.getByText("+ Custom Feed / URL");
    fireEvent.click(customBtn);

    expect(screen.getByText("Add Custom Stream Feed")).toBeDefined();
    expect(screen.getByPlaceholderText(/https:\/\/example\.com\/live\/broadcast\.m3u8/i)).toBeDefined();
    expect(screen.getByText("Connect & Play Stream")).toBeDefined();
  });

  it("toggles diagnostics HUD overlay", () => {
    render(
      <VideoPlayer
        streams={mockStreams}
        matchTitle="Arsenal vs Manchester City"
        isLive={true}
      />
    );

    const statsBtn = screen.getByTitle("Diagnostics HUD (D)");
    fireEvent.click(statsBtn);

    expect(screen.getByText("Stream Diagnostics HUD")).toBeDefined();
    expect(screen.getByText("6,840 kbps (CBR)")).toBeDefined();
    expect(screen.getByText("edge-fra1.sckoll.com")).toBeDefined();
  });
});
