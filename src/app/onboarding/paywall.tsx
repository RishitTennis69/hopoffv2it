import { router } from 'expo-router';
import { useEffect } from 'react';

import { useOnboarding } from '@/store';

/** Legacy route — onboarding no longer stops here; send users to the app. */
export default function Paywall() {
  const completed = useOnboarding((s) => s.completed);

  useEffect(() => {
    router.replace(completed ? '/(tabs)/progress' : '/onboarding/calculating-score');
  }, [completed]);

  return null;
}
