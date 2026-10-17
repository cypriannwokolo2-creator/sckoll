import type { Metadata } from "next";
import SuccessStoriesView from "./success-view";

export const metadata: Metadata = {
  title: "Success stories — Sckoll",
  description: "Real completed contracts with five-star reviews from the Sckoll marketplace.",
};

export default function Page() {
  return <SuccessStoriesView />;
}
