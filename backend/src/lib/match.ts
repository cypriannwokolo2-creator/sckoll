/**
 * v1 rules-based fit scoring shared by talent search and applications.
 * Score range 50–99: base 50 + up to 49 from skill overlap. Embeddings later.
 */
export function computeFit(talentSkills: string[], oppSkills: string[]): number {
  if (talentSkills.length === 0 || oppSkills.length === 0) return 50;
  const mine = talentSkills.map((s) => s.toLowerCase());
  const hits = oppSkills.filter((s) =>
    mine.some((m) => m.includes(s.toLowerCase()) || s.toLowerCase().includes(m)),
  ).length;
  return Math.round(50 + (hits / oppSkills.length) * 49);
}
