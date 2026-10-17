import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Sckoll",
  description: "Talk to the Sckoll team about work, talent, or partnerships.",
};

export default function ContactPage() {
  return <ContactForm />;
}
