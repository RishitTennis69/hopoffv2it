import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_TOTAL, jumpToStep } from '@/lib/onboardingSteps';
import { colors, spacing } from '@/theme';
import { Icon } from './Icon';
import { ProgressDots } from './ProgressDots';

interface Props {
  stepIndex: number;
  onBack: () => void;
  /** Custom jump handler; defaults to route-based jumping. */
  onJump?: (index: number) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}

// Shared onboarding chrome: progress dots + back chevron, content, footer pill.
export function OnboardingShell({
  stepIndex,
  onBack,
  onJump,
  footer,
  children,
  scroll = true,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.back}>
          <Icon name="back" size={26} color={colors.text} />
        </Pressable>
        <ProgressDots
          total={ONBOARDING_TOTAL}
          current={stepIndex}
          onJump={onJump ?? jumpToStep}
        />
      </View>

      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>{children}</View>
      )}

      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  back: {
    position: 'absolute',
    left: spacing.screenH,
    zIndex: 2,
  },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    zIndex: 2,
    elevation: 4,
  },
});
