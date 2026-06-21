import { router } from 'expo-router';

export const ONBOARDING_TOTAL = 8;

// Maps a step-dot index (0..7) to a destination. Questions occupy 0,1,2.
export function jumpToStep(index: number) {
  if (index <= 2) {
    router.navigate({ pathname: '/onboarding/questions', params: { q: String(index) } });
    return;
  }
  const map: Record<number, string> = {
    3: '/onboarding/apps',
    4: '/onboarding/goals',
    5: '/onboarding/videos',
    6: '/onboarding/permissions',
    7: '/onboarding/paywall',
  };
  router.navigate(map[index] as never);
}
