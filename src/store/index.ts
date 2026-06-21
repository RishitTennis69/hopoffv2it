import { useApps } from './useApps';
import { useGoals } from './useGoals';
import { useOnboarding } from './useOnboarding';
import { useSubscription } from './useSubscription';
import { useUsage } from './useUsage';
import { useVideos } from './useVideos';

export * from './types';
export { useOnboarding, DEFAULT_PRIORITIES, TRIGGER_OPTIONS } from './useOnboarding';
export { useApps } from './useApps';
export { useGoals } from './useGoals';
export { useVideos } from './useVideos';
export { useUsage } from './useUsage';
export { useSubscription } from './useSubscription';

/** Wipes all persisted state — used by the dev "Log out" / replay onboarding. */
export function resetAllStores() {
  useOnboarding.getState().reset();
  useApps.getState().reset();
  useGoals.getState().reset();
  useVideos.getState().reset();
  useUsage.getState().reset();
  useSubscription.getState().reset();
}
