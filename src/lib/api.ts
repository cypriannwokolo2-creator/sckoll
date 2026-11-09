/** Typed client for Sckoll Match Streaming Platform */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  liveCount: number;
}

export interface MatchSummary {
  id: string;
  sportId: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string | null;
  leagueLogo: string | null;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamShort: string;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamShort: string;
  awayTeamLogo: string | null;
  status: "upcoming" | "live" | "ht" | "finished" | "postponed";
  minute: number;
  period: string;
  homeScore: number;
  awayScore: number;
  startTime: string;
  venue: string | null;
  round: string | null;
  isFeatured: boolean;
  viewersCount: number;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  saves: [number, number];
}

export interface StreamSource {
  id: string;
  matchId: string;
  serverName: string;
  streamType: "hls" | "iframe" | "mp4" | "embed";
  streamUrl: string;
  quality: string;
  language: string;
  bitrate?: string;
  isDefault: boolean;
  isWorking: boolean;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "sub" | "penalty" | "var";
  teamId?: string | null;
  player: string;
  detail?: string | null;
}

export interface PlayerInfo {
  number: number;
  name: string;
  pos: string;
  captain?: boolean;
}

export interface LineupData {
  id: string;
  matchId: string;
  teamId: string;
  formation: string;
  startingEleven: PlayerInfo[];
  substitutes: PlayerInfo[];
  coach?: string | null;
}

export interface MatchDetail extends MatchSummary {
  homeTeamColor?: string;
  awayTeamColor?: string;
  stats: MatchStats | null;
}

export interface MatchDetailResponse {
  match: MatchDetail;
  streams: StreamSource[];
  events: MatchEvent[];
  lineups: {
    home: LineupData | null;
    away: LineupData | null;
  };
}

export interface ChatMessage {
  id: string;
  matchId: string;
  userId?: string | null;
  username: string;
  userBadge: "FAN" | "VIP" | "MOD" | "PRO";
  message: string;
  teamFlair?: string | null;
  createdAt: string;
}

export interface ChatResponse {
  messages: ChatMessage[];
  reactions: Record<string, number>;
}

export interface League {
  id: string;
  sportId: string;
  name: string;
  shortName: string | null;
  country: string | null;
  logoUrl: string | null;
  season: string | null;
  displayOrder: number;
}

export interface StandingRow {
  id: string;
  leagueId: string;
  teamId: string;
  teamName: string;
  teamShort: string;
  teamLogo: string | null;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: string;
}

export interface HighlightItem {
  id: string;
  matchId?: string | null;
  title: string;
  competition: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  favoriteTeamId?: string | null;
  avatarUrl?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      msg = json.error || json.message || msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  return (await res.json()) as T;
}

export async function fetchSports(): Promise<Sport[]> {
  try {
    const data = await request<{ sports: Sport[] }>("/v1/sports");
    return data.sports;
  } catch {
    return [];
  }
}

export async function fetchMatches(params?: {
  sport?: string;
  league?: string;
  status?: string;
  q?: string;
}): Promise<MatchSummary[]> {
  try {
    const query = new URLSearchParams();
    if (params?.sport) query.set("sport", params.sport);
    if (params?.league) query.set("league", params.league);
    if (params?.status) query.set("status", params.status);
    if (params?.q) query.set("q", params.q);

    const qs = query.toString();
    const data = await request<{ matches: MatchSummary[] }>(`/v1/matches${qs ? `?${qs}` : ""}`);
    return data.matches;
  } catch {
    return [];
  }
}

export async function fetchMatch(id: string): Promise<MatchDetailResponse | null> {
  try {
    return await request<MatchDetailResponse>(`/v1/matches/${id}`);
  } catch {
    return null;
  }
}

export async function fetchChat(matchId: string): Promise<ChatResponse> {
  try {
    return await request<ChatResponse>(`/v1/matches/${matchId}/chat`);
  } catch {
    return { messages: [], reactions: {} };
  }
}

export async function postChatMessage(
  matchId: string,
  payload: { username: string; message: string; teamFlair?: string; userBadge?: "FAN" | "VIP" | "MOD" | "PRO" }
): Promise<ChatMessage | null> {
  try {
    const res = await request<{ message: ChatMessage }>(`/v1/matches/${matchId}/chat`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.message;
  } catch {
    return null;
  }
}

export async function postReaction(
  matchId: string,
  reaction: "goal" | "fire" | "clap" | "goat" | "shock" | "heart"
): Promise<boolean> {
  try {
    await request<{ ok: boolean }>(`/v1/matches/${matchId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchLeagues(): Promise<League[]> {
  try {
    const data = await request<{ leagues: League[] }>("/v1/leagues");
    return data.leagues;
  } catch {
    return [];
  }
}

export async function fetchStandings(leagueId: string): Promise<StandingRow[]> {
  try {
    const data = await request<{ standings: StandingRow[] }>(`/v1/leagues/${leagueId}/standings`);
    return data.standings;
  } catch {
    return [];
  }
}

export async function fetchHighlights(): Promise<HighlightItem[]> {
  try {
    const data = await request<{ highlights: HighlightItem[] }>("/v1/highlights");
    return data.highlights;
  } catch {
    return [];
  }
}

export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const res = await request<{ user: PublicUser }>("/v1/auth/me");
    return res.user;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await request("/v1/auth/signout", { method: "POST" });
  } catch {}
}

export const api = {
  me: async (): Promise<{ user: PublicUser }> => {
    const res = await request<{ user: PublicUser }>("/v1/auth/me");
    return res;
  },
  signOut,
};
