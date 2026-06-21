import 'react-native-gesture-handler';
import 'react-native-reanimated';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { BootScreen } from '@/components/BootScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ShareIntentBridge } from '@/components/ShareIntentBridge';
import { startMonitoring } from '@/services/blockMonitor';
import { colors } from '@/theme';

// Don't block the UI under the native splash — hide as soon as JS mounts.
SplashScreen.hideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  const [nativeReady, setNativeReady] = useState(false);

  useEffect(() => {
    console.log('[HopOff] root layout mounted');
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => setNativeReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!nativeReady) return;
    startMonitoring();
  }, [nativeReady]);

  const fontsReady = fontsLoaded || !!fontError;
  if (!nativeReady || !fontsReady) {
    return (
      <ErrorBoundary>
        <BootScreen label="Starting HopOff…" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <SafeAreaProvider>
          {nativeReady ? <ShareIntentBridge /> : null}
          <StatusBar style="light" />
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
              options={{ presentation: 'fullScreenModal', animation: 'fade' }}
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
