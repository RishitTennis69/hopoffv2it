import type { PropsWithChildren } from 'react';
import {
  Pressable,
  Platform,
  StyleSheet,
  type AccessibilityRole,
  type AccessibilityState,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const webFocusReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as ViewStyle) : null;

interface Props {
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  feedbackRadius?: number;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
}

export function AnimatedChoice({
  selected,
  disabled,
  onPress,
  style,
  containerStyle,
  feedbackRadius = radius.card,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  children,
}: PropsWithChildren<Props>) {
  const press = useSharedValue(1);
  const pressFeedback = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: withTiming(pressFeedback.value, { duration: 90 }),
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (disabled) return;
        pressFeedback.set(1);
        press.set(withTiming(0.98, { duration: 80 }));
      }}
      onPressOut={() => {
        pressFeedback.set(0);
        press.set(withTiming(1, { duration: 90 }));
      }}
      onPress={() => {
        if (disabled) return;
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      style={[webFocusReset, containerStyle]}>
      <Animated.View style={[animatedStyle, style]}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.feedback, { borderRadius: feedbackRadius }, feedbackStyle]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  feedback: {
    backgroundColor: colors.pressFill,
  },
});
