import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalsEditor, ScreenTitle } from '@/components';
import { colors, spacing } from '@/theme';

export default function GoalsTab() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <ScreenTitle title="Work towards your biggest dreams" />
      <GoalsEditor minHeight={240} />
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
