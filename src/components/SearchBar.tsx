import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, layout, radius, spacing } from '@/theme';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  compact?: boolean;
  hideAction?: boolean;
}

export function SearchBar({ value, onChangeText, onSubmit, onClear, placeholder, loading, compact, hideAction }: Props) {
  const hasText = value.length > 0;
  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder={placeholder ?? 'Search YouTube...'}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
      />
      {hideAction ? null : loading ? (
        <View style={styles.action}>
          <ActivityIndicator size="small" color={colors.textMuted} />
        </View>
      ) : hasText ? (
        <View style={styles.actions}>
          {onClear ? (
            <Pressable
              onPress={onClear}
              hitSlop={8}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Icon name="close" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onSubmit}
            hitSlop={8}
            style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel="Search now">
            <Icon name="arrowRight" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    minHeight: layout.minTapTarget + 4,
  },
  barCompact: {
    minHeight: layout.minTapTarget,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  action: {
    width: layout.minTapTarget,
    height: layout.minTapTarget,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionPressed: {
    backgroundColor: colors.pressFill,
    transform: [{ scale: 0.96 }],
  },
});
