import { router } from 'expo-router';

export const ONBOARDING_TOTAL = 8;

// Maps a step-dot index to the onboarding flow.
export function jumpToStep(index: number) {
  const clamped = Math.min(Math.max(index, 0), ONBOARDING_TOTAL - 1);
  const map: Record<number, string> = {
    0: '/onboarding/screen-time',
    1: '/onboarding/permissions',
    2: '/onboarding/screen-time-results',
    3: '/onboarding/goals',
    4: '/onboarding/redirect',
    5: '/onboarding/videos',
    6: '/onboarding/apps',
    7: '/onboarding/sessions',
  };
  router.navigate(map[clamped] as never);
}
