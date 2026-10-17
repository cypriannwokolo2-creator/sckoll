"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Unread-count bell. Silently hides for signed-out visitors. */
export default function NotifBell() {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .notifications(1, 0)
      .then((res) => {
        if (!cancelled) setUnread(res.unread);
      })
      .catch(() => undefined);
    const id = setInterval(() => {
      api
        .notifications(1, 0)
        .then((res) => {
          if (!cancelled) setUnread(res.unread);
        })
        .catch(() => undefined);
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (unread === null) return null;
  return (
    <Link href="/notifications" aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`} style={{ position: "relative", fontSize: "0.78rem" }}>
      <span aria-hidden="true" style={{ fontSize: "1rem" }}>◉</span>
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-0.45rem",
            right: "-0.6rem",
            minWidth: "1.05rem",
            height: "1.05rem",
            borderRadius: "999px",
            background: "var(--acid)",
            color: "var(--black)",
            fontSize: "0.62rem",
            fontWeight: 800,
            display: "grid",
            placeItems: "center",
            padding: "0 0.2rem",
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
