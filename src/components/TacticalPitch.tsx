"use client";

import { useState } from "react";
import type { LineupData, PlayerInfo } from "@/lib/api";
import { Shield, Users, Award } from "lucide-react";

interface TacticalPitchProps {
  homeTeam: {
    name: string;
    shortName: string;
    lineup: LineupData | null;
  };
  awayTeam: {
    name: string;
    shortName: string;
    lineup: LineupData | null;
  };
}

// Compute (x, y) coordinates for players based on common football positions
function getPositionCoordinates(pos: string, index: number, totalInLine: number): { x: number; y: number } {
  const p = pos.toUpperCase();

  // Goalkeeper
  if (p === "GK") return { x: 50, y: 88 };

  // Defenders
  if (p.includes("B") || p.includes("DF") || p === "CB" || p === "LB" || p === "RB") {
    // Spread evenly across backline
    const spread = 76 / Math.max(totalInLine - 1, 1);
    const x = totalInLine === 1 ? 50 : 12 + index * spread;
    return { x, y: 70 };
  }

  // Midfielders
  if (p.includes("M") || p.includes("MF") || p === "CM" || p === "CDM" || p === "CAM") {
    const spread = 74 / Math.max(totalInLine - 1, 1);
    const x = totalInLine === 1 ? 50 : 13 + index * spread;
    const yOffset = p === "CAM" ? 44 : p === "CDM" ? 56 : 50;
    return { x, y: yOffset };
  }

  // Forwards / Attackers
  if (p.includes("W") || p.includes("FW") || p === "ST" || p === "CF") {
    const spread = 70 / Math.max(totalInLine - 1, 1);
    const x = totalInLine === 1 ? 50 : 15 + index * spread;
    const yOffset = p === "ST" || p === "CF" ? 22 : 28;
    return { x, y: yOffset };
  }

  return { x: 50, y: 50 };
}

