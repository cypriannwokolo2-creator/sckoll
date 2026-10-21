"use client";

import Link from "next/link";
import { useSession } from "@/lib/use-session";

/**
 * The auth slot of a nav row.
 *
 * Visitors get "Log in" + "Sign up"; someone who already has a session gets
 * a link to their workspace instead — nobody should be invited to sign in
 * while already signed in.
 */
export default function AuthNavActions({
  signUpLabel = "Sign up",
  signUpHref = "/sign-up",
  linkClassName,
}: {
  signUpLabel?: string;
  signUpHref?: string;
  linkClassName?: string;
}) {
  const session = useSession();

  if (session.status === "signed-in") {
    return (
      <Link href="/profile" className={linkClassName}>
        Your workspace
      </Link>
    );
  }

  return (
    <>
      <Link href="/sign-in" className={linkClassName}>
        Log in
      </Link>
      <Link href={signUpHref} className="sckoll-button sckoll-button-acid sckoll-button-small">
        {signUpLabel}
      </Link>
    </>
  );
}
