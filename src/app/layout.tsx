import type { Metadata } from "next";
import { Maven_Pro, Julius_Sans_One } from "next/font/google";
import "./globals.css";

const maven = Maven_Pro({
  variable: "--font-maven",
  subsets: ["latin"],
});

const julius = Julius_Sans_One({
  variable: "--font-julius",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sckoll — Find work. Get paid. Every occupation.",
  description:
    "The end-to-end platform for every occupation: find work and clients, send AI-drafted proposals, sign contracts, deliver the job, and get paid — all in one flow. Free to start.",
  keywords: [
    "find work",
    "freelance platform",
    "AI proposals",
    "contracts",
    "get paid",
    "invoicing",
    "all occupations",
  ],
  openGraph: {
    title: "Sckoll — Find work. Get paid. Every occupation.",
    description:
      "Find work, send AI proposals, get contracts signed, deliver, and get paid — one flow for every occupation.",
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
    <html lang="en" className={`${maven.variable} ${julius.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#050505] font-sans text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  );
}
