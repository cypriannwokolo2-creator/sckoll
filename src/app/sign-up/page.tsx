import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "Sign up — Sckoll",
  description: "Create your Sckoll work or talent marketplace profile.",
};

export default function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}
