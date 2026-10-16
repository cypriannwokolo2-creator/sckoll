import type { Metadata } from "next";
import ProfileSetupForm from "./setup-form";

export const metadata: Metadata = {
  title: "Set up your profile — Sckoll",
  description: "Complete your Sckoll work or talent profile.",
};

export default function ProfileSetupPage() {
  return <ProfileSetupForm />;
}
