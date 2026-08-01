import { PRODUCTIVE_APPS, type ProductiveApp } from '@/data/productiveApps';
import { config } from '@/config';
import { getInstalledApps } from './nativeUsage';
import { postProxyJson, readStringArray } from './secureApi';

const DISTRACTING_PACKAGE_IDS = new Set([
  'com.zhiliaoapp.musically',
  'com.instagram.android',
  'com.google.android.youtube',
  'com.snapchat.android',
  'com.reddit.frontpage',
  'com.facebook.katana',
  'com.twitter.android',
]);

function scoreApp(app: ProductiveApp, goals: string[]) {
  const goalText = goals.join(' ').toLowerCase();
  let score = 0;
  for (const keyword of app.keywords) {
    if (goalText.includes(keyword)) score += 3;
  }
  if (score === 0) score = 1;
  return score;
}

function localRank(goals: string[], max: number, installedPackages: Set<string>) {
  return PRODUCTIVE_APPS.filter((app) => !DISTRACTING_PACKAGE_IDS.has(app.packageId))
    .map((app) => ({
      app,
      installed: installedPackages.has(app.packageId),
      score: scoreApp(app, goals),
    }))
    .sort((a, b) => Number(b.installed) - Number(a.installed) || b.score - a.score || a.app.name.localeCompare(b.app.name))
    .slice(0, max)
    .map((item) => item.app);
}

export function suggestGoalAppsLocal(goals: string[], max = 5): ProductiveApp[] {
  return localRank(goals, max, new Set());
}

async function openRouterRank(goals: string[], candidates: ProductiveApp[], max: number): Promise<ProductiveApp[]> {
  const ids = await postProxyJson(
    '/ai/goal-app-suggestions',
    {
      goals: goals.slice(0, 20).map((goal) => goal.slice(0, 200)),
      max,
      candidates: candidates.map((app) => ({
        id: app.id,
        name: app.name,
        keywords: app.keywords.slice(0, 20),
      })),
    },
    (data) => {
      if (!data || typeof data !== 'object') return [];
      return readStringArray((data as { ids?: unknown }).ids, max, 80);
    },
  );
  const byId = new Map(candidates.map((app) => [app.id, app]));
  return ids.map((id) => byId.get(id)).filter(Boolean).slice(0, max) as ProductiveApp[];
}

export async function suggestGoalApps(goals: string[], max = 5): Promise<ProductiveApp[]> {
  const installed = await getInstalledApps().catch(() => []);
  const installedPackages = new Set(installed.map((app) => app.packageId));
  const local = localRank(goals, Math.max(max, 10), installedPackages);

  if (config.useOpenRouterInsights && goals.length) {
    try {
      const ranked = await openRouterRank(goals, local, max);
      if (ranked.length) return ranked;
    } catch (err) {
      console.warn('[goalAppSuggestions] OpenRouter failed, using local rank:', err);
    }
  }

  return local.slice(0, max);
}
