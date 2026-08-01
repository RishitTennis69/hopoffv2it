import { Platform } from 'react-native';

import { APP_CATALOG } from '@/data/apps';
import { PRODUCTIVE_APPS } from '@/data/productiveApps';
import { useApps } from '@/store';
import type { DayUsage, PermissionId, TrackedApp } from '@/store/types';

import {
  getMicrophonePermissionStatus,
  openMicrophoneSettings,
} from './speechRecognition';

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
  microphone: false,
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
    'snapchat',
    'reddit',
    'x',
  ]);
  const productiveAsTracked = PRODUCTIVE_APPS.slice(0, 8).map((app) => ({
    id: `custom:${app.packageId}`,
    name: app.name,
    packageId: app.packageId,
    brand: 'generic' as const,
  }));
  return [...APP_CATALOG.filter((a) => installed.has(a.id)), ...productiveAsTracked, ...useApps.getState().customApps];
}

export async function getInstalledPackageIds(packageIds: string[]): Promise<string[]> {
  await delay(100);
  return packageIds;
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

export async function getAllScreenUsage(days = 5): Promise<DayUsage[]> {
  await delay(300);
  const pool = ['tiktok', 'instagram', 'youtube', 'messages', 'safari', 'spotify', 'gmail'];
  return Array.from({ length: Math.min(days, 5) }, (_, i) => {
    const label = WEEKDAYS[Math.max(0, WEEKDAYS.length - Math.min(days, 5)) + i] ?? WEEKDAYS[i % WEEKDAYS.length];
    const byApp: Record<string, number> = {};
    pool.forEach((id, idx) => {
      byApp[id] = 12 + ((idx * 29 + i * 17) % 55);
    });
    return { label, byApp };
  });
}

export async function getPermissionStatus(id: PermissionId): Promise<boolean> {
  if (id === 'microphone') return getMicrophonePermissionStatus();
  return permissionState[id];
}

export async function openPermissionSettings(id: PermissionId): Promise<void> {
  if (id === 'microphone') {
    await openMicrophoneSettings();
    return;
  }
  await delay(150);
}

export async function confirmPermission(id: PermissionId): Promise<boolean> {
  await delay(150);
  permissionState[id] = true;
  return true;
}

export async function openScreenTimeAppPicker() {
  return { applications: 0, categories: 0, webDomains: 0 };
}

// Silence unused Platform import if tree-shaken oddly.
void Platform.OS;
