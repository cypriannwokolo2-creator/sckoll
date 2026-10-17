import type { Metadata } from "next";
import NotificationsView from "./notifications-view";

export const metadata: Metadata = {
  title: "Notifications — Sckoll",
  description: "Applications, shortlists, matches, and account events.",
};

export default function Page() {
  return <NotificationsView />;
}
