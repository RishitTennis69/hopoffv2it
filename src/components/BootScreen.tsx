import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

/** Visible fallback while fonts / storage hydrate — uses system font so it shows before Inter loads. */
export function BootScreen({ label = 'Loading HopOff…' }: { label?: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>HopOff</Text>
      <ActivityIndicator color={colors.textMuted} style={styles.spinner} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: 8,
  },
});
