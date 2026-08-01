import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="questions" />
      <Stack.Screen name="apps" />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="redirect" />
      <Stack.Screen name="videos" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="calculating-score" options={{ animation: 'fade' }} />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
