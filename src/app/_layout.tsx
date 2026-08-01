import 'react-native-reanimated';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ShareIntentBridge } from '@/components/ShareIntentBridge';
import { startMonitoring } from '@/services/blockMonitor';
import { colors } from '@/theme';

// Don't block the UI under the native splash — hide as soon as JS mounts.
SplashScreen.hideAsync().catch(() => {});

export default function RootLayout() {
  const [fontTimeout, setFontTimeout] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  useEffect(() => {
    console.log('[HopOff] root layout mounted');
    SplashScreen.hideAsync().catch(() => {});
    startMonitoring();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[HopOff] font loading timeout');
      setFontTimeout(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = fontsLoaded || !!fontError || fontTimeout;
  if (!fontsReady) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.bg }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaProvider>
          <ShareIntentBridge />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="block"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
