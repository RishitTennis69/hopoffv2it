import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlanId } from './types';
import { persistStorage } from './storage';

const TRIAL_DAYS = 7;

interface SubscriptionState {
  trialStartedAt?: number;
  plan?: PlanId;
  subscribed: boolean;

  startTrial: () => void;
  setPlan: (plan: PlanId) => void;
  restore: () => void;
  daysLeft: () => number;
  trialExpired: () => boolean;
  reset: () => void;
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      trialStartedAt: undefined,
      plan: undefined,
      subscribed: false,

      startTrial: () => set((s) => ({ trialStartedAt: s.trialStartedAt ?? Date.now() })),
      setPlan: (plan) => set({ plan, subscribed: true }),
      restore: () => set({ subscribed: true }),
      daysLeft: () => {
        const start = get().trialStartedAt;
        if (!start) return TRIAL_DAYS;
        const elapsed = (Date.now() - start) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
      },
      trialExpired: () => !get().subscribed && get().daysLeft() <= 0,
      reset: () => set({ trialStartedAt: undefined, plan: undefined, subscribed: false }),
    }),
    {
      name: 'hopoff.subscription',
      storage: persistStorage,
      partialize: (s) => ({
        trialStartedAt: s.trialStartedAt,
        plan: s.plan,
        subscribed: s.subscribed,
      }),
    },
  ),
);
