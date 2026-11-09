import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  sports,
  leagues,
  teams,
  matches,
  streams,
  matchEvents,
  lineups,
  chatMessages,
  chatReactions,
  highlights,
  leagueStandings,
} from "./schema.js";

export async function seedSportsData(targetDbUrl?: string) {
  const url = targetDbUrl ?? process.env.DATABASE_URL ?? "postgres://sckoll:sAqF-s0HvcYb2xU8g3Uhxw7sApHCLezp@localhost:5435/sckoll";
  const p = new Pool({ connectionString: url });
  const db = drizzle(p);
  console.log("🌱 Seeding Sports, Leagues, Teams, Matches, Streams, Lineups, and Standings...");

  // 1. SPORTS
  const sportsData = [
    { id: "football", name: "Football / Soccer", slug: "football", icon: "⚽", displayOrder: 1 },
    { id: "basketball", name: "Basketball", slug: "basketball", icon: "🏀", displayOrder: 2 },
    { id: "tennis", name: "Tennis", slug: "tennis", icon: "🎾", displayOrder: 3 },
    { id: "mma", name: "Combat Sports / UFC", slug: "mma", icon: "🥊", displayOrder: 4 },
    { id: "motorsport", name: "Motorsport / F1", slug: "motorsport", icon: "🏎️", displayOrder: 5 },
    { id: "american-football", name: "American Football / NFL", slug: "nfl", icon: "🏈", displayOrder: 6 },
  ];

  for (const s of sportsData) {
    await db.insert(sports).values(s).onConflictDoUpdate({ target: sports.id, set: s });
  }

  // 2. LEAGUES
  const leaguesData = [
    {
      id: "premier-league",
      sportId: "football",
      name: "Premier League",
      shortName: "EPL",
      country: "England",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 1,
    },
    {
      id: "champions-league",
      sportId: "football",
      name: "UEFA Champions League",
      shortName: "UCL",
      country: "Europe",
      logoUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 2,
    },
    {
      id: "la-liga",
      sportId: "football",
      name: "La Liga",
      shortName: "ESP",
      country: "Spain",
      logoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 3,
    },
    {
      id: "serie-a",
      sportId: "football",
      name: "Serie A",
      shortName: "ITA",
      country: "Italy",
      logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 4,
    },
    {
      id: "bundesliga",
      sportId: "football",
      name: "Bundesliga",
      shortName: "GER",
      country: "Germany",
      logoUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 5,
    },
    {
      id: "nba",
      sportId: "basketball",
      name: "NBA",
      shortName: "NBA",
      country: "USA",
      logoUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=128&auto=format&fit=crop&q=80",
      season: "2026/27",
      displayOrder: 6,
    },
    {
      id: "ufc",
      sportId: "mma",
      name: "UFC Championship",
      shortName: "UFC",
      country: "Global",
      logoUrl: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=128&auto=format&fit=crop&q=80",
      season: "2026",
      displayOrder: 7,
    },
  ];

  for (const l of leaguesData) {
    await db.insert(leagues).values(l).onConflictDoUpdate({ target: leagues.id, set: l });
  }

  // 3. TEAMS
  const teamsData = [
    {
      id: "arsenal",
      leagueId: "premier-league",
      name: "Arsenal FC",
      shortName: "ARS",
      logoUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80",
      stadium: "Emirates Stadium, London",
      primaryColor: "#ef4444",
    },
    {
      id: "man-city",
      leagueId: "premier-league",
      name: "Manchester City",
      shortName: "MCI",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80",
      stadium: "Etihad Stadium, Manchester",
      primaryColor: "#38bdf8",
    },
    {
      id: "liverpool",
      leagueId: "premier-league",
      name: "Liverpool FC",
      shortName: "LIV",
      logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80",
      stadium: "Anfield, Liverpool",
      primaryColor: "#dc2626",
    },
    {
      id: "chelsea",
      leagueId: "premier-league",
      name: "Chelsea FC",
      shortName: "CHE",
      logoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80",
      stadium: "Stamford Bridge, London",
      primaryColor: "#2563eb",
    },
    {
      id: "real-madrid",
      leagueId: "la-liga",
      name: "Real Madrid CF",
      shortName: "RMA",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80",
      stadium: "Santiago Bernabéu, Madrid",
      primaryColor: "#f59e0b",
    },
    {
      id: "barcelona",
      leagueId: "la-liga",
      name: "FC Barcelona",
      shortName: "BAR",
      logoUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=120&auto=format&fit=crop&q=80",
      stadium: "Spotify Camp Nou, Barcelona",
      primaryColor: "#9333ea",
    },
    {
      id: "bayern-munich",
      leagueId: "bundesliga",
      name: "FC Bayern Munich",
      shortName: "BAY",
      logoUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=120&auto=format&fit=crop&q=80",
      stadium: "Allianz Arena, Munich",
      primaryColor: "#e11d48",
    },
    {
      id: "dortmund",
      leagueId: "bundesliga",
      name: "Borussia Dortmund",
      shortName: "BVB",
      logoUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&auto=format&fit=crop&q=80",
      stadium: "Signal Iduna Park, Dortmund",
      primaryColor: "#eab308",
    },
    {
      id: "inter-milan",
      leagueId: "serie-a",
      name: "Inter Milan",
      shortName: "INT",
      logoUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=120&auto=format&fit=crop&q=80",
      stadium: "San Siro, Milan",
      primaryColor: "#0284c7",
    },
    {
      id: "juventus",
      leagueId: "serie-a",
      name: "Juventus FC",
      shortName: "JUV",
      logoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=80",
      stadium: "Allianz Stadium, Turin",
      primaryColor: "#ffffff",
    },
    {
      id: "lakers",
      leagueId: "nba",
      name: "Los Angeles Lakers",
      shortName: "LAL",
      logoUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80",
      stadium: "Crypto.com Arena, Los Angeles",
      primaryColor: "#854d0e",
    },
    {
      id: "warriors",
      leagueId: "nba",
      name: "Golden State Warriors",
      shortName: "GSW",
      logoUrl: "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=120&auto=format&fit=crop&q=80",
      stadium: "Chase Center, San Francisco",
      primaryColor: "#2563eb",
    },
    {
      id: "celtics",
      leagueId: "nba",
      name: "Boston Celtics",
      shortName: "BOS",
      logoUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80",
      stadium: "TD Garden, Boston",
      primaryColor: "#16a34a",
    },
  ];

  for (const t of teamsData) {
    await db.insert(teams).values(t).onConflictDoUpdate({ target: teams.id, set: t });
  }

  // 4. MATCHES
  const now = new Date();
  const pastOneHour = new Date(now.getTime() - 68 * 60 * 1000); // 68 mins ago
  const past35Mins = new Date(now.getTime() - 35 * 60 * 1000); // 35 mins ago
  const future2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const futureTomorrow = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const matchesData = [
    {
      id: "ars-mci-live",
      sportId: "football",
      leagueId: "premier-league",
      homeTeamId: "arsenal",
      awayTeamId: "man-city",
      status: "live" as const,
      minute: 68,
      period: "2nd Half",
      homeScore: 2,
      awayScore: 1,
      startTime: pastOneHour,
      venue: "Emirates Stadium, London",
      round: "Matchday 14",
      isFeatured: true,
      viewersCount: 78420,
      stats: {
        possession: [56, 44] as [number, number],
        shots: [14, 9] as [number, number],
        shotsOnTarget: [6, 4] as [number, number],
        corners: [7, 3] as [number, number],
        fouls: [8, 12] as [number, number],
        yellowCards: [1, 2] as [number, number],
        redCards: [0, 0] as [number, number],
        saves: [3, 4] as [number, number],
      },
    },
    {
      id: "rma-bar-live",
      sportId: "football",
      leagueId: "la-liga",
      homeTeamId: "real-madrid",
      awayTeamId: "barcelona",
      status: "live" as const,
      minute: 38,
      period: "1st Half",
      homeScore: 1,
      awayScore: 1,
      startTime: past35Mins,
      venue: "Santiago Bernabéu, Madrid",
      round: "El Clásico - Matchday 15",
      isFeatured: true,
      viewersCount: 114250,
      stats: {
        possession: [48, 52] as [number, number],
        shots: [8, 11] as [number, number],
        shotsOnTarget: [4, 5] as [number, number],
        corners: [4, 6] as [number, number],
        fouls: [10, 7] as [number, number],
        yellowCards: [2, 1] as [number, number],
        redCards: [0, 0] as [number, number],
        saves: [4, 3] as [number, number],
      },
    },
    {
      id: "lal-gsw-live",
      sportId: "basketball",
      leagueId: "nba",
      homeTeamId: "lakers",
      awayTeamId: "warriors",
      status: "live" as const,
      minute: 42,
      period: "Q4 - 05:22",
      homeScore: 104,
      awayScore: 101,
      startTime: pastOneHour,
      venue: "Crypto.com Arena, Los Angeles",
      round: "Regular Season",
      isFeatured: true,
      viewersCount: 62890,
      stats: {
        possession: [50, 50] as [number, number],
        shots: [42, 39] as [number, number],
        shotsOnTarget: [22, 19] as [number, number],
        corners: [0, 0] as [number, number],
        fouls: [16, 18] as [number, number],
        yellowCards: [0, 0] as [number, number],
        redCards: [0, 0] as [number, number],
        saves: [0, 0] as [number, number],
      },
    },
    {
      id: "liv-che-upcoming",
      sportId: "football",
      leagueId: "premier-league",
      homeTeamId: "liverpool",
      awayTeamId: "chelsea",
      status: "upcoming" as const,
      minute: 0,
      period: "Scheduled",
      homeScore: 0,
      awayScore: 0,
      startTime: future2Hours,
      venue: "Anfield, Liverpool",
      round: "Matchday 14",
      isFeatured: true,
      viewersCount: 14200,
      stats: {
        possession: [50, 50] as [number, number],
        shots: [0, 0] as [number, number],
        shotsOnTarget: [0, 0] as [number, number],
        corners: [0, 0] as [number, number],
        fouls: [0, 0] as [number, number],
        yellowCards: [0, 0] as [number, number],
        redCards: [0, 0] as [number, number],
        saves: [0, 0] as [number, number],
      },
    },
    {
      id: "bay-bvb-upcoming",
      sportId: "football",
      leagueId: "bundesliga",
      homeTeamId: "bayern-munich",
      awayTeamId: "dortmund",
      status: "upcoming" as const,
      minute: 0,
      period: "Scheduled",
      homeScore: 0,
      awayScore: 0,
      startTime: futureTomorrow,
      venue: "Allianz Arena, Munich",
      round: "Der Klassiker - Matchday 13",
      isFeatured: false,
      viewersCount: 8900,
      stats: {
        possession: [50, 50] as [number, number],
        shots: [0, 0] as [number, number],
        shotsOnTarget: [0, 0] as [number, number],
        corners: [0, 0] as [number, number],
        fouls: [0, 0] as [number, number],
        yellowCards: [0, 0] as [number, number],
        redCards: [0, 0] as [number, number],
        saves: [0, 0] as [number, number],
      },
    },
    {
      id: "int-juv-ft",
      sportId: "football",
      leagueId: "serie-a",
      homeTeamId: "inter-milan",
      awayTeamId: "juventus",
      status: "finished" as const,
      minute: 90,
      period: "FT",
      homeScore: 2,
      awayScore: 0,
      startTime: yesterday,
      venue: "San Siro, Milan",
      round: "Derby d'Italia",
      isFeatured: false,
      viewersCount: 42100,
      stats: {
        possession: [61, 39] as [number, number],
        shots: [16, 7] as [number, number],
        shotsOnTarget: [7, 2] as [number, number],
        corners: [8, 3] as [number, number],
        fouls: [11, 14] as [number, number],
        yellowCards: [2, 4] as [number, number],
        redCards: [0, 1] as [number, number],
        saves: [2, 5] as [number, number],
      },
    },
  ];

  for (const m of matchesData) {
    await db.insert(matches).values(m).onConflictDoUpdate({ target: matches.id, set: m });
  }

  // 5. STREAMS (Reliable high quality test HLS feeds + fallback MP4s)
  const streamsData = [
    // Arsenal vs Man City Streams
    {
      matchId: "ars-mci-live",
      serverName: "Server 1 • Ultra HD 1080p (English Main)",
      streamType: "hls" as const,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "1080p",
      language: "EN",
      bitrate: "6500 kbps",
      isDefault: true,
      isWorking: true,
    },
    {
      matchId: "ars-mci-live",
      serverName: "Server 2 • 60FPS Low-Latency (Stadium Sound)",
      streamType: "hls" as const,
      streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      quality: "1080p",
      language: "EN",
      bitrate: "5000 kbps",
      isDefault: false,
      isWorking: true,
    },
    {
      matchId: "ars-mci-live",
      serverName: "Server 3 • Fast Mobile / Data Saver (720p)",
      streamType: "mp4" as const,
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      quality: "720p",
      language: "EN",
      bitrate: "2200 kbps",
      isDefault: false,
      isWorking: true,
    },
    {
      matchId: "ars-mci-live",
      serverName: "Server 4 • Spanish Commentary (Español)",
      streamType: "hls" as const,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "1080p",
      language: "ES",
      bitrate: "4500 kbps",
      isDefault: false,
      isWorking: true,
    },

    // Real Madrid vs Barcelona Streams
    {
      matchId: "rma-bar-live",
      serverName: "Server 1 • 4K HDR Feed (El Clásico)",
      streamType: "hls" as const,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "4K",
      language: "ES",
      bitrate: "8500 kbps",
      isDefault: true,
      isWorking: true,
    },
    {
      matchId: "rma-bar-live",
      serverName: "Server 2 • 1080p English Commentary",
      streamType: "hls" as const,
      streamUrl: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      quality: "1080p",
      language: "EN",
      bitrate: "5200 kbps",
      isDefault: false,
      isWorking: true,
    },

    // Lakers vs Warriors Streams
    {
      matchId: "lal-gsw-live",
      serverName: "Server 1 • ESPN HD Broadcast (NBA)",
      streamType: "hls" as const,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "1080p",
      language: "EN",
      bitrate: "6000 kbps",
      isDefault: true,
      isWorking: true,
    },
    {
      matchId: "lal-gsw-live",
      serverName: "Server 2 • TNT Overtime Multi-Angle",
      streamType: "mp4" as const,
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      quality: "720p",
      language: "EN",
      bitrate: "3500 kbps",
      isDefault: false,
      isWorking: true,
    },

    // Liverpool vs Chelsea Streams
    {
      matchId: "liv-che-upcoming",
      serverName: "Server 1 • Pre-Match Analysis & Live Countdown",
      streamType: "hls" as const,
      streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      quality: "1080p",
      language: "EN",
      bitrate: "6000 kbps",
      isDefault: true,
      isWorking: true,
    },
  ];

  for (const st of streamsData) {
    await db.insert(streams).values(st);
  }

  // 6. MATCH EVENTS (for Arsenal vs Man City)
  const eventsData = [
    {
      matchId: "ars-mci-live",
      minute: 19,
      type: "goal" as const,
      teamId: "arsenal",
      player: "Bukayo Saka",
      detail: "Spectacular curling finish into top corner, assisted by Martin Ødegaard",
    },
    {
      matchId: "ars-mci-live",
      minute: 34,
      type: "goal" as const,
      teamId: "man-city",
      player: "Erling Haaland",
      detail: "Powerful header from Kevin De Bruyne cross",
    },
    {
      matchId: "ars-mci-live",
      minute: 41,
      type: "yellow_card" as const,
      teamId: "man-city",
      player: "Rodri",
      detail: "Tactical foul breaking counter attack",
    },
    {
      matchId: "ars-mci-live",
      minute: 54,
      type: "goal" as const,
      teamId: "arsenal",
      player: "Gabriel Martinelli",
      detail: "Solo breakaway sprint and calm low finish",
    },
    {
      matchId: "ars-mci-live",
      minute: 62,
      type: "sub" as const,
      teamId: "man-city",
      player: "Jeremy Doku (In) / Jack Grealish (Out)",
      detail: "Tactical substitution by Pep Guardiola",
    },

    // Real Madrid vs Barcelona events
    {
      matchId: "rma-bar-live",
      minute: 12,
      type: "goal" as const,
      teamId: "real-madrid",
      player: "Vinícius Jr.",
      detail: "Lightning quick finish inside near post",
    },
    {
      matchId: "rma-bar-live",
      minute: 27,
      type: "goal" as const,
      teamId: "barcelona",
      player: "Lamine Yamal",
      detail: "Left foot wonder strike outside the box",
    },
  ];

  for (const ev of eventsData) {
    await db.insert(matchEvents).values(ev);
  }

  // 7. LINEUPS
  await db.insert(lineups).values({
    matchId: "ars-mci-live",
    teamId: "arsenal",
    formation: "4-3-3",
    coach: "Mikel Arteta",
    startingEleven: [
      { number: 22, name: "David Raya", pos: "GK" },
      { number: 4, name: "Ben White", pos: "RB" },
      { number: 2, name: "William Saliba", pos: "CB" },
      { number: 6, name: "Gabriel Magalhães", pos: "CB" },
      { number: 12, name: "Jurriën Timber", pos: "LB" },
      { number: 41, name: "Declan Rice", pos: "CM" },
      { number: 5, name: "Thomas Partey", pos: "CM" },
      { number: 8, name: "Martin Ødegaard", pos: "CAM", captain: true },
      { number: 7, name: "Bukayo Saka", pos: "RW" },
      { number: 29, name: "Kai Havertz", pos: "ST" },
      { number: 11, name: "Gabriel Martinelli", pos: "LW" },
    ],
    substitutes: [
      { number: 32, name: "Neto", pos: "GK" },
      { number: 17, name: "Oleksandr Zinchenko", pos: "DF" },
      { number: 19, name: "Leandro Trossard", pos: "FW" },
      { number: 9, name: "Gabriel Jesus", pos: "FW" },
      { number: 23, name: "Mikel Merino", pos: "MF" },
    ],
  }).onConflictDoNothing();

  await db.insert(lineups).values({
    matchId: "ars-mci-live",
    teamId: "man-city",
    formation: "4-2-3-1",
    coach: "Pep Guardiola",
    startingEleven: [
      { number: 31, name: "Ederson", pos: "GK" },
      { number: 2, name: "Kyle Walker", pos: "RB", captain: true },
      { number: 3, name: "Rúben Dias", pos: "CB" },
      { number: 25, name: "Manuel Akanji", pos: "CB" },
      { number: 24, name: "Joško Gvardiol", pos: "LB" },
      { number: 16, name: "Rodri", pos: "CDM" },
      { number: 8, name: "Mateo Kovačić", pos: "CM" },
      { number: 20, name: "Bernardo Silva", pos: "RW" },
      { number: 17, name: "Kevin De Bruyne", pos: "CAM" },
      { number: 47, name: "Phil Foden", pos: "LW" },
      { number: 9, name: "Erling Haaland", pos: "ST" },
    ],
    substitutes: [
      { number: 18, name: "Stefan Ortega", pos: "GK" },
      { number: 5, name: "John Stones", pos: "DF" },
      { number: 10, name: "Jack Grealish", pos: "MF" },
      { number: 11, name: "Jérémy Doku", pos: "FW" },
      { number: 27, name: "Matheus Nunes", pos: "MF" },
    ],
  }).onConflictDoNothing();

  // 8. LIVE CHAT MESSAGES
  const chatData = [
    {
      matchId: "ars-mci-live",
      username: "GoonerArmy_99",
      userBadge: "VIP",
      message: "WHAT A GOAL BY MARTINELLI! Emirates is buzzing right now 🔥🔥🔥",
      teamFlair: "ARS",
    },
    {
      matchId: "ars-mci-live",
      username: "CityFan_Erling",
      userBadge: "FAN",
      message: "Haaland needs better service, Pep bring Doku on earlier!",
      teamFlair: "MCI",
    },
    {
      matchId: "ars-mci-live",
      username: "StreamModerator",
      userBadge: "MOD",
      message: "Welcome to Sckoll 4K Stream! Keep chat respectful and enjoy the match ⚽",
      teamFlair: "ARS",
    },
    {
      matchId: "ars-mci-live",
      username: "FootballAnalyst",
      userBadge: "PRO",
      message: "Arsenal's defensive shape with Saliba and Gabriel is impenetrable today.",
      teamFlair: "ARS",
    },
    {
      matchId: "ars-mci-live",
      username: "LondonRed",
      userBadge: "VIP",
      message: "Rice and Partey winning every second ball. 20 minutes left, let's hold this!",
      teamFlair: "ARS",
    },
  ];

  for (const c of chatData) {
    await db.insert(chatMessages).values(c);
  }

  // 9. CHAT REACTIONS
  const reactions = [
    { matchId: "ars-mci-live", reactionType: "goal", count: 4890 },
    { matchId: "ars-mci-live", reactionType: "fire", count: 7120 },
    { matchId: "ars-mci-live", reactionType: "clap", count: 3200 },
    { matchId: "ars-mci-live", reactionType: "goat", count: 1840 },
    { matchId: "ars-mci-live", reactionType: "shock", count: 950 },
  ];

  for (const r of reactions) {
    await db.insert(chatReactions).values(r).onConflictDoUpdate({ target: [chatReactions.matchId, chatReactions.reactionType], set: r });
  }

  // 10. HIGHLIGHTS & VODs
  const highlightsData = [
    {
      matchId: "int-juv-ft",
      title: "Inter Milan 2 - 0 Juventus | Derby d'Italia Extended Highlights & Goals",
      competition: "Serie A",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80",
      duration: "09:44",
      views: 182400,
    },
    {
      matchId: null,
      title: "Champions League Matchday 4 | Top 10 Goals of the Week",
      competition: "UEFA Champions League",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80",
      duration: "07:15",
      views: 340900,
    },
    {
      matchId: null,
      title: "Stephen Curry 42 Points Showcase vs Lakers Highlights",
      competition: "NBA",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80",
      duration: "11:20",
      views: 228000,
    },
  ];

  for (const h of highlightsData) {
    await db.insert(highlights).values(h);
  }

  // 11. LEAGUE STANDINGS (Premier League)
  const eplStandings = [
    { leagueId: "premier-league", teamId: "arsenal", rank: 1, played: 14, won: 11, drawn: 2, lost: 1, goalsFor: 32, goalsAgainst: 10, goalDiff: 22, points: 35, form: "W,W,W,D,W" },
    { leagueId: "premier-league", teamId: "man-city", rank: 2, played: 14, won: 10, drawn: 2, lost: 2, goalsFor: 34, goalsAgainst: 14, goalDiff: 20, points: 32, form: "W,L,W,W,L" },
    { leagueId: "premier-league", teamId: "liverpool", rank: 3, played: 13, won: 9, drawn: 3, lost: 1, goalsFor: 29, goalsAgainst: 12, goalDiff: 17, points: 30, form: "W,W,D,W,W" },
    { leagueId: "premier-league", teamId: "chelsea", rank: 4, played: 13, won: 8, drawn: 3, lost: 2, goalsFor: 26, goalsAgainst: 15, goalDiff: 11, points: 27, form: "D,W,W,W,D" },
  ];

  for (const s of eplStandings) {
    await db.insert(leagueStandings).values(s).onConflictDoUpdate({ target: [leagueStandings.leagueId, leagueStandings.teamId], set: s });
  }

  console.log("✅ Sports data seeding finished successfully!");
  await p.end();
}

// Run immediately if invoked directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSportsData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
