"use client";

import { useEffect, useState } from "react";
import { api, type PublicUser } from "@/lib/api";

/**
 * Session state for the browser.
 *
 * The session cookie is host-only for the API origin (api.sckoll.com), so
 * the Next.js server cannot read it — the session has to be resolved on the
 * client. `loading` covers that first check, and a failed check is treated
 * as signed out so a network blip never blocks someone from signing in.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "signed-in"; user: PublicUser }
  | { status: "signed-out" };

/**
 * One in-flight session request shared by every consumer on the page, so a
 * nav that renders two session-aware bits still costs a single round-trip.
 * It is cleared once settled, so signing in or out is picked up immediately.
 */
let inflight: Promise<PublicUser | null> | null = null;

function requestSession(): Promise<PublicUser | null> {
  if (!inflight) {
    inflight = api
      .me()
      .then((res) => res.user)
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    requestSession().then((user) => {
      if (!alive) return;
      setState(user ? { status: "signed-in", user } : { status: "signed-out" });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** Where an already-authenticated visitor should land instead of the auth pages. */
export const SIGNED_IN_HOME = "/profile";
