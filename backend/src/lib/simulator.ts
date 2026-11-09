import { eq, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { matches, chatMessages } from "../db/schema.js";

const FAN_NAMES = ["ArsenalSupporter", "MerseysideRed", "MadridistaKing", "BlaugranaFan", "BavarianPride", "LakersDynasty", "GoldenStateSplash"];
const FAN_COMMENTS = [
  "What a match! 🔥",
  "Great defending on that last play!",
  "Stream quality is buttery smooth today 👏",
  "Ref needs glasses on that decision! 🟨",
  "Sckoll 4K is unbeatable!",
  "Let's goooo! ⚽⚽",
  "Corner coming up!",
];

export function startLiveSimulation(databaseUrl: string) {
  const db = getDb(databaseUrl);

  const timer = setInterval(async () => {
    try {
      const liveMatches = await db.select().from(matches).where(eq(matches.status, "live"));

      for (const m of liveMatches) {
        let nextMinute = m.minute + 1;
        let nextPeriod = m.period;
        let nextStatus = m.status;

        if (m.sportId === "football") {
          if (nextMinute === 45) {
            nextPeriod = "Halftime";
          } else if (nextMinute > 45 && nextMinute <= 90) {
            nextPeriod = "2nd Half";
          } else if (nextMinute > 90) {
            nextMinute = 90;
            nextStatus = "finished";
            nextPeriod = "FT";
          }
        }

        // Slight realistic viewer jitter
        const viewerDelta = Math.floor(Math.random() * 80) - 35;
        const nextViewers = Math.max(100, m.viewersCount + viewerDelta);

        await db
          .update(matches)
          .set({
            minute: nextMinute,
            period: nextPeriod,
            status: nextStatus,
            viewersCount: nextViewers,
            updatedAt: new Date(),
          })
          .where(eq(matches.id, m.id));

        // 20% chance of random simulated live fan comment
        if (Math.random() < 0.2) {
          const randomUser = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
          const randomMsg = FAN_COMMENTS[Math.floor(Math.random() * FAN_COMMENTS.length)];
          await db.insert(chatMessages).values({
            matchId: m.id,
            username: randomUser,
            message: randomMsg,
            userBadge: "FAN",
          });
        }
      }
    } catch {
      // Ignore background simulation errors quietly
    }
  }, 25000);

  return () => clearInterval(timer);
}
