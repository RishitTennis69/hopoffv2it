import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppsManager, ScreenTitle } from '@/components';
import { colors, spacing } from '@/theme';

export default function AppsTab() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <ScreenTitle title="Block out the noise" subtitle="Search your apps, then group what HopOff should limit." />
      <AppsManager groupsFirst />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
});
