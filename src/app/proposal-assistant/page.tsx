import type { Metadata } from "next";
import ProposalAssistantView from "./assistant-view";

export const metadata: Metadata = {
  title: "Proposal assistant — Sckoll",
  description: "Turn your profile and the brief into a specific, human-sounding pitch.",
};

export default function Page() {
  return <ProposalAssistantView />;
}
