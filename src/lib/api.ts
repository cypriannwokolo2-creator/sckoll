/** Typed client for the Sckoll backend (api.sckoll.com in prod, localhost:8110 in dev). */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");
// Google sign-in runs as a full-page redirect through the API (authorization
// code + PKCE). The browser only needs the API's start URL — no client id, no
// secret, no third-party script — so the API decides whether the feature is
// enabled and the frontend just links to it.
export function googleSignInUrl(mode: "sign-in" | "sign-up", role: string): string {
  const params = new URLSearchParams({ mode, role });
  return `${API_URL}/v1/auth/google?${params.toString()}`;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

export interface Profile {
  userId: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  hourlyRate: string | null;
  avatarUrl: string | null;
  skills: string[];
  payoutAccount: { bankCode?: string; accountNumber?: string; accountName?: string } | null;
  links: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface Opportunity {
  id: string;
  clientId: string;
  category: string;
  type: "project" | "role" | "contract";
  title: string;
  description: string;
  skills: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  rateType: "fixed" | "hourly" | "salary";
  location: string | null;
  remote: boolean;
  status: "draft" | "open" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface MatchScore {
  fit?: number | null;
  fitRules?: number | null;
  fitVector?: number | null;
  reasons?: string[];
}

export interface OpportunityFilters {
  q?: string;
  type?: string;
  category?: string;
  skills?: string;
  budget_min?: string;
  budget_max?: string;
  remote?: string;
  limit?: string;
  cursor?: string;
  mine?: string;
}

export function budgetLabel(o: Pick<Opportunity, "budgetMin" | "budgetMax" | "rateType">): string {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (o.budgetMin != null && o.budgetMax != null) {
    const base = `${fmt(o.budgetMin)}–${fmt(o.budgetMax)}`;
    return o.rateType === "hourly" ? `Hourly · ${base}/hr` : o.rateType === "salary" ? `Salary · ${base}` : `Fixed price · ${base}`;
  }
  if (o.budgetMin != null || o.budgetMax != null) {
    return `Budget · ${fmt((o.budgetMin ?? o.budgetMax) as number)}${o.rateType === "hourly" ? "/hr" : ""}`;
  }
  return o.rateType === "salary" ? "Full-time · Salary" : o.rateType === "hourly" ? "Hourly · Rate on request" : "Fixed price · On request";
}

/** Client-side fit estimate: shared-skill overlap with the viewer's profile. */
export function fitEstimate(viewerSkills: string[], oppSkills: string[]): number | null {
  if (viewerSkills.length === 0 || oppSkills.length === 0) return null;
  const mine = new Set(viewerSkills.map((s) => s.toLowerCase()));
  const hits = oppSkills.filter((s) => [...mine].some((m) => m.includes(s.toLowerCase()) || s.toLowerCase().includes(m))).length;
  return Math.round((50 + (hits / oppSkills.length) * 49));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    // Only declare JSON when there is a body: a bodyless POST that claims
    // application/json is parsed as an empty document and rejected.
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(res.status, String(data.error ?? "request_failed"), String(data.message ?? "Something went wrong."));
  }
  return data as T;
}

export const api = {
  config: () => request<{ google_enabled: boolean; email_password_enabled: boolean }>("/v1/auth/config"),
  signup: (input: { email: string; name: string; password: string; role: string }) =>
    request<{ ok: boolean; user?: PublicUser; message?: string }>("/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<{ ok: boolean; user: PublicUser }>("/v1/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<{ ok: boolean }>("/v1/auth/logout", { method: "POST" }),
  me: () => request<{ ok: boolean; user: PublicUser; profile: Profile | null }>("/v1/me"),
  verify: (input: { token: string; email: string }) =>
    request<{ ok: boolean; user: PublicUser }>("/v1/auth/verify", { method: "POST", body: JSON.stringify(input) }),
  resend: (email: string) =>
    request<{ ok: boolean }>("/v1/auth/resend", { method: "POST", body: JSON.stringify({ email }) }),
  forgot: (email: string) =>
    request<{ ok: boolean }>("/v1/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (input: { token: string; email: string; password: string }) =>
    request<{ ok: boolean }>("/v1/auth/reset", { method: "POST", body: JSON.stringify(input) }),
  patchProfile: (input: Partial<Profile> & { role?: string }) =>
    request<{ ok: boolean; profile: Profile }>("/v1/profiles/me", { method: "PATCH", body: JSON.stringify(input) }),
  contact: (input: { name: string; email: string; topic: string; message: string }) =>
    request<{ ok: boolean }>("/v1/contact", { method: "POST", body: JSON.stringify(input) }),
  opportunities: (filters: OpportunityFilters = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    const qs = params.toString();
    return request<{ ok: boolean; opportunities: Array<Opportunity & MatchScore>; nextCursor: string | null }>(
      `/v1/opportunities${qs ? `?${qs}` : ""}`,
    );
  },
  opportunity: (id: string) => request<{ ok: boolean; opportunity: Opportunity & MatchScore }>(`/v1/opportunities/${id}`),
  postOpportunity: (input: {
    category: string;
    type: string;
    title: string;
    description: string;
    skills: string[];
    budgetMin?: number;
    budgetMax?: number;
    rateType: string;
    location?: string;
    remote: boolean;
  }) => request<{ ok: boolean; opportunity: Opportunity }>("/v1/opportunities", { method: "POST", body: JSON.stringify(input) }),
  closeOpportunity: (id: string) => request<{ ok: boolean }>(`/v1/opportunities/${id}`, { method: "DELETE" }),
  updateOpportunity: (id: string, input: Record<string, unknown>) =>
    request<{ ok: boolean; opportunity: Opportunity }>(`/v1/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  categories: () => request<{ ok: boolean; counts: Record<string, number> }>("/v1/categories"),
  talentSearch: (filters: { q?: string; skills?: string; availability?: string; rate_max?: string } = {}) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    const qs = params.toString();
    return request<{
      ok: boolean;
      results: TalentResult[];
      total: number;
    }>(`/v1/talent/search${qs ? `?${qs}` : ""}`);
  },
  apply: (id: string, input: { pitch: string; bidAmount?: number; bidType?: string }) =>
    request<{ ok: boolean; application: Application }>(`/v1/opportunities/${id}/apply`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  withdrawApplication: (id: string) => request<{ ok: boolean }>(`/v1/applications/${id}`, { method: "DELETE" }),
  pipeline: () =>
    request<{
      ok: boolean;
      pipeline: Record<string, Array<{ application: Application; opportunity: Opportunity }>>;
    }>("/v1/pipeline/me"),
  oppApplications: (id: string) =>
    request<{
      ok: boolean;
      applications: Array<
        Application & {
          talent: { id: string; name: string | null; emailVerified: boolean };
          profile: Profile | null;
        }
      >;
    }>(`/v1/opportunities/${id}/applications`),
  setApplicationStatus: (id: string, status: string) =>
    request<{ ok: boolean; application: Application }>(`/v1/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  savedSearches: () =>
    request<{ ok: boolean; searches: SavedSearch[] }>("/v1/saved-searches"),
  createSavedSearch: (input: { query: string; filters?: Record<string, string>; emailAlerts?: boolean }) =>
    request<{ ok: boolean; search: SavedSearch }>("/v1/saved-searches", { method: "POST", body: JSON.stringify(input) }),
  deleteSavedSearch: (id: string) => request<{ ok: boolean }>(`/v1/saved-searches/${id}`, { method: "DELETE" }),
  publicProfile: (id: string) => request<PublicProfileResponse>(`/v1/profiles/${id}`),
  shortlists: () =>
    request<{
      ok: boolean;
      shortlists: Array<{
        id: string;
        talentId: string;
        opportunityId: string | null;
        notes: string;
        talent: { id: string; name: string | null; role: string; emailVerified: boolean };
        profile: Profile | null;
        opportunity: { id: string; title: string; status: string } | null;
      }>;
    }>("/v1/shortlists"),
  addShortlist: (input: { talentId: string; opportunityId?: string; notes?: string }) =>
    request<{ ok: boolean; shortlist: { id: string }; deduped?: boolean }>("/v1/shortlists", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  patchShortlist: (id: string, input: { notes?: string }) =>
    request<{ ok: boolean }>(`/v1/shortlists/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  removeShortlist: (id: string) => request<{ ok: boolean }>(`/v1/shortlists/${id}`, { method: "DELETE" }),
  notifications: (limit = 20, offset = 0) =>
    request<{ ok: boolean; notifications: AppNotification[]; unread: number }>(
      `/v1/notifications?limit=${limit}&offset=${offset}`,
    ),
  markNotificationsRead: (ids?: string[]) =>
    request<{ ok: boolean }>("/v1/notifications/read", { method: "POST", body: JSON.stringify(ids ? { ids } : {}) }),
  notificationPrefs: () =>
    request<{ ok: boolean; prefs: NotificationPrefs; types: string[] }>("/v1/notifications/prefs"),
  patchNotificationPrefs: (input: { emailEnabled?: boolean; inappEnabled?: boolean; mutedEvents?: string[] }) =>
    request<{ ok: boolean; prefs: NotificationPrefs }>("/v1/notifications/prefs", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  runDigest: () => request<{ ok: boolean; digests: number }>("/v1/notifications/digest-run", { method: "POST" }),
  myContracts: () =>
    request<{
      ok: boolean;
      asClient: Array<{ contract: Contract; opportunity: { id: string; title: string; status: string } }>;
      asTalent: Array<{ contract: Contract; opportunity: { id: string; title: string; status: string } }>;
    }>("/v1/contracts/me"),
  contractDetail: (id: string) =>
    request<{
      ok: boolean;
      contract: Contract;
      opportunity: { id: string; title: string; status: string } | null;
      milestones: Milestone[];
      client: { id: string; name: string | null } | null;
      talent: { id: string; name: string | null } | null;
    }>(`/v1/contracts/${id}`),
  createContract: (applicationId: string, scope?: string) =>
    request<{ ok: boolean; contract: Contract; deduped?: boolean }>("/v1/contracts", {
      method: "POST",
      body: JSON.stringify({ applicationId, ...(scope ? { scope } : {}) }),
    }),
  patchContract: (id: string, input: { scope?: string; status?: string }) =>
    request<{ ok: boolean; contract: Contract }>(`/v1/contracts/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  addMilestone: (contractId: string, input: { title: string; amount?: number; dueDate?: string }) =>
    request<{ ok: boolean; milestone: Milestone }>(`/v1/contracts/${contractId}/milestones`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  patchMilestone: (id: string, status: string) =>
    request<{ ok: boolean; milestone: Milestone }>(`/v1/milestones/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  contractMessages: (contractId: string) =>
    request<{ ok: boolean; messages: ContractMessage[] }>(`/v1/contracts/${contractId}/messages`),
  sendContractMessage: (contractId: string, body: string) =>
    request<{ ok: boolean; message: ContractMessage; warning: string | null }>(`/v1/contracts/${contractId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  markMessagesRead: (contractId: string) =>
    request<{ ok: boolean }>(`/v1/contracts/${contractId}/messages/read`, { method: "POST" }),
  postReview: (input: { contractId: string; stars: number; text?: string }) =>
    request<{ ok: boolean; review: Review }>("/v1/reviews", { method: "POST", body: JSON.stringify(input) }),
  flagContract: (contractId: string, reason: string) =>
    request<{ ok: boolean }>(`/v1/contracts/${contractId}/flag`, { method: "POST", body: JSON.stringify({ reason }) }),
  fundMilestone: (id: string) =>
    request<{ ok: boolean; payment: Payment; authorizationUrl?: string; deduped?: boolean }>(`/v1/milestones/${id}/fund`, { method: "POST" }),
  releaseMilestone: (id: string) =>
    request<{ ok: boolean; payment: Payment; deduped?: boolean }>(`/v1/milestones/${id}/release`, { method: "POST" }),
  contractPayments: (contractId: string) =>
    request<{ ok: boolean; payments: Payment[] }>(`/v1/contracts/${contractId}/payments`),
};

export interface Payment {
  id: string;
  contractId: string;
  milestoneId: string | null;
  direction: "in" | "out";
  amount: number;
  currency: string;
  provider: string;
  providerRef: string | null;
  status: "pending" | "held" | "released" | "failed" | "refunded" | "frozen";
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  opportunityId: string;
  applicationId: string;
  clientId: string;
  talentId: string;
  scope: string;
  status: "draft" | "active" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  title: string;
  amount: number | null;
  dueDate: string | null;
  status: "pending" | "submitted" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface ContractMessage {
  id: string;
  contractId: string;
  senderId: string;
  body: string;
  flagged: boolean;
  flagReason: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  contractId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  text: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  userId: string;
  emailEnabled: boolean;
  inappEnabled: boolean;
  mutedEvents: string[];
  updatedAt: string;
}

export interface TalentResult {
  id: string;
  name: string | null;
  role: string;
  headline: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
  hourlyRate: string | null;
  avatarUrl: string | null;
  fit: number;
  fitRules?: number | null;
  fitVector?: number | null;
  reasons?: string[];
}

export function trackMatchEvent(input: {
  eventType: "view" | "click" | "apply";
  targetType: "opportunity" | "talent";
  targetId: string;
  scoreRules?: number;
  scoreVector?: number | null;
  finalScore?: number;
}): void {
  try {
    const { scoreVector, ...rest } = input;
    const body = JSON.stringify({
      ...rest,
      ...(scoreVector == null ? {} : { scoreVector }),
    });
    void fetch(`${API_URL}/v1/match-events`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // telemetry never blocks UX — and never becomes an unhandled rejection
    });
  } catch {
    // telemetry never blocks UX
  }
}

export interface PublicProfile {
  id: string;
  name: string | null;
  role: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  hourlyRate: string | null;
  avatarUrl: string | null;
  skills: string[];
  payoutAccount: { bankCode?: string; accountNumber?: string; accountName?: string } | null;
  links: Record<string, string>;
}

export interface PublicProfileResponse {
  ok: boolean;
  profile: PublicProfile;
  reviews: Array<{ stars: number; text: string; createdAt: string }>;
  reviewCount: number;
  reviewAvg: number | null;
}

export interface Application {
  id: string;
  opportunityId: string;
  talentId: string;
  pitch: string;
  bidAmount: number | null;
  bidType: string;
  status: string;
  fitScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  query: string;
  filters: Record<string, string>;
  emailAlerts: boolean;
  createdAt: string;
}
