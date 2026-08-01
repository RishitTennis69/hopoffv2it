import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { useApps } from '@/store';

import { syncNativeMonitor } from './monitorSync';

type BlockParams = { appId: string; reason?: string; scheduleLabel?: string };

function parseBlockParams(url: string): BlockParams | null {
  const parsed = Linking.parse(url);
  if (parsed.path === 'block' || parsed.hostname === 'block') {
    const triggeredAt = Number(parsed.queryParams?.triggeredAt);
    if (Number.isFinite(triggeredAt) && Date.now() - triggeredAt > 2 * 60 * 1000) {
      return null;
    }
    const appId = (parsed.queryParams?.appId as string) ?? null;
    if (!appId) return null;
    return {
      appId,
      reason: typeof parsed.queryParams?.reason === 'string' ? parsed.queryParams.reason : undefined,
      scheduleLabel:
        typeof parsed.queryParams?.scheduleLabel === 'string' ? parsed.queryParams.scheduleLabel : undefined,
    };
  }
  return null;
}

let lastDeepLinkUrl = '';
let lastDeepLinkAt = 0;
let monitoringStarted = false;

function handleBlockDeepLink(url: string) {
  const params = parseBlockParams(url);
  if (!params) return;

  const now = Date.now();
  if (url === lastDeepLinkUrl && now - lastDeepLinkAt < 8000) return;
  lastDeepLinkUrl = url;
  lastDeepLinkAt = now;

  router.replace({ pathname: '/block', params });
}

export function triggerBlockPreview(appId: string) {
  if (!__DEV__) return;
  router.replace({ pathname: '/block', params: { appId } });
}

export function startMonitoring() {
  const sync = () => {
    const groups = useApps.getState().groups;
    syncNativeMonitor(groups).catch(() => {});
  };

  if (monitoringStarted) {
    sync();
    return;
  }
  monitoringStarted = true;

  sync();

  void Linking.getInitialURL().then((url) => {
    if (url) handleBlockDeepLink(url);
  });

  Linking.addEventListener('url', ({ url }) => {
    handleBlockDeepLink(url);
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') sync();
  });
}

export function stopMonitoring() {
  // Listener is process-lifetime; no-op for now.
}

export function refreshMonitorConfig() {
  const groups = useApps.getState().groups;
  return syncNativeMonitor(groups);
}
