import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionManager, PillButton, ScreenTitle, type SelectionFooter } from '@/components';
import { colors, spacing } from '@/theme';
import { useVideos } from '@/store';

export default function VideosTab() {
  const insets = useSafeAreaInsets();
  const [selectionFooter, setSelectionFooter] = useState<SelectionFooter | null>(null);
  const hydrateMetadata = useVideos((s) => s.hydrateMetadata);

  useEffect(() => {
    hydrateMetadata().catch(() => {});
  }, [hydrateMetadata]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: selectionFooter ? insets.bottom + spacing.xxxl + 92 : spacing.xxxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ScreenTitle title="Unlock your motivation" subtitle="Search or import short reset clips for future blocks." />
        <CollectionManager
          searchLabel="Add your own videos"
          onSelectionFooterChange={setSelectionFooter}
        />
      </ScrollView>

      {selectionFooter ? (
        <View style={[styles.addBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <PillButton
            label={`Add ${selectionFooter.count} video${selectionFooter.count > 1 ? 's' : ''}`}
            onPress={selectionFooter.onAdd}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenH,
    gap: spacing.xxl,
  },
  addBar: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.glassBorder,
  },
});
