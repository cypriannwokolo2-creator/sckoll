import type { Metadata } from "next";
import PostProjectForm from "./post-form";

export const metadata: Metadata = {
  title: "Post a project — Sckoll",
  description: "Describe the outcome you need and let Sckoll find the strongest fit.",
};

export default function Page() {
  return <PostProjectForm />;
}
