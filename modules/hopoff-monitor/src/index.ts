import { requireNativeModule, Platform } from 'expo-modules-core';

export type AppLimit = {
  appId: string;
  packageId: string;
  limitMinutes: number;
  sessionLimitMinutes?: number;
  lockInUntil?: number;
  lockInWindows?: { startMinute: number; endMinute: number; id?: string; label?: string }[];
  /** When set, only this in-app feed is limited (Shorts / Reels). */
  blockMode?: 'shorts' | 'reels';
};

export type PackageUsageRow = {
  date: string;
  trackId: string;
  minutes: number;
};

type HopOffMonitorNative = {
  openAccessibilitySettings(): Promise<void>;
  openUsageAccessSettings(): Promise<void>;
  isAccessibilityEnabled(): Promise<boolean>;
  hasUsageAccess(): Promise<boolean>;
  syncGroups(json: string): Promise<void>;
  getPackageUsageHistory(packageNames: string[], days: number): Promise<PackageUsageRow[]>;
  getLaunchableApps?: () => Promise<{ name: string; packageId: string }[]>;
  getFeatureUsageHistory(
    appIds: string[],
    dateKeys: string[],
  ): Promise<Record<string, Record<string, number>>>;
  launchPackage(packageId: string): Promise<boolean>;
  snoozeApp(appId: string, minutes: number): Promise<void>;
  isScreenTimeAvailable?: () => Promise<boolean>;
  getScreenTimeAuthorizationStatus?: () => Promise<ScreenTimeAuthorizationStatus>;
  requestScreenTimeAuthorization?: () => Promise<ScreenTimeAuthorizationStatus>;
  presentFamilyActivityPicker?: () => Promise<FamilyActivitySelectionSummary>;
  getFamilyActivitySelectionSummary?: () => Promise<FamilyActivitySelectionSummary>;
  startShieldingFamilyActivitySelection?: () => Promise<boolean>;
  stopShieldingFamilyActivitySelection?: () => Promise<void>;
};

const Native =
  Platform.OS === 'android' || Platform.OS === 'ios'
    ? requireNativeModule<HopOffMonitorNative>('HopOffMonitor')
    : null;

export type ScreenTimeAuthorizationStatus =
  | 'approved'
  | 'denied'
  | 'notDetermined'
  | 'unavailable'
  | 'unknown';

export type FamilyActivitySelectionSummary = {
  applications: number;
  categories: number;
  webDomains: number;
};

export async function openAccessibilitySettings(): Promise<void> {
  if (!Native) return;
  await Native.openAccessibilitySettings();
}

/** Opens Usage access — targets HopOff on supported Android builds. */
export async function openUsageAccessSettings(): Promise<void> {
  if (!Native) return;
  const open = Native.openUsageAccessSettings;
  if (typeof open === 'function') {
    await open();
  }
}

export async function isAccessibilityEnabled(): Promise<boolean> {
  if (!Native) return false;
  return Native.isAccessibilityEnabled();
}

/** Same AppOps check the native usage query uses (more reliable than third-party libs). */
export async function hasUsageAccess(): Promise<boolean> {
  if (!Native) return false;
  const check = Native.hasUsageAccess;
  if (typeof check !== 'function') return false;
  return check();
}

/** Push per-app limits to the native accessibility service. */
export async function syncMonitorGroups(limits: AppLimit[]): Promise<void> {
  if (!Native) return;
  await Native.syncGroups(JSON.stringify(limits));
}

/** Per-package daily minutes from UsageStatsManager (reliable on modern Android). */
export async function getPackageUsageHistory(
  packageNames: string[],
  days: number,
): Promise<PackageUsageRow[]> {
  if (!Native) return [];
  return Native.getPackageUsageHistory(packageNames, days);
}

/** Shorts / Reels minutes tracked by the accessibility service (per calendar day). */
export async function getFeatureUsageHistory(
  appIds: string[],
  dateKeys: string[],
): Promise<Record<string, Record<string, number>>> {
  if (!Native || !appIds.length || !dateKeys.length) return {};
  return Native.getFeatureUsageHistory(appIds, dateKeys);
}

/** Open a tracked app by package id (e.g. after "I'm gonna waste my life"). */
export async function launchLimitedApp(packageId: string): Promise<boolean> {
  if (!Native || !packageId) return false;
  const launch = Native.launchPackage;
  if (typeof launch !== 'function') return false;
  return launch(packageId);
}

/** Pause blocking for a tracked app for N minutes (after "waste my life"). */
export async function snoozeApp(appId: string, minutes: number): Promise<void> {
  if (!Native || !appId) return;
  const fn = Native.snoozeApp;
  if (typeof fn !== 'function') return;
  await fn(appId, minutes);
}

export async function isScreenTimeAvailable(): Promise<boolean> {
  if (!Native || typeof Native.isScreenTimeAvailable !== 'function') return false;
  return Native.isScreenTimeAvailable();
}

export async function getScreenTimeAuthorizationStatus(): Promise<ScreenTimeAuthorizationStatus> {
  if (!Native || typeof Native.getScreenTimeAuthorizationStatus !== 'function') {
    return 'unavailable';
  }
  return Native.getScreenTimeAuthorizationStatus();
}

export async function requestScreenTimeAuthorization(): Promise<ScreenTimeAuthorizationStatus> {
  if (!Native || typeof Native.requestScreenTimeAuthorization !== 'function') {
    return 'unavailable';
  }
  return Native.requestScreenTimeAuthorization();
}

export async function presentFamilyActivityPicker(): Promise<FamilyActivitySelectionSummary> {
  if (!Native || typeof Native.presentFamilyActivityPicker !== 'function') {
    return { applications: 0, categories: 0, webDomains: 0 };
  }
  return Native.presentFamilyActivityPicker();
}

export async function getFamilyActivitySelectionSummary(): Promise<FamilyActivitySelectionSummary> {
  if (!Native || typeof Native.getFamilyActivitySelectionSummary !== 'function') {
    return { applications: 0, categories: 0, webDomains: 0 };
  }
  return Native.getFamilyActivitySelectionSummary();
}

export async function startShieldingFamilyActivitySelection(): Promise<boolean> {
  if (!Native || typeof Native.startShieldingFamilyActivitySelection !== 'function') {
    return false;
  }
  return Native.startShieldingFamilyActivitySelection();
}

export async function stopShieldingFamilyActivitySelection(): Promise<void> {
  if (!Native || typeof Native.stopShieldingFamilyActivitySelection !== 'function') {
    return;
  }
  await Native.stopShieldingFamilyActivitySelection();
}
