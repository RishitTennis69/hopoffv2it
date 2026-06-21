import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppsManager, Txt } from '@/components';
import { colors, spacing } from '@/theme';

export default function AppsTab() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Txt variant="title" center>
        Apps
      </Txt>
      <AppsManager />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
});
