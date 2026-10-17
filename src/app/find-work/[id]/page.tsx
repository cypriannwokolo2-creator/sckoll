import type { Metadata } from "next";
import OpportunityDetail from "./detail";

export const metadata: Metadata = {
  title: "Opportunity — Sckoll",
  description: "View the brief, budget, and skills for this Sckoll opportunity.",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <OpportunityDetail params={params} />;
}
