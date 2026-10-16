import type { Metadata } from "next";
import ProfileView from "./profile-view";

export const metadata: Metadata = {
  title: "Your profile — Sckoll",
  description: "View and edit your Sckoll profile.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
