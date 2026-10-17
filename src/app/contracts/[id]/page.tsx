import type { Metadata } from "next";
import ContractDetail from "./contract-detail";

export const metadata: Metadata = {
  title: "Contract — Sckoll",
  description: "Scope, milestones, messages, and reviews for this work agreement.",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ContractDetail params={params} />;
}
