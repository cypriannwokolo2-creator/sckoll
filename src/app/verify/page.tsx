import type { Metadata } from "next";
import VerifyPage from "./verify-form";

export const metadata: Metadata = {
  title: "Confirm your email — Sckoll",
  description: "Confirm your Sckoll account email.",
};

export default function Page() {
  return <VerifyPage />;
}
