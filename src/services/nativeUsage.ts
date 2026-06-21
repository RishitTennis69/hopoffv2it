import { Platform } from 'react-native';

import { APP_CATALOG } from '@/data/apps';
import type { DayUsage, PermissionId, TrackedApp } from '@/store/types';

import {
  PERMISSION_META,
  REQUIRED_PERMISSIONS,
  permissionSteps,
} from './nativeUsage.shared';

export { PERMISSION_META, REQUIRED_PERMISSIONS, permissionSteps };

// ---------------------------------------------------------------------------
// Mock implementation — used on iOS / web / Expo Go.
// Android dev builds use nativeUsage.android.ts instead (Metro resolves it).
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const permissionState: Record<PermissionId, boolean> = {
  usage: false,
  accessibility: false,
  screenTime: false,
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getInstalledApps(): Promise<TrackedApp[]> {
  await delay(250);
  const installed = new Set([
    'tiktok',
    'instagram',
    'youtube',
    'youtube_shorts',
    'reels',
    'snapchat',
    'reddit',
    'x',
  ]);
  return APP_CATALOG.filter((a) => installed.has(a.id));
}

export async function getWeekUsage(appIds: string[]): Promise<DayUsage[]> {
  await delay(300);
  const pool = appIds.length ? appIds : ['tiktok', 'instagram', 'youtube'];
  const dayWeights = [0.55, 0.7, 0.85, 0.95, 1];
  return WEEKDAYS.map((label, i) => {
    const byApp: Record<string, number> = {};
    pool.forEach((id, idx) => {
      const base = 18 + ((idx * 37 + i * 13) % 40);
      byApp[id] = Math.round(base * dayWeights[i]);
    });
    return { label, byApp };
  });
}

export async function getPermissionStatus(id: PermissionId): Promise<boolean> {
  return permissionState[id];
}

export async function openPermissionSettings(_id: PermissionId): Promise<void> {
  await delay(150);
}

export async function confirmPermission(id: PermissionId): Promise<boolean> {
  await delay(150);
  permissionState[id] = true;
  return true;
}

// Silence unused Platform import if tree-shaken oddly.
void Platform.OS;
