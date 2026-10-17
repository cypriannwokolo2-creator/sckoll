import type { Metadata } from "next";
import PipelineView from "./pipeline-view";

export const metadata: Metadata = {
  title: "Your pipeline — Sckoll",
  description: "Track your applications from applied to accepted.",
};

export default function Page() {
  return <PipelineView />;
}
