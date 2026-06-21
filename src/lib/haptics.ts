import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Thin wrapper so haptics never throw on web and stay consistent.
function safe(fn: () => Promise<void> | void) {
  if (Platform.OS === 'web') return;
  try {
    void fn();
  } catch {
    // no-op
  }
}

export const haptics = {
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
