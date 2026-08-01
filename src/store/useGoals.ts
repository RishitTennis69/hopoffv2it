import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GoalAppTarget, GoalConnections } from './types';
import { persistStorage } from './storage';

interface GoalsState {
  text: string;
  selfMessage: string;
  goalApp: GoalAppTarget | null;
  connections: GoalConnections;
  lastGoalUpdatedAt: number | null;
  lastGoalPromptedAt: number | null;
  setText: (text: string) => void;
  setSelfMessage: (selfMessage: string) => void;
  setGoalApp: (goalApp: GoalAppTarget | null) => void;
  markGoalPromptShown: () => void;
  toggleConnection: (key: keyof GoalConnections) => void;
  /** Goals as a clean list of non-empty lines. */
  goalLines: () => string[];
  reset: () => void;
}

const EMPTY_CONNECTIONS: GoalConnections = {
  notion: false,
};

export const useGoals = create<GoalsState>()(
  persist(
    (set, get) => ({
      text: '',
      selfMessage: '',
      goalApp: null,
      connections: EMPTY_CONNECTIONS,
      lastGoalUpdatedAt: null,
      lastGoalPromptedAt: null,
      setText: (text) => set({ text, lastGoalUpdatedAt: text.trim() ? Date.now() : null }),
      setSelfMessage: (selfMessage) => set({ selfMessage }),
      setGoalApp: (goalApp) => set({ goalApp }),
      markGoalPromptShown: () => set({ lastGoalPromptedAt: Date.now() }),
      toggleConnection: (key) =>
        set((s) => ({ connections: { ...s.connections, [key]: !s.connections[key] } })),
      goalLines: () =>
        get()
          .text.split('\n')
          .map((l) => l.replace(/^[-•\s]+/, '').trim())
          .filter(Boolean),
      reset: () =>
        set({
          text: '',
          selfMessage: '',
          goalApp: null,
          connections: EMPTY_CONNECTIONS,
          lastGoalUpdatedAt: null,
          lastGoalPromptedAt: null,
        }),
    }),
    {
      name: 'hopoff.goals',
      storage: persistStorage,
      partialize: (s) => ({
        text: s.text,
        selfMessage: s.selfMessage,
        goalApp: s.goalApp,
        connections: s.connections,
        lastGoalUpdatedAt: s.lastGoalUpdatedAt,
        lastGoalPromptedAt: s.lastGoalPromptedAt,
      }),
    },
  ),
);
