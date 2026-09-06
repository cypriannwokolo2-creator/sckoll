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
  title: "Sckoll — Find the right work. Find the right people.",
  description:
    "Sckoll helps freelancers, job seekers, founders, agencies, and lean teams find relevant work or reliable talent without endless scrolling, form-filling, or recruiter overhead.",
  keywords: [
    "freelance platform",
    "job search automation",
    "talent sourcing",
    "AI proposals",
    "personalized outreach",
    "candidate matching",
    "get paid",
  ],
  openGraph: {
    title: "Sckoll — Find the right work. Find the right people.",
    description:
      "Find relevant opportunities, send better pitches, or source reliable talent without the manual grind.",
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
