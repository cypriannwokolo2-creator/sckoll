import type { Metadata } from "next";
import ContractsView from "./contracts-view";

export const metadata: Metadata = {
  title: "Contracts — Sckoll",
  description: "Scope, milestones, messages, and reviews for your work agreements.",
};

export default function Page() {
  return <ContractsView />;
}
