import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GlassCard, Icon, OnboardingShell, PillButton, ScreenTitle, Txt } from '@/components';
import type { IconName } from '@/components';
import { colors, spacing } from '@/theme';
import { useOnboarding, useSubscription } from '@/store';

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: 'block', label: 'Block any app, any time' },
  { icon: 'library', label: 'Your own motivation library' },
  { icon: 'insight', label: 'Weekly soft-spot insights' },
  { icon: 'coach', label: 'AI-powered goal coaching' },
  { icon: 'share', label: 'Save from TikTok & Instagram' },
];

export default function Paywall() {
  const complete = useOnboarding((s) => s.complete);
  const startTrial = useSubscription((s) => s.startTrial);

  const onStart = () => {
    startTrial();
    complete();
    router.replace('/(tabs)/progress');
  };

  return (
    <OnboardingShell
      stepIndex={7}
      onBack={() => router.back()}
      footer={<PillButton label="Start my free week" onPress={onStart} />}>
      <ScreenTitle
        title="7 days free — no card needed"
        subtitle="Everything below is included in your free week."
        center
      />

      <GlassCard style={styles.card}>
        <Txt variant="caption" color={colors.textMuted}>
          WHAT YOU GET
        </Txt>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.row}>
            <View style={styles.iconWrap}>
              <Icon name={f.icon} size={18} color={colors.text} />
            </View>
            <Txt variant="bodyStrong">{f.label}</Txt>
          </View>
        ))}
      </GlassCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.glassFill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
