import AsyncStorage from '@react-native-async-storage/async-storage';

import { postProxyJson, readString } from './secureApi';

type AiReport = {
  id: string;
  source: string;
  content: string;
  reason: string;
  createdAt: string;
};

const QUEUE_KEY = 'hopoff.aiContentReports';

async function queuedReports(): Promise<AiReport[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is AiReport => Boolean(item?.id)) : [];
  } catch {
    return [];
  }
}

export async function reportAiContent(source: string, content: string, reason = 'offensive'): Promise<void> {
  const report: AiReport = {
    id: `air_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    source: source.slice(0, 80),
    content: content.slice(0, 1000),
    reason: reason.slice(0, 80),
    createdAt: new Date().toISOString(),
  };

  try {
    await postProxyJson('/ai/report-content', report, (data) => {
      if (!data || typeof data !== 'object') return undefined;
      return readString((data as { status?: unknown }).status, 40);
    });
    return;
  } catch {
    const next = [report, ...(await queuedReports())].slice(0, 20);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  }
}
