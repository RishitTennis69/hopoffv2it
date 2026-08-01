import { getApp } from '@/data/apps';
import { syncMonitorGroups, type AppLimit } from '../../modules/hopoff-monitor/src';
import type { AppGroup } from '@/store/types';
import { useApps } from '@/store';

/** Push group limits to the native accessibility monitor (Android only). */
export async function syncNativeMonitor(groups: AppGroup[]): Promise<void> {
  const { lockInUntil, lockInSchedules, lockInGroupIds, lockInGroupIdsConfigured } = useApps.getState();
  const selectedLockInGroups = new Set(lockInGroupIds);
  const lockInAppliesToGroup = (groupId: string) =>
    !lockInGroupIdsConfigured || selectedLockInGroups.has(groupId);
  const lockInWindows = lockInSchedules
    .filter((schedule) => schedule.enabled)
    .map(({ id, label, startMinute, endMinute }) => ({ id, label, startMinute, endMinute }));

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
        if (g.sessionCount && g.sessionCount > 1) {
          entry.sessionLimitMinutes =
            g.sessionLimitMinutes ?? Math.max(1, Math.round((g.limitHours * 60) / g.sessionCount));
        }
        if (lockInAppliesToGroup(g.id)) {
          if (lockInUntil && lockInUntil > Date.now()) entry.lockInUntil = lockInUntil;
          if (lockInWindows.length > 0) entry.lockInWindows = lockInWindows;
        }
        if (app.blockMode) entry.blockMode = app.blockMode;
        return entry;
      })
      .filter(Boolean),
  ) as AppLimit[];

  await syncMonitorGroups(limits);
}
