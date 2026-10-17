import { describe, expect, it } from "vitest";
import { blendFit, cosine, localEmbed, opportunityText, vectorFit, EMBEDDING_DIM } from "./embeddings.js";
import { computeFit } from "./match.js";

describe("embeddings + hybrid scoring", () => {
  it("produces normalized vectors of the right dimension", () => {
    const v = localEmbed("Senior backend engineer with postgres and fastify experience");
    expect(v).toHaveLength(EMBEDDING_DIM);
    const norm = Math.sqrt(v.reduce((n, x) => n + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
    expect(localEmbed("")).toEqual(new Array(EMBEDDING_DIM).fill(0));
  });

  it("ranks related texts above unrelated ones", () => {
    const query = localEmbed("realtime logistics dashboard with maps");
    const related = localEmbed(opportunityText({ title: "Build a realtime dashboard for logistics tracking", description: "courier positions and map rendering", skills: ["react"] }));
    const unrelated = localEmbed(opportunityText({ title: "Technical writer for API docs", description: "developer documentation guides", skills: ["writing"] }));
    expect(cosine(query, related)).toBeGreaterThan(cosine(query, unrelated));
  });

  it("maps cosine onto 50..99 and blends 40/60", () => {
    expect(vectorFit(1)).toBe(99);
    expect(vectorFit(-1)).toBe(50);
    expect(blendFit(80, 90)).toBe(86);
    expect(computeFit(["react", "typescript"], ["react", "postgres"])).toBeGreaterThanOrEqual(50);
  });
});
