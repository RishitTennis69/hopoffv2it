import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { GoalConnections } from './types';
import { persistStorage } from './storage';

interface GoalsState {
  text: string;
  connections: GoalConnections;
  setText: (text: string) => void;
  toggleConnection: (key: keyof GoalConnections) => void;
  /** Goals as a clean list of non-empty lines. */
  goalLines: () => string[];
  reset: () => void;
}

const EMPTY_CONNECTIONS: GoalConnections = {
  notion: false,
  reminders: false,
  notes: false,
  googleTasks: false,
};

export const useGoals = create<GoalsState>()(
  persist(
    (set, get) => ({
      text: '',
      connections: EMPTY_CONNECTIONS,
      setText: (text) => set({ text }),
      toggleConnection: (key) =>
        set((s) => ({ connections: { ...s.connections, [key]: !s.connections[key] } })),
      goalLines: () =>
        get()
          .text.split('\n')
          .map((l) => l.replace(/^[-•\s]+/, '').trim())
          .filter(Boolean),
      reset: () => set({ text: '', connections: EMPTY_CONNECTIONS }),
    }),
    {
      name: 'hopoff.goals',
      storage: persistStorage,
      partialize: (s) => ({ text: s.text, connections: s.connections }),
    },
  ),
);
