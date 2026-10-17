import type { Metadata } from "next";
import TeamWorkspaceView from "./workspace-view";

export const metadata: Metadata = {
  title: "Team workspace — Sckoll",
  description: "Your shortlist, team notes, and next steps in one hiring room.",
};

export default function Page() {
  return <TeamWorkspaceView />;
}
