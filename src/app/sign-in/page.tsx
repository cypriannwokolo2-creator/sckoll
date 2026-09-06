import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Sign in — Sckoll",
  description: "Sign in to your Sckoll opportunity and work workspace.",
};

export default function SignInPage() {
  return <AuthPage mode="sign-in" />;
}
