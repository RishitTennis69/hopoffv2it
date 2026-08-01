// ---------------------------------------------------------------------------
// AI goal "polish" service.
//
// Uses a server-side AI proxy when configured; otherwise a lightweight
// heuristic mock. Third-party AI keys must never be bundled into this app.
// ---------------------------------------------------------------------------

import { config } from '@/config';
import { postProxyJson, readString } from './secureApi';

function tidyLine(raw: string): string {
  const line = raw.replace(/^[-•\d.\s]+/, '').trim();
  if (!line) return '';
  return line.charAt(0).toUpperCase() + line.slice(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockPolish(text: string): string {
  const inputLines = text.split('\n');
  const polished = inputLines.map(tidyLine);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of polished) {
    if (!line || seen.has(line.toLowerCase())) continue;
    seen.add(line.toLowerCase());
    out.push(line);
  }
  return out.join('\n');
}

async function openRouterPolish(text: string): Promise<string> {
  const content = await postProxyJson('/ai/polish-goals', { text: text.slice(0, 2000) }, (data) => {
    if (!data || typeof data !== 'object') return undefined;
    return readString((data as { text?: unknown }).text, 2000);
  });
  if (!content) throw new Error('OpenRouter returned empty content');
  return content;
}

export async function polishGoals(text: string): Promise<string> {
  if (config.useOpenRouterPolish) {
    try {
      return await openRouterPolish(text);
    } catch (err) {
      console.warn('[aiPolish] OpenRouter failed, using mock:', err);
    }
  }

  await delay(900);
  return mockPolish(text);
}
