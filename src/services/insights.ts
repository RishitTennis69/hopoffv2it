// "That's enough time to..." + block-screen alternatives.
//
// Uses a server-side AI proxy when configured; otherwise templates.

import { config } from '@/config';
import { postProxyJson, readString } from './secureApi';

const TEMPLATE_BY_HOURS: { min: number; line: string }[] = [
  { min: 12, line: 'read a short book or finish a serious first project draft' },
  { min: 8, line: 'take four focused practice blocks on something that matters' },
  { min: 5, line: 'finish several real workouts or deep work sessions' },
  { min: 3, line: 'read a meaningful chunk of a book you keep delaying' },
  { min: 1, line: 'finish one focused workout, call, walk, or study block' },
  { min: 0, line: 'finish one workout you keep postponing' },
];

let enoughTimeGoalIndex = -1;
let blockGoalIndex = -1;

function pickRotatingGoal(goals: string[], lastIndex: number) {
  if (!goals.length) return { goal: '', index: -1 };
  const index = (lastIndex + 1) % goals.length;
  return { goal: goals[index], index };
}

function cleanActionFragment(line: string) {
  return line
    .replace(/\bmy\b/gi, 'your')
    .replace(/\bmine\b/gi, 'yours')
    .replace(/\bmyself\b/gi, 'yourself')
    .trim();
}

function mockEnoughTimeTo(weekHours: number, goals: string[]): string[] {
  const hours = Math.max(0.5, Math.round(weekHours * 10) / 10);
  if (goals.length) {
    const picked = pickRotatingGoal(goals, enoughTimeGoalIndex);
    enoughTimeGoalIndex = picked.index;
    const goal = cleanActionFragment(picked.goal.toLowerCase());
    if (goal.includes('read')) return [`read about ${Math.max(25, Math.round(hours * 35))} pages of your next book`];
    if (goal.includes('gym') || goal.includes('workout') || goal.includes('train')) {
      return [`finish ${Math.max(1, Math.round(hours))} focused workout${Math.round(hours) === 1 ? '' : 's'}`];
    }
    if (goal.includes('guitar') || goal.includes('music') || goal.includes('piano') || goal.includes('practice')) {
      return [`practice ${goal.replace(/^practice\s+/, '')} for ${hours} focused hour${hours === 1 ? '' : 's'}`];
    }
    if (goal.includes('family') || goal.includes('friend') || goal.includes('call')) {
      return [`spend ${hours} phone-free hour${hours === 1 ? '' : 's'} on ${goal}`];
    }
    return [`spend ${hours} focused hour${hours === 1 ? '' : 's'} on ${goal}`];
  }

  for (const t of TEMPLATE_BY_HOURS) {
    if (weekHours >= t.min) return [t.line];
  }
  return [TEMPLATE_BY_HOURS[TEMPLATE_BY_HOURS.length - 1].line];
}

