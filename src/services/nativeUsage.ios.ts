import { APP_CATALOG } from '@/data/apps';
import { useApps } from '@/store';
import type { DayUsage, PermissionId, TrackedApp } from '@/store/types';
import {
  getFamilyActivitySelectionSummary,
  getScreenTimeAuthorizationStatus,
  isScreenTimeAvailable,
  presentFamilyActivityPicker,
  requestScreenTimeAuthorization,
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

export async function getInstalledApps(): Promise<TrackedApp[]> {
  const summary = await getFamilyActivitySelectionSummary();
  const customApps = useApps.getState().customApps;

  if (summary.applications + summary.categories + summary.webDomains > 0) {
    return [
      {
        id: 'custom:ios-screen-time-selection',
        name: 'Screen Time selection',
        packageId: 'ios.screen-time.selection',
        brand: 'generic',
      },
      ...customApps,
    ];
  }

  return [...APP_CATALOG, ...customApps];
}

export async function getInstalledPackageIds(packageIds: string[]): Promise<string[]> {
  return packageIds;
}

export async function getWeekUsage(_appIds: string[]): Promise<DayUsage[]> {
  return [];
}

export async function getAllScreenUsage(_days = 5): Promise<DayUsage[]> {
  return [];
}

export async function getPermissionStatus(id: PermissionId): Promise<boolean> {
  if (id === 'screenTime') {
    return (await getScreenTimeAuthorizationStatus()) === 'approved';
  }
  if (id === 'microphone') return getMicrophonePermissionStatus();
  return false;
}

export async function openPermissionSettings(id: PermissionId): Promise<void> {
  if (id === 'screenTime') {
    if (!(await isScreenTimeAvailable())) return;
    const status = await getScreenTimeAuthorizationStatus();
    if (status !== 'approved') {
      await requestScreenTimeAuthorization();
    }
    return;
  }
  if (id === 'microphone') {
    await openMicrophoneSettings();
  }
}

export async function confirmPermission(id: PermissionId): Promise<boolean> {
  if (id === 'screenTime') {
    if (!(await isScreenTimeAvailable())) return false;
    const status = await getScreenTimeAuthorizationStatus();
    if (status === 'approved') return true;
    return (await requestScreenTimeAuthorization()) === 'approved';
  }
  return getPermissionStatus(id);
}

export async function openScreenTimeAppPicker() {
  return presentFamilyActivityPicker();
}
