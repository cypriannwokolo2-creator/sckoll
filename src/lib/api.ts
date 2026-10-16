/** Typed client for the Sckoll backend (api.sckoll.com in prod, localhost:8110 in dev). */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8110").replace(/\/$/, "");
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

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
  skills: string[];
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
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
  google: (input: { idToken: string; role?: string }) =>
    request<{ ok: boolean; user: PublicUser }>("/v1/auth/google", { method: "POST", body: JSON.stringify(input) }),
  logout: () => request<{ ok: boolean }>("/v1/auth/logout", { method: "POST" }),
  me: () => request<{ ok: boolean; user: PublicUser; profile: Profile | null }>("/v1/me"),
  verify: (input: { token: string; email: string }) =>
    request<{ ok: boolean; user: PublicUser }>("/v1/auth/verify", { method: "POST", body: JSON.stringify(input) }),
  forgot: (email: string) =>
    request<{ ok: boolean }>("/v1/auth/forgot", { method: "POST", body: JSON.stringify({ email }) }),
  reset: (input: { token: string; email: string; password: string }) =>
    request<{ ok: boolean }>("/v1/auth/reset", { method: "POST", body: JSON.stringify(input) }),
  patchProfile: (input: Partial<Profile> & { role?: string }) =>
    request<{ ok: boolean; profile: Profile }>("/v1/profiles/me", { method: "PATCH", body: JSON.stringify(input) }),
};
