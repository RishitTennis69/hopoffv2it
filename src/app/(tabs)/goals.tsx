import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalsEditor, PillButton, Txt } from '@/components';
import { polishGoals } from '@/services/aiPolish';
import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { useGoals } from '@/store';

export default function GoalsTab() {
  const insets = useSafeAreaInsets();
  const text = useGoals((s) => s.text);
  const setText = useGoals((s) => s.setText);
  const [polishing, setPolishing] = useState(false);

  const hasText = text.trim().length > 0;

  const onPolish = async () => {
    setPolishing(true);
    const cleaned = await polishGoals(text);
    setText(cleaned);
    setPolishing(false);
    haptics.success();
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <Txt variant="title" center>
        Goals
      </Txt>
      <GoalsEditor minHeight={240} />
      {hasText ? (
        <PillButton
          label={polishing ? 'Polishing your list…' : 'Polish my list'}
          variant="dark"
          loading={polishing}
          onPress={onPolish}
        />
      ) : null}
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
