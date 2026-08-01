import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ONBOARDING_TOTAL, jumpToStep } from '@/lib/onboardingSteps';
import { colors, layout, spacing } from '@/theme';
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
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing.sm }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={({ pressed }) => [styles.back, pressed && styles.backPressed]}>
          <Icon name="back" size={30} color={colors.text} />
        </Pressable>
        <ProgressDots
          total={ONBOARDING_TOTAL}
          current={stepIndex}
          onJump={onJump ?? jumpToStep}
        />
      </View>

      {scroll ? (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View>
          ) : null}
        </>
      ) : (
        <>
          <View style={[styles.flex, styles.content]}>{children}</View>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View>
          ) : null}
        </>
      )}
    </KeyboardAvoidingView>
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
    marginBottom: spacing.xl,
  },
  back: {
    position: 'absolute',
    left: spacing.screenH,
    zIndex: 2,
    width: layout.minTapTarget,
    height: layout.minTapTarget,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: colors.pressFill,
    transform: [{ scale: 0.96 }],
  },
  content: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.lg,
    gap: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    zIndex: 2,
    elevation: 4,
  },
});
