"use client";

import Link from "next/link";
import { budgetLabel, fitEstimate, trackMatchEvent, type MatchScore, type Opportunity } from "@/lib/api";

/**
 * One opportunity in a feed grid: type/category, optional client-side fit badge,
 * budget line, ranking reasons, and the details link (which also emits the
 * `click` match event used to tune ranking).
 */
export default function OpportunityCard({ opp, viewerSkills }: { opp: Opportunity & MatchScore; viewerSkills: string[] }) {
  const fit = fitEstimate(viewerSkills, opp.skills);

  return (
    <article className="sckoll-sub-card">
      <p>
        {opp.type.toUpperCase()} · {opp.category.replace(/-/g, " ").toUpperCase()}
        {fit !== null && ` · ${fit}% FIT`}
      </p>
      <h3>{opp.title}</h3>
      <span>
        {budgetLabel(opp)}
        {opp.remote ? " · Remote" : opp.location ? ` · ${opp.location}` : ""}
      </span>
      {opp.reasons && opp.reasons.length > 0 && (
        <span style={{ marginTop: "0.4rem", color: "var(--acid)", filter: "brightness(0.75)" }}>
          Why: {opp.reasons.join(" · ")}
        </span>
      )}
      <Link
        href={`/find-work/${opp.id}`}
        onClick={() =>
          trackMatchEvent({
            eventType: "click",
            targetType: "opportunity",
            targetId: opp.id,
            scoreRules: opp.fitRules ?? undefined,
            scoreVector: opp.fitVector ?? undefined,
            finalScore: opp.fit ?? undefined,
          })
        }
      >
        View details
      </Link>
    </article>
  );
}
