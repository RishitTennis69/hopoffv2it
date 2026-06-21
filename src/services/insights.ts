// "That's enough time to…" bullets + block-screen alternatives.
//
// MOCK: blends the user's own goals with templated, time-scaled suggestions.
// TODO(real): generate with an LLM keyed on weekHours + the user's goals.

const TEMPLATE_BY_HOURS: { min: number; line: string }[] = [
  { min: 12, line: 'read 3 full books' },
  { min: 8, line: 'learn the basics of a new language' },
  { min: 5, line: 'train for a 10k' },
  { min: 3, line: 'read 3 chapters' },
  { min: 1, line: 'cook a proper dinner' },
  { min: 0, line: 'go for a walk' },
];

/** Dashboard bullets — action verbs, scaled to hours wasted this week. */
export function enoughTimeTo(weekHours: number, goals: string[]): string[] {
  const bullets: string[] = [];
  // Lead with the user's own goals when present.
  goals.slice(0, 2).forEach((g) => bullets.push(g.toLowerCase()));
  for (const t of TEMPLATE_BY_HOURS) {
    if (weekHours >= t.min && !bullets.includes(t.line)) {
      bullets.push(t.line);
      if (bullets.length >= 3) break;
    }
  }
  return bullets.slice(0, 3);
}

/** Single alternative line surfaced on the block screen. */
export function blockAlternative(goals: string[]): string {
  if (goals.length) {
    const pick = goals[Math.floor(Math.random() * goals.length)];
    return pick.toLowerCase();
  }
  const fallback = ['read 10 pages', 'go for a walk', 'call a friend', 'train'];
  return fallback[Math.floor(Math.random() * fallback.length)];
}
