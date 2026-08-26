import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sckoll — Email Infrastructure That Scales",
  description:
    "Send transactional emails, marketing campaigns, and API-driven messages with 99.99% deliverability. Built for developers, loved by teams.",
  keywords: ["email API", "transactional email", "email infrastructure", "email delivery"],
  openGraph: {
    title: "Sckoll — Email Infrastructure That Scales",
    description: "Send transactional emails and marketing campaigns with 99.99% deliverability.",
    url: "https://sckoll.com",
    siteName: "Sckoll",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
