import {
  getUsageByApps,
  hasUsageAccess,
  openUsageAccessSettings,
} from 'react-native-app-usage-stats';
import { requireNativeModule } from 'expo-modules-core';

import { APP_CATALOG, getApp } from '@/data/apps';
import type { DayUsage, PermissionId, TrackedApp } from '@/store/types';
import {
  isAccessibilityEnabled,
  openAccessibilitySettings,
} from 'hopoff-monitor';

import {
  PERMISSION_META,
  REQUIRED_PERMISSIONS,
  permissionSteps,
} from './nativeUsage.shared';

export { PERMISSION_META, REQUIRED_PERMISSIONS, permissionSteps };

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type HopOffMonitorNative = {
  getInstalledPackages(packageIds: string[]): Promise<string[]>;
};

const MonitorNative = requireNativeModule<HopOffMonitorNative>('HopOffMonitor');

function catalogPackageIds(): string[] {
  return APP_CATALOG.map((a) => a.packageId);
}

function appIdForPackage(packageId: string): string | undefined {
  return APP_CATALOG.find((a) => a.packageId === packageId)?.id;
}

/** Apps from the HopOff catalog that are actually installed on this device. */
export async function getInstalledApps(): Promise<TrackedApp[]> {
  try {
    const installed = await MonitorNative.getInstalledPackages(catalogPackageIds());
    const set = new Set(installed);
    return APP_CATALOG.filter((a) => set.has(a.packageId));
  } catch {
    return APP_CATALOG;
  }
}

/** Last 5 weekdays of per-app usage (minutes) from UsageStatsManager. */
export async function getWeekUsage(appIds: string[]): Promise<DayUsage[]> {
  const granted = await hasUsageAccess();
  if (!granted) return [];

  const pool = appIds.length
    ? appIds.map((id) => getApp(id)?.packageId).filter(Boolean) as string[]
    : catalogPackageIds();

  if (!pool.length) return [];

  const records = await getUsageByApps(pool, 7);
  const byDate = new Map<string, Record<string, number>>();

  for (const row of records) {
    const appId = appIdForPackage(row.trackId);
    if (!appId) continue;
    const day = byDate.get(row.date) ?? {};
    day[appId] = (day[appId] ?? 0) + Math.round(row.usage / 60);
    byDate.set(row.date, day);
  }

  const sortedDates = [...byDate.keys()].sort();
  const lastFive = sortedDates.slice(-5);

  return lastFive.map((dateStr) => {
    const d = new Date(`${dateStr}T12:00:00`);
    return {
      label: WEEKDAY_LABELS[d.getDay()],
      byApp: byDate.get(dateStr) ?? {},
    };
  });
}

export async function getPermissionStatus(id: PermissionId): Promise<boolean> {
  if (id === 'usage') return hasUsageAccess();
  if (id === 'accessibility') return isAccessibilityEnabled();
  return false;
}

export async function openPermissionSettings(id: PermissionId): Promise<void> {
  if (id === 'usage') {
    await openUsageAccessSettings();
    return;
  }
  if (id === 'accessibility') {
    await openAccessibilitySettings();
  }
}

/** Re-read OS permission state (no optimistic mock). */
export async function confirmPermission(id: PermissionId): Promise<boolean> {
  return getPermissionStatus(id);
}
