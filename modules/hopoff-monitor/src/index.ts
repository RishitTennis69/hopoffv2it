import { requireNativeModule, Platform } from 'expo-modules-core';

export type AppLimit = {
  appId: string;
  packageId: string;
  limitMinutes: number;
  /** When set, only this in-app feed is limited (Shorts / Reels). */
  blockMode?: 'shorts' | 'reels';
};

type HopOffMonitorNative = {
  openAccessibilitySettings(): Promise<void>;
  isAccessibilityEnabled(): Promise<boolean>;
  syncGroups(json: string): Promise<void>;
};

const Native =
  Platform.OS === 'android'
    ? requireNativeModule<HopOffMonitorNative>('HopOffMonitor')
    : null;

export async function openAccessibilitySettings(): Promise<void> {
  if (!Native) return;
  await Native.openAccessibilitySettings();
}

export async function isAccessibilityEnabled(): Promise<boolean> {
  if (!Native) return false;
  return Native.isAccessibilityEnabled();
}

/** Push per-app limits to the native accessibility service. */
export async function syncMonitorGroups(limits: AppLimit[]): Promise<void> {
  if (!Native) return;
  await Native.syncGroups(JSON.stringify(limits));
}
