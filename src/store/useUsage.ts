import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getWeekUsage } from '@/services/nativeUsage';
import type { DayUsage } from './types';
import { persistStorage } from './storage';

interface SoftSpot {
  appId: string;
  minutes: number;
}

interface UsageState {
  week: DayUsage[];
  selectedDayIndex: number;
  commits: number;
  wastes: number;
  reclaimedMinutes: number;
  lastCommitAt: number | null;

  syncFromDevice: (appIds: string[]) => Promise<void>;
  selectDay: (i: number) => void;
  recordCommit: (reclaimedMinutes: number) => void;
  recordWaste: () => void;

  // derived
  totalWastedHours: () => number;
  avgScreenTimeMinutes: () => number;
  commitRate: () => number;
  weekHours: () => number;
  softSpots: (dayIndex?: number) => SoftSpot[];
  reset: () => void;
}

export const useUsage = create<UsageState>()(
  persist(
    (set, get) => ({
      week: [],
      selectedDayIndex: 4,
      commits: 0,
      wastes: 0,
      reclaimedMinutes: 0,
      lastCommitAt: null,

      syncFromDevice: async (appIds) => {
        try {
          const week = await getWeekUsage(appIds);
          if (__DEV__) {
            const totalMin = week.reduce(
              (sum, d) => sum + Object.values(d.byApp).reduce((a, b) => a + b, 0),
              0,
            );
            console.log(
              `[HopOff] syncFromDevice: ${week.length} days, ${totalMin} tracked min, apps=${appIds.length || 'default'}`,
            );
          }
          set({ week, selectedDayIndex: Math.max(0, week.length - 1) });
        } catch (err) {
          if (__DEV__) {
            console.warn('[HopOff] syncFromDevice failed:', err);
          }
        }
      },
      selectDay: (i) => set({ selectedDayIndex: i }),
      recordCommit: (reclaimedMinutes) =>
        set((s) => ({
          commits: s.commits + 1,
          reclaimedMinutes: s.reclaimedMinutes + reclaimedMinutes,
          lastCommitAt: Date.now(),
        })),
      recordWaste: () => set((s) => ({ wastes: s.wastes + 1 })),

      totalWastedHours: () => {
        const total = get().week.reduce(
          (sum, d) => sum + Object.values(d.byApp).reduce((a, b) => a + b, 0),
          0,
        );
        return Math.round(total / 60);
      },
      avgScreenTimeMinutes: () => {
        const days = get().week;
        if (!days.length) return 0;
        const total = days.reduce(
          (sum, d) => sum + Object.values(d.byApp).reduce((a, b) => a + b, 0),
          0,
        );
        return Math.round(total / days.length);
      },
      commitRate: () => {
        const { commits, wastes } = get();
        const denom = commits + wastes;
        if (denom === 0) return 0;
        return Math.round((commits / denom) * 100);
      },
      weekHours: () => {
        const total = get().week.reduce(
          (sum, d) => sum + Object.values(d.byApp).reduce((a, b) => a + b, 0),
          0,
        );
        return total / 60;
      },
      softSpots: (dayIndex) => {
        const idx = dayIndex ?? get().selectedDayIndex;
        const day = get().week[idx];
        if (!day) return [];
        return Object.entries(day.byApp)
          .map(([appId, minutes]) => ({ appId, minutes }))
          .sort((a, b) => b.minutes - a.minutes);
      },
      reset: () =>
        set({
          week: [],
          selectedDayIndex: 4,
          commits: 0,
          wastes: 0,
          reclaimedMinutes: 0,
          lastCommitAt: null,
        }),
    }),
    {
      name: 'hopoff.usage',
      storage: persistStorage,
      partialize: (s) => ({
        week: s.week,
        commits: s.commits,
        wastes: s.wastes,
        reclaimedMinutes: s.reclaimedMinutes,
        lastCommitAt: s.lastCommitAt,
      }),
    },
  ),
);
