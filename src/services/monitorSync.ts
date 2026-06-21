import { getApp } from '@/data/apps';
import { syncMonitorGroups, type AppLimit } from 'hopoff-monitor';
import type { AppGroup } from '@/store/types';

/** Push group limits to the native accessibility monitor (Android only). */
export async function syncNativeMonitor(groups: AppGroup[]): Promise<void> {
  const limits = groups.flatMap((g) =>
    g.appIds
      .map((appId) => {
        const app = getApp(appId);
        if (!app?.packageId) return null;
        const entry: AppLimit = {
          appId,
          packageId: app.packageId,
          limitMinutes: Math.max(1, Math.round(g.limitHours * 60)),
        };
        if (app.blockMode) entry.blockMode = app.blockMode;
        return entry;
      })
      .filter(Boolean),
  ) as AppLimit[];

  await syncMonitorGroups(limits);
}
