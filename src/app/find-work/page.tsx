import type { Metadata } from "next";
import FindWorkPage from "./feed";

export const metadata: Metadata = {
  title: "Find work — Sckoll",
  description: "Browse live projects, contracts, and roles matched to your skills.",
};

export default function Page() {
  return <FindWorkPage />;
}
