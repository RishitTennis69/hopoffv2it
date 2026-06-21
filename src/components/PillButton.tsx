import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, radius, type } from '@/theme';
import { Txt } from './Txt';

type Variant = 'primary' | 'dark' | 'ghost' | 'accent';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  /** Render children left of the label (e.g. an icon). */
  left?: React.ReactNode;
}

const FILL: Record<Variant, string> = {
  primary: colors.card,
  dark: colors.dark,
  ghost: 'transparent',
  accent: colors.accent,
};

const TEXT: Record<Variant, string> = {
  primary: colors.cardText,
  dark: colors.text,
  ghost: colors.textMuted,
  accent: colors.text,
};

// Full-width rounded capsule. Light haptic on meaningful taps.
export function PillButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  left,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        haptics.light();
        onPress?.();
      }}
      disabled={isDisabled}
      hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
      pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: FILL[variant],
          borderColor: variant === 'dark' ? colors.glassBorder : 'transparent',
          borderWidth: variant === 'dark' ? StyleSheet.hairlineWidth * 2 : 0,
        },
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={TEXT[variant]} />
      ) : (
        <View style={styles.content}>
          {left}
          <Txt style={[type.button, { color: TEXT[variant] }]}>{label}</Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ghost: {
    minHeight: 48,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.35,
  },
});
