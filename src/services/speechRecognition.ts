import { Linking, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/** True when the current dev/production build includes expo-speech-recognition. */
export function isSpeechRecognitionAvailable(): boolean {
  return requireOptionalNativeModule('ExpoSpeechRecognition') != null;
}

/** Check whether mic permission was granted (e.g. during goals voice capture). */
export async function getMicrophonePermissionStatus(): Promise<boolean> {
  if (!isSpeechRecognitionAvailable()) return true;
  try {
    const { ExpoSpeechRecognitionModule: mod } = await import('expo-speech-recognition');
    const result = await mod.getPermissionsAsync();
    return result.granted === true;
  } catch {
    return false;
  }
}

export async function openMicrophoneSettings(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
    return;
  }
  await Linking.openSettings();
}
