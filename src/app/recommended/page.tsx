import type { Metadata } from "next";
import RecommendedPage from "./recommended-view";

export const metadata: Metadata = {
  title: "Recommended — Sckoll",
  description: "Opportunities matched to your profile skills.",
};

export default function Page() {
  return <RecommendedPage />;
}
