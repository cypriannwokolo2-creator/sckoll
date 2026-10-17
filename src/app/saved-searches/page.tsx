import type { Metadata } from "next";
import SavedSearchesView from "./saved-view";

export const metadata: Metadata = {
  title: "Saved searches — Sckoll",
  description: "Save the roles, skills, and project patterns you care about.",
};

export default function Page() {
  return <SavedSearchesView />;
}
