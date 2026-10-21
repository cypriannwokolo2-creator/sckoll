"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";

/**
 * A call-to-action that adapts to the session: the sign-up pitch for
 * visitors, the next real action for members.
 *
 * A "hire" pitch (one that used to point at /sign-up?role=client) becomes
 * "post a project" for a client — and falls back to the workspace for
 * someone who signed up to find work, so the button never dead-ends.
 */
export default function AuthCta({
  href,
  label,
  className,
  signedInHref,
  signedInLabel,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  signedInHref?: string;
  signedInLabel?: string;
  /** Rendered after the label (e.g. an arrow icon). */
  children?: React.ReactNode;
}) {
  const session = useSession();

  if (session.status === "signed-in") {
    const hirePitch = href.includes("role=client");
    const isClient = session.user.role === "client" || session.user.role === "both";
    if (signedInHref) {
      return (
        <Link href={signedInHref} className={className}>
          {signedInLabel ?? label}
          {children}
        </Link>
      );
    }
    if (hirePitch && isClient) {
      return (
        <Link href="/post-project" className={className}>
          {signedInLabel ?? "Post your first project"}
          {children}
        </Link>
      );
    }
    return (
      <Link href="/profile" className={className}>
        {signedInLabel ?? "Open your workspace"}
        {children}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
      {children}
    </Link>
  );
}
