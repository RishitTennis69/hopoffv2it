import {
  getUsageByApps,
  hasUsageAccess,
  openUsageAccessSettings,
} from 'react-native-app-usage-stats';
import { requireNativeModule } from 'expo-modules-core';
import * as IntentLauncher from 'expo-intent-launcher';

import { APP_CATALOG, getApp } from '@/data/apps';
import { PRODUCTIVE_APPS } from '@/data/productiveApps';
import { useApps } from '@/store';
import type { DayUsage, PermissionId, TrackedApp } from '@/store/types';
import {
  getPackageUsageHistory,
  isAccessibilityEnabled,
  openAccessibilitySettings,
  openUsageAccessSettings as openUsageAccessSettingsNative,
} from '../../modules/hopoff-monitor/src';

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

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type HopOffMonitorNative = {
  getInstalledPackages(packageIds: string[]): Promise<string[]>;
  getLaunchableApps?: () => Promise<{ name: string; packageId: string }[]>;
};

const MonitorNative = requireNativeModule<HopOffMonitorNative>('HopOffMonitor');

function catalogPackageIds(): string[] {
  return [
    ...APP_CATALOG.map((a) => a.packageId),
    ...PRODUCTIVE_APPS.map((a) => a.packageId),
    ...useApps.getState().customApps.map((a) => a.packageId),
  ];
}

export async function getInstalledPackageIds(packageIds: string[]): Promise<string[]> {
  if (!packageIds.length) return [];
  try {
    return await MonitorNative.getInstalledPackages(packageIds);
  } catch {
    return [];
  }
}

/** Parent / standalone catalog ids (excludes feed children like Shorts/Reels). */
function defaultTrackedIds(): string[] {
  return APP_CATALOG.filter((a) => !a.parentAppId).map((a) => a.id);
}

function trackedAppsForPackage(packageId: string, appIds: string[]): TrackedApp[] {
  const apps = [...APP_CATALOG, ...useApps.getState().customApps];
  return apps.filter((a) => a.packageId === packageId && appIds.includes(a.id));
}

async function fetchUsageRecords(
  pool: string[],
  days: number,
): Promise<{ date: string; trackId: string; minutes: number }[]> {
  try {
    const rows = await getPackageUsageHistory(pool, days);
    const totalMin = rows.reduce((sum, row) => sum + row.minutes, 0);
    if (__DEV__) {
      console.log(`[HopOff] getPackageUsageHistory: ${rows.length} rows, ${totalMin} pkg-min`);
    }
    if (rows.length > 0) return rows;
  } catch (err) {
    if (__DEV__) {
      console.warn('[HopOff] getPackageUsageHistory failed, falling back:', err);
    }
  }

  try {
    const legacy = await getUsageByApps(pool, days);
    const mapped = legacy.map((row) => ({
      date: row.date,
      trackId: row.trackId,
      minutes: Math.round(row.usage / 60),
    }));
    if (__DEV__) {
      const totalMin = mapped.reduce((sum, row) => sum + row.minutes, 0);
      console.log(`[HopOff] getUsageByApps fallback: ${mapped.length} rows, ${totalMin} pkg-min`);
    }
    return mapped;
  } catch (err) {
    if (__DEV__) {
      console.warn('[HopOff] getUsageByApps failed:', err);
    }
    return [];
  }
}

