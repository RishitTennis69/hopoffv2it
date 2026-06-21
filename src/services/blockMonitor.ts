import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { useApps } from '@/store';

import { syncNativeMonitor } from './monitorSync';

function parseBlockAppId(url: string): string | null {
  const parsed = Linking.parse(url);
  if (parsed.path === 'block' || parsed.hostname === 'block') {
    return (parsed.queryParams?.appId as string) ?? null;
  }
  return null;
}

export function triggerBlock(appId: string) {
  router.push({ pathname: '/block', params: { appId } });
}

export function startMonitoring() {
  const groups = useApps.getState().groups;
  syncNativeMonitor(groups).catch(() => {});

  void Linking.getInitialURL().then((url) => {
    if (!url) return;
    const appId = parseBlockAppId(url);
    if (appId) triggerBlock(appId);
  });

  Linking.addEventListener('url', ({ url }) => {
    const appId = parseBlockAppId(url);
    if (appId) triggerBlock(appId);
  });
}

export function stopMonitoring() {
  // Listener is process-lifetime; no-op for now.
}

/** Call whenever groups change in the UI. */
export function refreshMonitorConfig() {
  const groups = useApps.getState().groups;
  return syncNativeMonitor(groups);
}
