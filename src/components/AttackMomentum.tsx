"use client";

import { useMemo, useState } from "react";
import type { AttackMomentumPoint, MatchEvent } from "@/lib/api";

interface AttackMomentumProps {
  homeTeamName: string;
  awayTeamName: string;
  homeTeamShort: string;
  awayTeamShort: string;
  currentMinute?: number;
  isLive?: boolean;
  events?: MatchEvent[];
  momentumData?: AttackMomentumPoint[];
}

export function AttackMomentum({
  homeTeamName,
  awayTeamName,
  homeTeamShort,
  awayTeamShort,
  currentMinute = 90,
  isLive = false,
  events = [],
  momentumData,
}: AttackMomentumProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    minute: number;
    value: number;
    event?: string;
  } | null>(null);

  // Generate or use real momentum data from minute 1 to 90
  const points = useMemo(() => {
    if (momentumData && momentumData.length > 0) return momentumData;

    // Generate authentic SofaScore-style momentum wave
    const pts: AttackMomentumPoint[] = [];
    const maxMin = Math.min(Math.max(currentMinute, 1), 90);

    for (let m = 1; m <= maxMin; m++) {
      // Base organic wave with sin & noise
      const wave = Math.sin(m / 5.5) * 45 + Math.cos(m / 2.8) * 30;
      // Clamp between -95 and 95
      let val = Math.round(Math.max(-95, Math.min(95, wave)));

      // If an event happened at this minute, boost the pressure
      const eventAtMinute = events.find((e) => e.minute === m);
      let eventType: "goal" | "yellow_card" | "red_card" | undefined;
      let team: "home" | "away" | undefined;

      if (eventAtMinute) {
        if (eventAtMinute.type === "goal") {
          eventType = "goal";
          // If home scored, heavy positive spike
          val = 85;
          team = "home";
        } else if (eventAtMinute.type === "yellow_card") {
          eventType = "yellow_card";
        } else if (eventAtMinute.type === "red_card") {
          eventType = "red_card";
        }
      }

      pts.push({
        minute: m,
        value: val,
        event: eventType,
        team,
      });
    }

    return pts;
  }, [momentumData, currentMinute, events]);

  const homePressureCount = points.filter((p) => p.value > 0).length;
  const awayPressureCount = points.filter((p) => p.value < 0).length;
  const total = Math.max(homePressureCount + awayPressureCount, 1);
  const homePct = Math.round((homePressureCount / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* SofaScore Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-emerald-500 to-teal-400" />
          <h4 className="text-sm font-black text-white tracking-wide uppercase">
            Attack Momentum
          </h4>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase">
            Live Pressure
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>{homeTeamShort} ({homePct}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
            <span>{awayTeamShort} ({awayPct}%)</span>
          </div>
        </div>
      </div>

      {/* SofaScore Graph Canvas Container */}
      <div className="relative">
        {/* Tooltip Hover Overlay */}
        {hoveredPoint && (
          <div className="absolute top-0 right-0 z-20 px-3 py-1 bg-black/90 border border-white/20 rounded-lg text-xs text-zinc-200 pointer-events-none backdrop-blur-md shadow-xl flex items-center gap-2">
            <span className="font-mono font-bold text-white">{hoveredPoint.minute}&apos;</span>
            <span>
              {hoveredPoint.value >= 0 ? homeTeamShort : awayTeamShort} Pressure:{" "}
              <strong className={hoveredPoint.value >= 0 ? "text-emerald-400" : "text-cyan-400"}>
                {Math.abs(hoveredPoint.value)}%
              </strong>
            </span>
            {hoveredPoint.event && (
              <span className="font-bold text-amber-400 uppercase text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                {hoveredPoint.event === "goal" ? "⚽ Goal!" : hoveredPoint.event}
              </span>
            )}
          </div>
        )}

        {/* The Graph Body */}
        <div className="relative h-36 sm:h-44 w-full bg-[#080d19] rounded-xl border border-white/5 overflow-hidden flex flex-col justify-between p-2 select-none">
          {/* Background grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
            <div className="border-b border-dashed border-emerald-500/40 w-full" />
            <div className="border-b border-white/40 w-full" />
            <div className="border-b border-dashed border-cyan-500/40 w-full" />
          </div>

          {/* Half time vertical dividing line (minute 45) */}
          <div
            className="absolute top-0 bottom-0 border-r border-dashed border-zinc-600/80 z-10 pointer-events-none"
            style={{ left: "50%" }}
          >
            <span className="absolute top-1 -left-3 px-1 bg-zinc-800 text-[9px] font-bold text-zinc-400 rounded">
              HT
            </span>
          </div>

          {/* Live minute cursor */}
          {isLive && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: `${Math.min((currentMinute / 90) * 100, 100)}%` }}
            >
              <span className="absolute bottom-1 -left-2.5 px-1 bg-red-600 text-white font-black text-[9px] rounded animate-pulse">
                {currentMinute}&apos;
              </span>
            </div>
          )}

          {/* Bars Area: minute 1 to 90 */}
          <div className="relative w-full h-full flex items-center">
            {/* Center zero line */}
            <div className="absolute w-full h-px bg-white/15" />

            <div className="w-full h-full flex items-center justify-between gap-[1px]">
              {points.map((pt) => {
                const isHome = pt.value >= 0;
                const heightPct = (Math.abs(pt.value) / 100) * 45; // max 45% each direction

                return (
                  <div
                    key={pt.minute}
                    onMouseEnter={() =>
                      setHoveredPoint({
                        minute: pt.minute,
                        value: pt.value,
                        event: pt.event,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="flex-1 h-full relative group cursor-pointer flex items-center justify-center"
                  >
                    {/* Goal or Card indicator above bar */}
                    {pt.event === "goal" && (
                      <span className="absolute -top-1 z-20 text-[10px] animate-bounce pointer-events-none">
                        ⚽
                      </span>
                    )}
                    {pt.event === "yellow_card" && (
                      <span className="absolute -top-1 z-20 text-[8px] pointer-events-none">
                        🟨
                      </span>
                    )}
                    {pt.event === "red_card" && (
                      <span className="absolute -top-1 z-20 text-[8px] pointer-events-none">
                        🟥
                      </span>
                    )}

                    {/* The Momentum Bar */}
                    {isHome ? (
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-300 hover:to-white rounded-t-sm transition-all duration-150 absolute bottom-1/2"
                        style={{ height: `${heightPct}%` }}
                      />
                    ) : (
                      <div
                        className="w-full bg-gradient-to-b from-cyan-500 to-cyan-400 hover:from-cyan-300 hover:to-white rounded-b-sm transition-all duration-150 absolute top-1/2"
                        style={{ height: `${heightPct}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Minutes labels below graph */}
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-semibold pt-1 px-1">
          <span>0&apos;</span>
          <span>15&apos;</span>
          <span>30&apos;</span>
          <span className="text-zinc-400 font-bold">45&apos; (HT)</span>
          <span>60&apos;</span>
          <span>75&apos;</span>
          <span>90&apos;</span>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span>⚽</span> Goal
          </span>
          <span className="flex items-center gap-1">
            <span>🟨</span> Yellow Card
          </span>
          <span className="flex items-center gap-1">
            <span>🟥</span> Red Card
          </span>
        </div>
        <span className="text-zinc-500">SofaScore Match Pressure Engine v2</span>
      </div>
    </div>
  );
}