/** Last 5 weekdays of per-app usage (minutes) from UsageStatsManager. */
export async function getWeekUsage(appIds: string[]): Promise<DayUsage[]> {
  const granted = await hasUsageAccess();
  if (!granted) {
    if (__DEV__) {
      console.warn('[HopOff] getWeekUsage: Usage Access not granted — toggle HopOff off/on in Settings');
    }
    return [];
  }

  const trackedIds = appIds.length ? appIds : defaultTrackedIds();

  const pool = [
    ...new Set(trackedIds.map((id) => getApp(id)?.packageId).filter(Boolean) as string[]),
  ];
  if (!pool.length) return [];

  const records = await fetchUsageRecords(pool, 14);
  if (!records.length) {
    if (__DEV__) {
      console.warn('[HopOff] getWeekUsage: no usage records returned for pool', pool);
    }
    return [];
  }

  const sortedDates = [...new Set(records.map((r) => r.date))].sort();
  const lastFourteen = sortedDates.slice(-14);

  const pkgTotals = new Map<string, Record<string, number>>();
  for (const row of records) {
    const dayPkgs = pkgTotals.get(row.date) ?? {};
    dayPkgs[row.trackId] = (dayPkgs[row.trackId] ?? 0) + row.minutes;
    pkgTotals.set(row.date, dayPkgs);
  }

  return lastFourteen.map((dateStr) => {
    const byApp: Record<string, number> = {};
    const pkgs = pkgTotals.get(dateStr) ?? {};

    for (const [packageId, totalMinutes] of Object.entries(pkgs)) {
      const tracked = trackedAppsForPackage(packageId, trackedIds);
      if (tracked.length >= 1) {
        byApp[tracked[0].id] = totalMinutes;
      }
    }

    const d = new Date(`${dateStr}T12:00:00`);
    return {
      label: WEEKDAY_LABELS[d.getDay()],
      byApp,
    };
  });
}

export async function getAllScreenUsage(days = 5): Promise<DayUsage[]> {
  const granted = await hasUsageAccess();
  if (!granted) return [];

  const records = await fetchUsageRecords([], days);
  if (!records.length) return [];

  const sortedDates = [...new Set(records.map((r) => r.date))].sort();
  const recentDates = sortedDates.slice(-days);
  const totals = new Map<string, Record<string, number>>();

  for (const row of records) {
    const day = totals.get(row.date) ?? {};
    day[row.trackId] = (day[row.trackId] ?? 0) + row.minutes;
    totals.set(row.date, day);
  }

  return recentDates.map((dateStr) => {
    const d = new Date(`${dateStr}T12:00:00`);
    return {
      label: WEEKDAY_LABELS[d.getDay()],
      byApp: totals.get(dateStr) ?? {},
    };
  });
}

/** Apps from the HopOff catalog that are actually installed on this device. */
export async function getInstalledApps(): Promise<TrackedApp[]> {
  const customApps = useApps.getState().customApps;
  try {
    const installed = await getInstalledPackageIds(catalogPackageIds());
    const set = new Set(installed);
    const productiveAsTracked = PRODUCTIVE_APPS.map((app) => ({
      id: `custom:${app.packageId}`,
      name: app.name,
      packageId: app.packageId,
      brand: 'generic' as const,
    }));
    const known = [...APP_CATALOG, ...productiveAsTracked, ...customApps].filter((a) => set.has(a.packageId));
    const nativeLaunchable = MonitorNative.getLaunchableApps
      ? await MonitorNative.getLaunchableApps().catch(() => [])
      : [];
    const existingPackages = new Set(known.map((app) => app.packageId));
    const discovered = nativeLaunchable
      .filter((app) => !existingPackages.has(app.packageId))
      .map((app) => ({
        id: `custom:${app.packageId}`,
        name: app.name,
        packageId: app.packageId,
        brand: 'generic' as const,
      }));
    return [...known, ...discovered].sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [...APP_CATALOG, ...customApps];
  }
}

export async function getPermissionStatus(id: PermissionId): Promise<boolean> {
  if (id === 'usage') return hasUsageAccess();
  if (id === 'accessibility') return isAccessibilityEnabled();
  if (id === 'microphone') return getMicrophonePermissionStatus();
  return false;
}

export async function openPermissionSettings(id: PermissionId): Promise<void> {
  if (id === 'usage') {
    try {
      await openUsageAccessSettingsNative();
      return;
    } catch {
      // Older dev builds without native deep link.
    }
    try {
      await openUsageAccessSettings();
      return;
    } catch {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS,
      );
    }
    return;
  }
  if (id === 'accessibility') {
    await openAccessibilitySettings();
    return;
  }
  if (id === 'microphone') {
    await openMicrophoneSettings();
  }
}

/** Re-read OS permission state (no optimistic mock). */
export async function confirmPermission(id: PermissionId): Promise<boolean> {
  return getPermissionStatus(id);
}

export async function openScreenTimeAppPicker() {
  return { applications: 0, categories: 0, webDomains: 0 };
}
