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

const VALID_TRIGGER_IDS = new Set<string>(TRIGGER_OPTIONS.map((o) => o.id));

function sanitizeTriggers(triggers: string[]): string[] {
  return triggers.filter((id) => VALID_TRIGGER_IDS.has(id));
}

interface OnboardingState {
  hydrated: boolean;
  completed: boolean;
  triggers: string[];
  dailyHours: number;
  guessedScreenTimeMinutes: number | null;
  actualScreenTimeMinutes: number | null;
  preferredSessionCount: number;
  priorities: string[];
  /** True once the user has reordered priorities away from default. */
  prioritiesTouched: boolean;

  toggleTrigger: (id: string) => void;
  setDailyHours: (h: number) => void;
  setGuessedScreenTimeMinutes: (minutes: number | null) => void;
  setActualScreenTimeMinutes: (minutes: number | null) => void;
  setPreferredSessionCount: (count: number) => void;
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
      guessedScreenTimeMinutes: null,
      actualScreenTimeMinutes: null,
      preferredSessionCount: 3,
      priorities: DEFAULT_PRIORITIES,
      prioritiesTouched: false,

      toggleTrigger: (id) =>
        set((s) => {
          const current = sanitizeTriggers(s.triggers);
          return {
            triggers: current.includes(id)
              ? current.filter((t) => t !== id)
              : [...current, id],
          };
        }),
      setDailyHours: (h) => set({ dailyHours: h }),
      setGuessedScreenTimeMinutes: (minutes) => set({ guessedScreenTimeMinutes: minutes }),
      setActualScreenTimeMinutes: (minutes) => set({ actualScreenTimeMinutes: minutes }),
      setPreferredSessionCount: (count) => set({ preferredSessionCount: count }),
      setPriorities: (p, touched = true) => set({ priorities: p, prioritiesTouched: touched }),
      complete: () => set({ completed: true }),
      reset: () =>
        set({
          completed: false,
          triggers: [],
          dailyHours: 2,
          guessedScreenTimeMinutes: null,
          actualScreenTimeMinutes: null,
          preferredSessionCount: 3,
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
        guessedScreenTimeMinutes: s.guessedScreenTimeMinutes,
        actualScreenTimeMinutes: s.actualScreenTimeMinutes,
        preferredSessionCount: s.preferredSessionCount,
        priorities: s.priorities,
        prioritiesTouched: s.prioritiesTouched,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.triggers = sanitizeTriggers(state.triggers);
        }
        useOnboarding.setState({ hydrated: true });
      },
    },
  ),
);
