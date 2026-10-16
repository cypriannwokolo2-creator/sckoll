import type { Metadata } from "next";
import ResetPasswordPage from "./reset-form";

export const metadata: Metadata = {
  title: "Reset password — Sckoll",
  description: "Reset your Sckoll account password.",
};

export default function Page() {
  return <ResetPasswordPage />;
}
