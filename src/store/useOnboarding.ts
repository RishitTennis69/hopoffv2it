import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from './storage';

export const DEFAULT_PRIORITIES = [
  'Be more present',
  'Hit my goals',
  'Sleep better',
  'Build better habits',
];

export const TRIGGER_OPTIONS = [
  { id: 'morning', label: 'First thing in the morning', icon: 'sunrise' },
  { id: 'work', label: 'During work or class', icon: 'briefcase' },
  { id: 'night', label: 'In bed at night', icon: 'moon' },
  { id: 'bored', label: 'Whenever I get bored', icon: 'spark' },
] as const;

interface OnboardingState {
  hydrated: boolean;
  completed: boolean;
  triggers: string[];
  dailyHours: number;
  priorities: string[];
  /** True once the user has reordered priorities away from default. */
  prioritiesTouched: boolean;

  toggleTrigger: (id: string) => void;
  setDailyHours: (h: number) => void;
  setPriorities: (p: string[], touched?: boolean) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      hydrated: false,
      completed: false,
      triggers: [],
      dailyHours: 2,
      priorities: DEFAULT_PRIORITIES,
      prioritiesTouched: false,

      toggleTrigger: (id) =>
        set((s) => ({
          triggers: s.triggers.includes(id)
            ? s.triggers.filter((t) => t !== id)
            : [...s.triggers, id],
        })),
      setDailyHours: (h) => set({ dailyHours: h }),
      setPriorities: (p, touched = true) => set({ priorities: p, prioritiesTouched: touched }),
      complete: () => set({ completed: true }),
      reset: () =>
        set({
          completed: false,
          triggers: [],
          dailyHours: 2,
          priorities: DEFAULT_PRIORITIES,
          prioritiesTouched: false,
        }),
    }),
    {
      name: 'hopoff.onboarding',
      storage: persistStorage,
      partialize: (s) => ({
        completed: s.completed,
        triggers: s.triggers,
        dailyHours: s.dailyHours,
        priorities: s.priorities,
        prioritiesTouched: s.prioritiesTouched,
      }),
      onRehydrateStorage: () => () => {
        useOnboarding.setState({ hydrated: true });
      },
    },
  ),
);
