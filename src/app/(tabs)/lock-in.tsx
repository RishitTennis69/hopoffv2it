import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LockInPanel, ScreenTitle } from '@/components';
import { colors, spacing } from '@/theme';

export default function LockInTab() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}>
      <ScreenTitle
        title="Let's get some sh*t done"
        subtitle="Set a timer. HopOff blocks your distracting groups until it runs out."
      />
      <LockInPanel />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    gap: spacing.xxl,
  },
});
