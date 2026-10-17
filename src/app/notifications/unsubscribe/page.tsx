import type { Metadata } from "next";
import UnsubscribePage from "./unsubscribe-view";

export const metadata: Metadata = {
  title: "Unsubscribe — Sckoll",
  description: "Turn off Sckoll email notifications.",
};

export default function Page() {
  return <UnsubscribePage />;
}
