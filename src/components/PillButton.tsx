import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, layout, type } from '@/theme';
import { Txt } from './Txt';

type Variant = 'primary' | 'dark' | 'ghost' | 'accent' | 'light';

interface Props {
  label: string;
  onPress?: () => void;
  onPressIn?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  left?: React.ReactNode;
}

const FILL: Record<Variant, string> = {
  primary: colors.dark,
  dark: colors.dark,
  ghost: 'transparent',
  accent: colors.accent,
  light: colors.white,
};

const TEXT: Record<Variant, string> = {
  primary: colors.white,
  dark: colors.white,
  ghost: colors.textMuted,
  accent: colors.white,
  light: colors.black,
};

const webFocusReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as ViewStyle) : null;

export function PillButton({
  label,
  onPress,
  onPressIn,
  variant = 'primary',
  disabled,
  loading,
  style,
  left,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      key={isDisabled ? 'pill-disabled' : 'pill-enabled'}
      onPressIn={onPressIn}
      onPress={() => {
        if (isDisabled) return;
        haptics.light();
        onPress?.();
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        webFocusReset,
        {
          backgroundColor: FILL[variant],
          borderColor: variant === 'dark' || variant === 'light' ? colors.glassBorder : 'transparent',
          borderWidth: variant === 'dark' || variant === 'light' ? StyleSheet.hairlineWidth * 2 : 0,
        },
        variant === 'ghost' && styles.ghost,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && variant === 'light' && styles.lightPressed,
        pressed && !isDisabled && variant === 'ghost' && styles.ghostPressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={TEXT[variant]} />
      ) : (
        <View style={styles.content} pointerEvents="none">
          {left}
          <Txt
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            style={[type.button, styles.label, { color: TEXT[variant] }]}>
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: layout.primaryTapTarget,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontFamily: type.button.fontFamily,
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  ghost: {
    minHeight: layout.primaryTapTarget,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  lightPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  ghostPressed: {
    backgroundColor: colors.pressFill,
  },
  disabled: {
    opacity: 0.35,
  },
});
