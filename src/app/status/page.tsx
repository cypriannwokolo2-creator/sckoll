import type { Metadata } from "next";
import StatusView from "./status-view";

export const metadata: Metadata = {
  title: "Status — Sckoll",
  description: "Live status of the Sckoll marketplace, API, and authentication.",
};

export default function Page() {
  return <StatusView />;
}
