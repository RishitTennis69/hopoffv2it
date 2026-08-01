import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppGroup, LockInSchedule, LockInScheduleId, TrackedApp } from './types';
import { persistStorage } from './storage';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface AppsState {
  /** App ids the user has selected to track. */
  selectedIds: string[];
  customApps: TrackedApp[];
  groups: AppGroup[];
  lockInUntil: number | null;
  lockInSchedules: LockInSchedule[];
  lockInGroupIds: string[];
  lockInGroupIdsConfigured: boolean;

  toggleSelect: (id: string) => void;
  setSelected: (ids: string[]) => void;
  addCustomApp: (app: Pick<TrackedApp, 'name' | 'packageId'>) => string;
  createGroup: (
    name: string,
    appIds: string[],
    limitHours: number,
    sessionCount?: number,
    sessionLimitMinutes?: number,
  ) => string;
  updateGroup: (id: string, patch: Partial<Omit<AppGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;
  startLockIn: (minutes: number) => void;
  stopLockIn: () => void;
  setLockInGroupIds: (ids: string[]) => void;
  toggleLockInSchedule: (id: LockInScheduleId) => void;
  updateLockInSchedule: (
    id: LockInScheduleId,
    patch: Partial<Pick<LockInSchedule, 'startMinute' | 'endMinute' | 'enabled' | 'repeat'>>,
  ) => void;
  /** App ids that are selected but not yet placed in any group. */
  ungroupedIds: () => string[];
  reset: () => void;
}

const DEFAULT_LOCK_IN_SCHEDULES: LockInSchedule[] = [
  { id: 'morning', label: 'Morning', startMinute: 7 * 60 + 30, endMinute: 8 * 60 + 30, enabled: false, repeat: 'daily' },
  { id: 'night', label: 'Night', startMinute: 22 * 60, endMinute: 6 * 60, enabled: false, repeat: 'daily' },
  { id: 'custom', label: 'Custom', startMinute: 9 * 60, endMinute: 17 * 60, enabled: false, repeat: 'daily' },
];

function normalizeLockInSchedules(schedules: LockInSchedule[]): LockInSchedule[] {
  return schedules.map((schedule) => {
    if (schedule.id === 'morning') {
      const isOldDefault =
        schedule.startMinute === 7 * 60 + 30 &&
        schedule.endMinute === 8 * 60 + 30 &&
        schedule.repeat === 'weekdays';
      return isOldDefault ? { ...schedule, repeat: 'daily' as const } : schedule;
    }
    if (schedule.id === 'night') {
      const isOldDefault = schedule.startMinute === 22 * 60 && schedule.endMinute === 23 * 60;
      return isOldDefault ? { ...schedule, endMinute: 6 * 60 } : schedule;
    }
    if (schedule.id === 'custom') {
      const isOldDefault = schedule.startMinute === 16 * 60 && schedule.endMinute === 17 * 60;
      return isOldDefault ? { ...schedule, startMinute: 9 * 60, endMinute: 17 * 60 } : schedule;
    }
    return schedule;
  });
}

export const useApps = create<AppsState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      customApps: [],
      groups: [],
      lockInUntil: null,
      lockInSchedules: DEFAULT_LOCK_IN_SCHEDULES,
      lockInGroupIds: [],
      lockInGroupIdsConfigured: false,

      toggleSelect: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      setSelected: (ids) => set({ selectedIds: ids }),
      addCustomApp: (app) => {
        const packageId = app.packageId.trim();
        const existing = get().customApps.find((candidate) => candidate.packageId === packageId);
        if (existing) {
          set((s) => ({ selectedIds: Array.from(new Set([...s.selectedIds, existing.id])) }));
          return existing.id;
        }
        const id = `custom:${packageId}`;
        const customApp: TrackedApp = {
          id,
          name: app.name.trim() || packageId,
          packageId,
          brand: 'generic',
        };
        set((s) => ({
          customApps: [...s.customApps, customApp],
          selectedIds: Array.from(new Set([...s.selectedIds, id])),
        }));
        return id;
      },
      createGroup: (name, appIds, limitHours, sessionCount, sessionLimitMinutes) => {
        const id = uid();
        set((s) => ({
          groups: [...s.groups, { id, name, appIds, limitHours, sessionCount, sessionLimitMinutes }],
          selectedIds: Array.from(new Set([...s.selectedIds, ...appIds])),
        }));
        return id;
      },
      updateGroup: (id, patch) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGroup: (id) =>
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          lockInGroupIds: s.lockInGroupIds.filter((groupId) => groupId !== id),
        })),
      startLockIn: (minutes) =>
        set({ lockInUntil: Date.now() + Math.max(1, minutes) * 60_000 }),
      stopLockIn: () => set({ lockInUntil: null }),
      setLockInGroupIds: (ids) => set({ lockInGroupIds: ids, lockInGroupIdsConfigured: true }),
      toggleLockInSchedule: (id) =>
        set((s) => ({
          lockInSchedules: (
            s.lockInSchedules.some((schedule) => schedule.id === id)
              ? s.lockInSchedules
              : [
                  ...s.lockInSchedules,
                  DEFAULT_LOCK_IN_SCHEDULES.find((schedule) => schedule.id === id) ??
                    DEFAULT_LOCK_IN_SCHEDULES[0],
                ]
          ).map((schedule) =>
            schedule.id === id ? { ...schedule, enabled: !schedule.enabled } : schedule,
          ),
        })),
      updateLockInSchedule: (id, patch) =>
        set((s) => ({
          lockInSchedules: (
            s.lockInSchedules.some((schedule) => schedule.id === id)
              ? s.lockInSchedules
              : [
                  ...s.lockInSchedules,
                  DEFAULT_LOCK_IN_SCHEDULES.find((schedule) => schedule.id === id) ??
                    DEFAULT_LOCK_IN_SCHEDULES[0],
                ]
          ).map((schedule) => (schedule.id === id ? { ...schedule, ...patch } : schedule)),
        })),
      ungroupedIds: () => {
        const grouped = new Set(get().groups.flatMap((g) => g.appIds));
        return get().selectedIds.filter((id) => !grouped.has(id));
      },
      reset: () =>
        set({
          selectedIds: [],
          customApps: [],
          groups: [],
          lockInUntil: null,
          lockInSchedules: DEFAULT_LOCK_IN_SCHEDULES,
          lockInGroupIds: [],
          lockInGroupIdsConfigured: false,
        }),
    }),
    {
      name: 'hopoff.apps',
      storage: persistStorage,
      merge: (persisted, current) => {
        const saved = persisted as Partial<AppsState> | undefined;
        return {
          ...current,
          ...saved,
          lockInSchedules: normalizeLockInSchedules(saved?.lockInSchedules ?? current.lockInSchedules),
        };
      },
      partialize: (s) => ({
        selectedIds: s.selectedIds,
        customApps: s.customApps,
        groups: s.groups,
        lockInUntil: s.lockInUntil,
        lockInSchedules: normalizeLockInSchedules(s.lockInSchedules),
        lockInGroupIds: s.lockInGroupIds,
        lockInGroupIdsConfigured: s.lockInGroupIdsConfigured,
      }),
    },
  ),
);
