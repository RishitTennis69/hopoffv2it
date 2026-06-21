// ---------------------------------------------------------------------------
// AI goal "polish" service.
//
// MOCK: tidies raw goal text into clean, action-oriented, newline-separated
// bullets using simple heuristics.
//
// TODO(real): replace `polishGoals` with an LLM call (e.g. OpenAI / Anthropic)
//   prompted to rewrite each line as a short imperative goal. Keep the
//   Promise<string> return shape.
// ---------------------------------------------------------------------------

const VERB_MAP: Record<string, string> = {
  read: 'Read',
  gym: 'Train at the gym',
  workout: 'Work out',
  run: 'Go for a run',
  sleep: 'Sleep earlier',
  cook: 'Cook a real meal',
  call: 'Call someone I love',
  study: 'Study',
  write: 'Write',
  meditate: 'Meditate',
  walk: 'Take a walk',
};

function tidyLine(raw: string): string {
  let line = raw.replace(/^[-•\d.\s]+/, '').trim();
  if (!line) return '';
  const lower = line.toLowerCase();
  for (const key of Object.keys(VERB_MAP)) {
    if (lower.startsWith(key)) {
      const rest = line.slice(key.length).trim();
      return rest ? `${VERB_MAP[key]} ${rest}` : VERB_MAP[key];
    }
  }
  return line.charAt(0).toUpperCase() + line.slice(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function polishGoals(text: string): Promise<string> {
  await delay(1100);
  const lines = text
    .split('\n')
    .map(tidyLine)
    .filter(Boolean);
  return Array.from(new Set(lines)).join('\n');
}
