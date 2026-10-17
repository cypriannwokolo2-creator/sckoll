import type { Metadata } from "next";
import FindTalentPage from "./talent-feed";

export const metadata: Metadata = {
  title: "Find talent — Sckoll",
  description: "Search talent by the outcome you need, ranked by fit.",
};

export default function Page() {
  return <FindTalentPage />;
}
