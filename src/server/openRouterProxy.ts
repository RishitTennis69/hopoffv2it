import {
  asNumber,
  asString,
  asStringArray,
  badRequest,
  cleanOneLine,
  jsonResponse,
  readJsonBody,
  serverError,
  serviceUnavailable,
} from './proxyUtils';

type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

function apiKey() {
  return process.env.OPENROUTER_API_KEY?.trim() ?? '';
}

function model() {
  return process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';
}

async function askOpenRouter(messages: ChatMessage[], maxTokens = 120, temperature = 0.4) {
  const key = apiKey();
  if (!key) return null;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.HOPOFF_PUBLIC_URL ?? 'https://gethopoff.app',
      'X-Title': 'HopOff',
    },
    body: JSON.stringify({
      model: model(),
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[openrouter-proxy] upstream failed', response.status, body.slice(0, 300));
    throw new Error('OpenRouter upstream failed');
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  return typeof text === 'string' ? cleanOneLine(text, 2000) : '';
}

function goalsText(goals: string[]) {
  return goals.length ? goals.map((goal, idx) => `${idx + 1}. ${goal}`).join('\n') : 'No goals provided.';
}

function cleanGoalAction(text: string) {
  return cleanOneLine(text, 100)
    .replace(/^instead(?:\s+of)?[:,\s-]*/i, '')
    .replace(/^you should\s+/i, '')
    .replace(/^go\s+and\s+/i, '')
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bmine\b/gi, 'yours')
    .replace(/\.$/, '')
    .trim();
}

export async function polishGoals(request: Request) {
  try {
    const body = await readJsonBody(request);
    const text = asString((body as { text?: unknown }).text, 2000);
    if (!text) return badRequest('Missing goal text');
    if (!apiKey()) return serviceUnavailable();

    const answer = await askOpenRouter([
      {
        role: 'system',
        content:
          'Clean up the user goals for grammar, spelling, and formatting only. Do not add new goals, remove meaning, or make them motivational. Return only the polished list, one goal per line.',
      },
      { role: 'user', content: text },
    ], 260, 0.2);

    return jsonResponse({ text: answer ?? '' });
  } catch (error) {
    return serverError(error, 'polish goals');
  }
}

export async function enoughTime(request: Request) {
  try {
    const body = await readJsonBody(request);
    const weekHours = Math.max(0.5, Math.min(168, asNumber((body as { weekHours?: unknown }).weekHours, 0)));
    const focusGoal = asString((body as { focusGoal?: unknown }).focusGoal, 200);
    const goals = asStringArray((body as { goals?: unknown }).goals, 20, 200);
    if (!weekHours) return badRequest('Missing weekly hours');
    if (!apiKey()) return serviceUnavailable();

    const answer = await askOpenRouter([
      {
        role: 'system',
        content:
          'Write one natural, concrete "enough time to" phrase for a screen-time app. Tie it to the user goals when possible. No preamble, no quotes, no period. Avoid awkward phrases like "towards reading".',
      },
      {
        role: 'user',
        content: `Weekly reclaimed time: ${weekHours} hours\nFocus goal: ${focusGoal}\nAll goals:\n${goalsText(goals)}\nReturn a fragment that fits after "That's enough time to".`,
      },
    ], 60, 0.5);

    return jsonResponse({ line: cleanGoalAction(answer ?? '') });
  } catch (error) {
    return serverError(error, 'enough time');
  }
}

export async function blockAlternative(request: Request) {
  try {
    const body = await readJsonBody(request);
    const focusGoal = asString((body as { focusGoal?: unknown }).focusGoal, 200);
    const goals = asStringArray((body as { goals?: unknown }).goals, 20, 200);
    if (!goals.length && !focusGoal) return badRequest('Missing goals');
    if (!apiKey()) return serviceUnavailable();

    const answer = await askOpenRouter([
      {
        role: 'system',
        content:
          'Return one short imperative action for a user who just got blocked from scrolling. Rotate across all goals. Be concrete and natural, e.g. "read 5 pages of your next book" or "practice one speech out loud". No preamble, no quotes, no period.',
      },
      {
        role: 'user',
        content: `Current focus goal: ${focusGoal}\nAll user goals:\n${goalsText(goals)}`,
      },
    ], 50, 0.65);

    return jsonResponse({ text: cleanGoalAction(answer ?? '') });
  } catch (error) {
    return serverError(error, 'block alternative');
  }
}

export async function goalAppSuggestions(request: Request) {
  try {
    const body = await readJsonBody(request, 20_000);
    const goals = asStringArray((body as { goals?: unknown }).goals, 20, 200);
    const max = Math.max(1, Math.min(5, Math.round(asNumber((body as { max?: unknown }).max, 5))));
    const candidatesRaw = Array.isArray((body as { candidates?: unknown }).candidates)
      ? (body as { candidates: unknown[] }).candidates
      : [];
    const candidates = candidatesRaw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const candidate = item as { id?: unknown; name?: unknown; keywords?: unknown };
        const id = asString(candidate.id, 80);
        const name = asString(candidate.name, 80);
        const keywords = asStringArray(candidate.keywords, 20, 40);
        return id && name ? { id, name, keywords } : null;
      })
      .filter(Boolean)
      .slice(0, 20) as { id: string; name: string; keywords: string[] }[];

    if (!goals.length || !candidates.length) return jsonResponse({ ids: candidates.slice(0, max).map((app) => app.id) });
    if (!apiKey()) return serviceUnavailable();

    const answer = await askOpenRouter([
      {
        role: 'system',
        content:
          'Rank productive redirect apps for a user based on their goals. Return only a JSON array of candidate ids. Exclude distracting/social apps if present.',
      },
      {
        role: 'user',
        content: JSON.stringify({ goals, max, candidates }),
      },
    ], 120, 0.2);

    let ids: string[] = [];
    try {
      const parsed = JSON.parse(answer ?? '[]');
      ids = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      ids = (answer ?? '').split(/[\s,\n]+/).map((id) => id.replace(/["[\]]/g, '').trim()).filter(Boolean);
    }

    const allowed = new Set(candidates.map((app) => app.id));
    return jsonResponse({ ids: ids.filter((id) => allowed.has(id)).slice(0, max) });
  } catch (error) {
    return serverError(error, 'goal app suggestions');
  }
}

