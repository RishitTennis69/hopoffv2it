import { HOPOFF_API_BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export class ApiProxyError extends Error {
  constructor(message = 'Service unavailable') {
    super(message);
    this.name = 'ApiProxyError';
  }
}

function proxyUrl(path: string) {
  if (!HOPOFF_API_BASE_URL) throw new ApiProxyError();
  const base = new URL(HOPOFF_API_BASE_URL);
  if (base.protocol !== 'https:' && !__DEV__) throw new ApiProxyError();
  return new URL(path, base).toString();
}

async function getClientId() {
  const key = 'hopoff.proxyClientId';
  const existing = await AsyncStorage.getItem(key);
  if (existing) return existing;

  const generated = `hop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(key, generated);
  return generated;
}

async function proxyHeaders(extra?: HeadersInit) {
  const clientId = await getClientId().catch(() => 'hop_unknown');
  return {
    Accept: 'application/json',
    'X-HopOff-Client': clientId,
    'X-HopOff-Platform': 'expo',
    ...extra,
  };
}

export async function getProxyJson<T>(path: string, validate: (value: unknown) => T): Promise<T> {
  const res = await fetch(proxyUrl(path), {
    headers: await proxyHeaders(),
  });
  if (!res.ok) throw new ApiProxyError();
  return validate(await res.json());
}

export async function postProxyJson<T>(
  path: string,
  body: Record<string, JsonValue>,
  validate: (value: unknown) => T,
): Promise<T> {
  const res = await fetch(proxyUrl(path), {
    method: 'POST',
    headers: await proxyHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiProxyError();
  return validate(await res.json());
}

export function readString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

export function readStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readString(item, maxLength))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
}
