import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sckoll.com"),
  title: "Sckoll — Live Sports & Match Streaming | Ultra HD",
  description:
    "Stream live football, Premier League, UEFA Champions League, NBA, UFC and motorsport matches with 0% lag, real-time tactical lineups, live stats, and fan chat.",
  keywords: [
    "match streaming",
    "live sports stream",
    "football streams",
    "premier league live stream",
    "champions league stream",
    "nba live stream",
    "ufc live stream",
    "free live match",
    "live score and commentary",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sckoll — Live Sports & Match Streaming | Ultra HD",
    description:
      "Stream live football, Premier League, UEFA Champions League, NBA, UFC and motorsport matches with 0% lag and real-time stats.",
    url: "https://www.sckoll.com",
    siteName: "Sckoll",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sckoll — Live Sports & Match Streaming",
    description:
      "Watch live sports matches with zero lag, multi-server 4K streams, and interactive live fan chat.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-[#070a13] text-zinc-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
