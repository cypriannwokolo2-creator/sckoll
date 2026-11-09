"use client";

import { useState } from "react";

interface LeagueLogoProps {
  leagueId?: string;
  name: string;
  country?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LEAGUE_LOGO_MAP: Record<string, string> = {
  "premier-league": "/logos/leagues/premier-league.svg",
  "champions-league": "/logos/leagues/champions-league.svg",
  "la-liga": "/logos/leagues/la-liga.svg",
  "serie-a": "/logos/leagues/serie-a.svg",
  bundesliga: "/logos/leagues/bundesliga.svg",
  nba: "/logos/leagues/nba.svg",
  ufc: "/logos/teams/ufc.svg",
};

const COUNTRY_FLAGS: Record<string, string> = {
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  spain: "🇪🇸",
  italy: "🇮🇹",
  germany: "🇩🇪",
  france: "🇫🇷",
  usa: "🇺🇸",
  europe: "⭐",
  global: "🌐",
};

export function LeagueLogo({
  leagueId,
  name,
  country,
  size = "md",
  className = "",
}: LeagueLogoProps) {
  const [imgError, setImgError] = useState(false);

  const localPath = leagueId ? LEAGUE_LOGO_MAP[leagueId.toLowerCase()] : null;

  const flag =
    (country && COUNTRY_FLAGS[country.toLowerCase()]) ||
    (name.toLowerCase().includes("premier") ? "🏴󠁧󠁢󠁥󠁮󠁧󠁿" : "🌐");

  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-5 h-5 text-sm",
    lg: "w-7 h-7 text-base",
  }[size];

  if (localPath && !imgError) {
    return (
      <div
        className={`relative ${sizeClasses} flex-shrink-0 flex items-center justify-center rounded-md overflow-hidden bg-white/5 p-0.5 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={localPath}
          alt={name}
          className="w-full h-full object-contain filter drop-shadow brightness-110"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return <span className={`flex-shrink-0 select-none ${sizeClasses} ${className}`}>{flag}</span>;
}
