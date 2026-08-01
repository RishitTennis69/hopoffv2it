import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { colors } from '@/theme';
import { useOnboarding } from '@/store';

export default function Index() {
  const hydrated = useOnboarding((s) => s.hydrated);
  const completed = useOnboarding((s) => s.completed);

  useEffect(() => {
    console.log('[HopOff] index mounted');
    const timer = setTimeout(() => {
      if (!useOnboarding.getState().hydrated) {
        console.warn('[HopOff] hydration timeout');
        useOnboarding.setState({ hydrated: true });
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(completed ? '/(tabs)/progress' : '/onboarding/welcome');
  }, [hydrated, completed]);

  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