export function TacticalPitch({ homeTeam, awayTeam }: TacticalPitchProps) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");

  const currentTeam = selectedTeam === "home" ? homeTeam : awayTeam;
  const currentLineup = currentTeam.lineup;
  const startingXI: PlayerInfo[] = currentLineup?.startingEleven || [];
  const bench: PlayerInfo[] = currentLineup?.substitutes || [];

  // Group players by line (GK, DF, MF, FW) for coordinates
  const gk = startingXI.filter((p: PlayerInfo) => p.pos === "GK");
  const def = startingXI.filter((p: PlayerInfo) => ["CB", "LB", "RB", "RWB", "LWB"].includes(p.pos) || p.pos.includes("B"));
  const mid = startingXI.filter((p: PlayerInfo) => ["CM", "CDM", "CAM", "LM", "RM"].includes(p.pos) || p.pos.includes("M"));
  const fwd = startingXI.filter((p: PlayerInfo) => ["ST", "CF", "LW", "RW"].includes(p.pos) || p.pos.includes("W") || p.pos.includes("F"));

  return (
    <div className="space-y-6">
      {/* Team Toggle Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 p-1 bg-[#090f1d] rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setSelectedTeam("home")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedTeam === "home"
                ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{homeTeam.name}</span>
            <span className="text-[10px] opacity-75">({homeTeam.lineup?.formation || "4-3-3"})</span>
          </button>

          <button
            onClick={() => setSelectedTeam("away")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              selectedTeam === "away"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>{awayTeam.name}</span>
            <span className="text-[10px] opacity-75">({awayTeam.lineup?.formation || "4-2-3-1"})</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 hidden sm:flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Manager: <strong className="text-white">{currentLineup?.coach || "Head Coach"}</strong></span>
        </div>
      </div>

      {/* 2D TACTICAL PITCH BOARD */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[4/5] sm:aspect-[4/3] rounded-2xl tactical-pitch shadow-2xl p-4 flex flex-col justify-between">
        {/* Pitch Lines Markings */}
        <div className="pitch-halfway-line pointer-events-none" />
        <div className="pitch-center-circle pointer-events-none" />
        <div className="pitch-center-spot pointer-events-none" />
        <div className="pitch-penalty-box-top pointer-events-none" />
        <div className="pitch-goal-box-top pointer-events-none" />
        <div className="pitch-penalty-box-bottom pointer-events-none" />
        <div className="pitch-goal-box-bottom pointer-events-none" />

        {/* Formation Label Header Overlay */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/80 font-bold px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 w-fit mx-auto">
          <span>{currentTeam.name} Tactical Formation</span>
          <span className="ml-2 px-2 py-0.5 bg-emerald-500/30 text-emerald-300 rounded font-mono text-[11px]">
            {currentLineup?.formation || "4-3-3"}
          </span>
        </div>

        {/* Starting 11 Placed on Pitch */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Goalkeepers */}
          {gk.map((p: PlayerInfo, idx: number) => {
            const { x, y } = getPositionCoordinates(p.pos, idx, gk.length);
            return <PlayerNode key={p.number} player={p} x={x} y={y} isGk={true} teamColor={selectedTeam === "home" ? "emerald" : "cyan"} />;
          })}

          {/* Defenders */}
          {def.map((p: PlayerInfo, idx: number) => {
            const { x, y } = getPositionCoordinates(p.pos, idx, def.length);
            return <PlayerNode key={p.number} player={p} x={x} y={y} teamColor={selectedTeam === "home" ? "emerald" : "cyan"} />;
          })}

          {/* Midfielders */}
          {mid.map((p: PlayerInfo, idx: number) => {
            const { x, y } = getPositionCoordinates(p.pos, idx, mid.length);
            return <PlayerNode key={p.number} player={p} x={x} y={y} teamColor={selectedTeam === "home" ? "emerald" : "cyan"} />;
          })}

          {/* Forwards */}
          {fwd.map((p: PlayerInfo, idx: number) => {
            const { x, y } = getPositionCoordinates(p.pos, idx, fwd.length);
            return <PlayerNode key={p.number} player={p} x={x} y={y} teamColor={selectedTeam === "home" ? "emerald" : "cyan"} />;
          })}
        </div>

        {/* Bottom Pitch Note */}
        <div className="relative z-10 text-[10px] text-white/60 font-medium text-center bg-black/30 backdrop-blur-xs py-0.5 px-3 rounded-full mx-auto">
          Interactive Tactical Board • Attacking Upwards ↑
        </div>
      </div>

      {/* Substitutes / Bench Section */}
      {bench.length > 0 && (
        <div className="bg-[#090f1d] p-4 rounded-xl border border-white/10">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-zinc-400" />
            <span>Substitutes Bench ({bench.length})</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {bench.map((sub: PlayerInfo) => (
              <div
                key={sub.number}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs"
              >
                <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-mono font-bold text-[10px] text-zinc-300 flex-shrink-0">
                  {sub.number}
                </span>
                <div className="truncate">
                  <p className="font-semibold text-zinc-200 truncate">{sub.name}</p>
                  <span className="text-[10px] font-bold text-zinc-400">{sub.pos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerNode({
  player,
  x,
  y,
  isGk = false,
  teamColor,
}: {
  player: PlayerInfo;
  x: number;
  y: number;
  isGk?: boolean;
  teamColor: "emerald" | "cyan";
}) {
  const shortName = player.name.split(" ").slice(-1)[0]; // Last name

  return (
    <div
      style={{ left: `${x}%`, top: `${y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto group cursor-pointer"
    >
      {/* Jersey Circle Node */}
      <div
        className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-transform group-hover:scale-115 ${
          isGk
            ? "bg-amber-400 text-black ring-2 ring-amber-300 shadow-amber-500/40"
            : teamColor === "emerald"
            ? "bg-emerald-500 text-black ring-2 ring-emerald-300 shadow-emerald-500/40"
            : "bg-cyan-500 text-black ring-2 ring-cyan-300 shadow-cyan-500/40"
        }`}
      >
        <span>{player.number}</span>
        {player.captain && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center ring-1 ring-black">
            C
          </span>
        )}
      </div>

      {/* Player Name Pill */}
      <div className="mt-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[10px] font-bold text-white whitespace-nowrap shadow-md group-hover:bg-black transition-colors">
        {shortName}
      </div>

      {/* Position Tooltip on Hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 bg-[#0f172a] text-white text-[10px] font-semibold rounded border border-white/20 whitespace-nowrap pointer-events-none shadow-xl z-30">
        {player.name} • {player.pos}
      </div>
    </div>
  );
}
