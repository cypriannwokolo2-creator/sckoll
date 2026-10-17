import type { Metadata } from "next";
import PublicProfileView from "./public-view";

export const metadata: Metadata = {
  title: "Talent profile — Sckoll",
  description: "View skills, proof, and availability for this Sckoll talent.",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PublicProfileView params={params} />;
}
