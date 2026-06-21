import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchBar({ value, onChangeText, onSubmit, onClear, placeholder, loading }: Props) {
  const hasText = value.length > 0;
  return (
    <View style={styles.bar}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        placeholder={placeholder ?? 'Search YouTube…'}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
      />
      {loading ? (
        <View style={styles.action}>
          <ActivityIndicator size="small" color={colors.textMuted} />
        </View>
      ) : hasText && onClear ? (
        <Pressable onPress={onClear} hitSlop={8} style={styles.action}>
          <Icon name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : (
        <Pressable onPress={onSubmit} hitSlop={8} style={styles.action}>
          <Icon name="arrowRight" size={18} color={colors.text} />
        </Pressable>
      )}
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
    height: 52,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.text,
  },
  action: {
    width: 28,
    alignItems: 'center',
  },
});
