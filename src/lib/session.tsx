"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, type PublicUser } from "@/lib/api";
import { clearSessionHint, markSessionHint } from "@/lib/session-hint";

/**
 * The browser's view of the session.
 *
 * The session cookie is host-only for the API origin (api.sckoll.com), so the
 * web origin cannot read it — the session has to be resolved on the client
 * against the API. This provider does that once per page load and shares the
 * answer with every consumer, so a page with several session-aware bits
 * still costs a single round-trip.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "signed-in"; user: PublicUser }
  | { status: "signed-out" };

export type SessionContextValue = SessionState & {
  /**
   * Who the visitor was when the session was first checked: "member" (they
   * already had a session) or "visitor". Null until that first check
   * resolves.
   *
   * Deliberately sticky: signing in *on* the page must not change it, or
   * the auth pages would bounce the visitor they just signed in.
   */
  settled: "member" | "visitor" | null;
  /** Re-check the session (after signing in or out). */
  refresh: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [settled, setSettled] = useState<"member" | "visitor" | null>(null);
  // A response that was already on its way when the session changed must not
  // be allowed to revive it: the generation counter invalidates it.
  const generation = useRef(0);

  const check = useCallback((gen: number) => {
    api
      .me()
      .then((res) => {
        if (gen !== generation.current) return;
        setSettled((current) => current ?? "member");
        markSessionHint();
        setState({ status: "signed-in", user: res.user });
      })
      .catch(() => {
        if (gen !== generation.current) return;
        setSettled((current) => current ?? "visitor");
        clearSessionHint();
        setState({ status: "signed-out" });
      });
  }, []);

  const refresh = useCallback(() => {
    const gen = ++generation.current;
    setState({ status: "loading" });
    check(gen);
  }, [check]);

  useEffect(() => {
    // The first check on mount — the state is already "loading".
    check(++generation.current);
  }, [check]);

  const value = useMemo(() => ({ ...state, settled, refresh }), [state, settled, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}
