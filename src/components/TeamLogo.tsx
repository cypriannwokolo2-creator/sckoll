"use client";

import { useState } from "react";
import Image from "next/image";

interface TeamLogoProps {
  teamId?: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Map team identifiers to local official high-definition crest paths
const TEAM_LOGO_MAP: Record<string, string> = {
  // Football
  arsenal: "/logos/teams/arsenal.png",
  "man-city": "/logos/teams/man-city.png",
  "manchester-city": "/logos/teams/man-city.png",
  liverpool: "/logos/teams/liverpool.png",
  chelsea: "/logos/teams/chelsea.png",
  "real-madrid": "/logos/teams/real-madrid.png",
  barcelona: "/logos/teams/barcelona.png",
  "fc-barcelona": "/logos/teams/barcelona.png",
  "bayern-munich": "/logos/teams/bayern-munich.png",
  dortmund: "/logos/teams/dortmund.png",
  "borussia-dortmund": "/logos/teams/dortmund.png",
  "inter-milan": "/logos/teams/inter-milan.png",
  juventus: "/logos/teams/juventus.png",
  tottenham: "/logos/teams/tottenham.png",
  "man-united": "/logos/teams/man-united.png",
  "manchester-united": "/logos/teams/man-united.png",
  "aston-villa": "/logos/teams/aston-villa.png",
  newcastle: "/logos/teams/newcastle.png",
  psg: "/logos/teams/psg.png",
  "ac-milan": "/logos/teams/ac-milan.png",
  // Basketball
  lakers: "/logos/teams/lakers.png",
  "la-lakers": "/logos/teams/lakers.png",
  warriors: "/logos/teams/warriors.png",
  "golden-state-warriors": "/logos/teams/warriors.png",
  celtics: "/logos/teams/celtics.png",
  bucks: "/logos/teams/bucks.png",
  // UFC
  ufc: "/logos/teams/ufc.svg",
};

// Club color styles for fallback badge
const TEAM_COLOR_MAP: Record<string, string> = {
  arsenal: "from-red-600 to-rose-700 text-white",
  "man-city": "from-sky-400 to-blue-600 text-black",
  liverpool: "from-red-700 to-rose-900 text-white",
  chelsea: "from-blue-600 to-indigo-800 text-white",
  "real-madrid": "from-zinc-100 to-amber-200 text-zinc-900",
  barcelona: "from-blue-700 via-rose-700 to-blue-800 text-yellow-300",
  "bayern-munich": "from-red-600 to-red-800 text-white",
  dortmund: "from-yellow-400 to-amber-500 text-black",
  "inter-milan": "from-blue-700 to-black text-white",
  juventus: "from-zinc-900 via-zinc-800 to-zinc-900 text-white border-white/30",
  tottenham: "from-white to-zinc-200 text-blue-950",
  "man-united": "from-red-600 to-yellow-600 text-white",
  "aston-villa": "from-purple-900 to-sky-400 text-yellow-300",
  newcastle: "from-zinc-900 via-zinc-800 to-zinc-900 text-white",
  lakers: "from-purple-700 to-amber-500 text-yellow-300",
  warriors: "from-blue-600 to-yellow-400 text-white",
};

function resolveLogoPath(teamId?: string, name?: string): string | null {
  if (teamId && TEAM_LOGO_MAP[teamId.toLowerCase()]) {
    return TEAM_LOGO_MAP[teamId.toLowerCase()];
  }

  if (name) {
    const lower = name.toLowerCase();
    if (lower.includes("arsenal")) return "/logos/teams/arsenal.png";
    if (lower.includes("city")) return "/logos/teams/man-city.png";
    if (lower.includes("liverpool")) return "/logos/teams/liverpool.png";
    if (lower.includes("chelsea")) return "/logos/teams/chelsea.png";
    if (lower.includes("madrid")) return "/logos/teams/real-madrid.png";
    if (lower.includes("barcelona")) return "/logos/teams/barcelona.png";
    if (lower.includes("bayern")) return "/logos/teams/bayern-munich.png";
    if (lower.includes("dortmund")) return "/logos/teams/dortmund.png";
    if (lower.includes("inter")) return "/logos/teams/inter-milan.png";
    if (lower.includes("juventus")) return "/logos/teams/juventus.png";
    if (lower.includes("tottenham")) return "/logos/teams/tottenham.png";
    if (lower.includes("united")) return "/logos/teams/man-united.png";
    if (lower.includes("villa")) return "/logos/teams/aston-villa.png";
    if (lower.includes("newcastle")) return "/logos/teams/newcastle.png";
    if (lower.includes("psg")) return "/logos/teams/psg.png";
    if (lower.includes("milan")) return "/logos/teams/ac-milan.png";
    if (lower.includes("lakers")) return "/logos/teams/lakers.png";
    if (lower.includes("warriors")) return "/logos/teams/warriors.png";
    if (lower.includes("celtics")) return "/logos/teams/celtics.png";
    if (lower.includes("bucks")) return "/logos/teams/bucks.png";
    if (lower.includes("ufc")) return "/logos/teams/ufc.svg";
  }

  return null;
}

export function TeamLogo({
  teamId,
  name,
  shortName,
  logoUrl,
  size = "md",
  className = "",
}: TeamLogoProps) {
  const [imgError, setImgError] = useState(false);

  const localLogo = resolveLogoPath(teamId, name);
  const resolvedSrc = (!imgError && localLogo) || (!imgError && logoUrl) || null;

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-8 h-8 text-xs",
    lg: "w-11 h-11 text-sm",
    xl: "w-14 h-14 sm:w-16 sm:h-16 text-base",
  }[size];

  const dim = {
    xs: 20,
    sm: 24,
    md: 32,
    lg: 44,
    xl: 64,
  }[size];

  const colorClass =
    (teamId && TEAM_COLOR_MAP[teamId.toLowerCase()]) ||
    "from-zinc-800 to-zinc-700 text-white";

  if (resolvedSrc) {
    return (
      <div
        className={`relative ${sizeClasses} flex-shrink-0 flex items-center justify-center rounded-xl p-0.5 bg-black/40 border border-white/10 shadow-sm overflow-hidden ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
          alt={`${name} club crest`}
          width={dim}
          height={dim}
          className="w-full h-full object-contain filter drop-shadow"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Graceful fallback with team primary color gradient & monogram
  return (
    <div
      className={`relative ${sizeClasses} flex-shrink-0 rounded-xl bg-gradient-to-tr ${colorClass} border border-white/15 flex items-center justify-center font-black shadow-md ${className}`}
      title={name}
    >
      <span>{shortName?.slice(0, 3) || name.slice(0, 3).toUpperCase()}</span>
    </div>
  );
}