async function proxyEnoughTimeTo(weekHours: number, goals: string[]): Promise<string[]> {
  const hours = Math.max(0.5, Math.round(weekHours * 10) / 10);
  const picked = pickRotatingGoal(goals, enoughTimeGoalIndex);
  enoughTimeGoalIndex = picked.index;
  const content = await postProxyJson(
    '/ai/enough-time',
    {
      weekHours: hours,
      focusGoal: picked.goal.slice(0, 200),
      goals: goals.slice(0, 20).map((goal) => goal.slice(0, 200)),
    },
    (data) => {
      if (!data || typeof data !== 'object') return undefined;
      return readString((data as { line?: unknown }).line, 160);
    },
  );
  if (!content) throw new Error('AI proxy returned empty content');

  const line = content
    .replace(/^that's enough time to\s*/i, '')
    .replace(/^[-\d.\s"]+/, '')
    .replace(/[".]+$/, '')
    .trim();

  return [line || mockEnoughTimeTo(weekHours, goals)[0]];
}

/** One vivid line for the Progress dashboard - scaled to hours + user goals. */
export async function generateEnoughTimeInsights(
  weekHours: number,
  goals: string[],
): Promise<string[]> {
  if (weekHours <= 0) return [];

  if (config.useOpenRouterInsights) {
    try {
      return await proxyEnoughTimeTo(weekHours, goals);
    } catch (err) {
      console.warn('[insights] AI proxy failed, using mock:', err);
    }
  }

  return mockEnoughTimeTo(weekHours, goals);
}

/** @deprecated Use generateEnoughTimeInsights - kept for sync fallbacks. */
export function enoughTimeTo(weekHours: number, goals: string[]): string[] {
  return mockEnoughTimeTo(weekHours, goals);
}

const BLOCK_HEADLINE_TEMPLATES: ((appName: string) => [string, string])[] = [
  (app) => ['Enough scrolling.', `Your ${app} limit's up.`],
  (app) => ['Time to hop off.', `${app} can wait.`],
  (app) => ['This feed had its turn.', `Step away from ${app}.`],
  (app) => ['You hit your limit.', `Close ${app} for now.`],
  (app) => ['Pause the scroll.', `${app} isn't going anywhere.`],
  (app) => ['Your future self called.', `It wants you off ${app}.`],
  (app) => ['Not one more swipe.', `${app} - you're done for today.`],
  (app) => ['Break the loop.', `You set a limit on ${app}.`],
];

let lastBlockHeadlineIndex = -1;

/** Two-line headline for the block / intervention screen - random each visit, avoids immediate repeat. */
export function pickBlockHeadline(appName: string): [string, string] {
  const count = BLOCK_HEADLINE_TEMPLATES.length;
  let idx = Math.floor(Math.random() * count);
  if (count > 1) {
    let guard = 0;
    while (idx === lastBlockHeadlineIndex && guard < 8) {
      idx = Math.floor(Math.random() * count);
      guard += 1;
    }
  }
  lastBlockHeadlineIndex = idx;
  return BLOCK_HEADLINE_TEMPLATES[idx](appName);
}

function mockBlockAlternative(goals: string[]): string {
  if (!goals.length) {
    const fallback = ['read a few pages', 'take a short walk', 'call someone', 'stretch for five minutes'];
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  const picked = pickRotatingGoal(goals, blockGoalIndex);
  blockGoalIndex = picked.index;
  const goal = picked.goal;
  const cleaned = cleanActionFragment(goal.toLowerCase());
  if (cleaned.includes('read')) return 'read 5 pages of your next book';
  if (cleaned.includes('run')) return 'take a 10-minute run';
  if (cleaned.includes('workout') || cleaned.includes('gym') || cleaned.includes('train')) return 'do one focused workout set';
  if (cleaned.includes('study')) return 'study one focused page';
  const words = goal.replace(/^[-\d.\s]+/, '').trim().split(/\s+/);
  if (words.length <= 4) return cleanActionFragment(words.join(' ').toLowerCase());
  return `${words.slice(0, 4).join(' ').toLowerCase()}...`;
}

async function proxyBlockAlternative(goals: string[]): Promise<string> {
  const picked = pickRotatingGoal(goals, blockGoalIndex);
  blockGoalIndex = picked.index;
  const content = await postProxyJson(
    '/ai/block-alternative',
    {
      focusGoal: picked.goal.slice(0, 200),
      goals: goals.slice(0, 20).map((goal) => goal.slice(0, 200)),
    },
    (data) => {
      if (!data || typeof data !== 'object') return undefined;
      return readString((data as { text?: unknown }).text, 80);
    },
  );
  if (!content) throw new Error('AI proxy returned empty content');

  return cleanActionFragment(content
    .replace(/^[-\d.\s"]+/, '')
    .replace(/[".]+$/, '')
    .trim()
    .toLowerCase());
}

/** Short action fragment for the block screen - not the full goal line. */
export async function generateBlockAlternative(goals: string[]): Promise<string> {
  if (config.useOpenRouterInsights && goals.length) {
    try {
      return await proxyBlockAlternative(goals);
    } catch (err) {
      console.warn('[insights] block alternative AI proxy failed, using mock:', err);
    }
  }
  return mockBlockAlternative(goals);
}

/** @deprecated Use generateBlockAlternative */
export function blockAlternative(goals: string[]): string {
  return mockBlockAlternative(goals);
}
