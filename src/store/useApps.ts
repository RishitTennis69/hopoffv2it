import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AppGroup } from './types';
import { persistStorage } from './storage';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface AppsState {
  /** App ids the user has selected to track. */
  selectedIds: string[];
  groups: AppGroup[];

  toggleSelect: (id: string) => void;
  setSelected: (ids: string[]) => void;
  createGroup: (name: string, appIds: string[], limitHours: number) => string;
  updateGroup: (id: string, patch: Partial<Omit<AppGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;
  /** App ids that are selected but not yet placed in any group. */
  ungroupedIds: () => string[];
  reset: () => void;
}

export const useApps = create<AppsState>()(
  persist(
    (set, get) => ({
      selectedIds: [],
      groups: [],

      toggleSelect: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      setSelected: (ids) => set({ selectedIds: ids }),
      createGroup: (name, appIds, limitHours) => {
        const id = uid();
        set((s) => ({
          groups: [...s.groups, { id, name, appIds, limitHours }],
          selectedIds: Array.from(new Set([...s.selectedIds, ...appIds])),
        }));
        return id;
      },
      updateGroup: (id, patch) =>
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),
      deleteGroup: (id) => set((s) => ({ groups: s.groups.filter((g) => g.id !== id) })),
      ungroupedIds: () => {
        const grouped = new Set(get().groups.flatMap((g) => g.appIds));
        return get().selectedIds.filter((id) => !grouped.has(id));
      },
      reset: () => set({ selectedIds: [], groups: [] }),
    }),
    {
      name: 'hopoff.apps',
      storage: persistStorage,
      partialize: (s) => ({ selectedIds: s.selectedIds, groups: s.groups }),
    },
  ),
);
