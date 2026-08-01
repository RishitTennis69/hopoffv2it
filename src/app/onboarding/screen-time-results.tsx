import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassCard, Icon, OnboardingShell, PillButton, ScreenTitle, Txt } from '@/components';
import { formatDailyScreenTime } from '@/lib/format';
import { getAllScreenUsage } from '@/services/nativeUsage';
import { colors, fonts, spacing } from '@/theme';
import { useOnboarding } from '@/store';

function compareGuess(guess: number, actual: number) {
  const diff = guess - actual;
  const abs = Math.abs(diff);
  if (abs <= 30) return null;
  if (diff > 0) return null;
  const amount = formatRoundedDifference(abs);
  return amount;
}

function formatRoundedDifference(minutes: number) {
  const anchors = [30, 45, 60, 90, 120, 180, 240, 300];
  const rounded = anchors.find((anchor) => Math.abs(minutes - anchor) <= 10) ?? Math.round(minutes / 15) * 15;
  if (rounded >= 60) {
    const hours = rounded / 60;
    return `${hours.toFixed(rounded % 60 === 0 ? 0 : 1)} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${rounded} minutes`;
}

export default function ScreenTimeResultsStep() {
  const guess = useOnboarding((s) => s.guessedScreenTimeMinutes) ?? 180;
  const setActualScreenTimeMinutes = useOnboarding((s) => s.setActualScreenTimeMinutes);
  const guessedFormatted = formatDailyScreenTime(guess);
  const [actualMinutes, setActualMinutes] = useState<number | null>(null);
  const [stage, setStage] = useState<'guess' | 'actual'>('guess');
  const crashY = useSharedValue(0);
  const crashScale = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    void getAllScreenUsage(5).then((week) => {
      if (cancelled || !week.length) return;
      const recentDays = week.slice(-5);
      const total = recentDays.reduce(
        (sum, day) => sum + Object.values(day.byApp).reduce((inner, minutes) => inner + minutes, 0),
        0,
      );
      const average = Math.round(total / recentDays.length);
      setActualMinutes(average);
      setActualScreenTimeMinutes(average);
    });
    return () => {
      cancelled = true;
    };
  }, [setActualScreenTimeMinutes]);

  useEffect(() => {
    if (actualMinutes == null) return;
    const timer = setTimeout(() => setStage('actual'), 1050);
    return () => clearTimeout(timer);
  }, [actualMinutes]);

  useEffect(() => {
    if (stage !== 'actual') return;
    crashY.value = -380;
    crashScale.value = 0.94;
    crashY.value = withSpring(0, { damping: 11, stiffness: 118, mass: 1.02, velocity: 28 });
    crashScale.value = withSpring(1, { damping: 14, stiffness: 210, mass: 0.72 });
  }, [crashScale, crashY, stage]);

  const crashStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: crashY.value }, { scale: crashScale.value }],
  }));

  const actualFormatted = actualMinutes == null ? null : formatDailyScreenTime(actualMinutes);
  const display = stage === 'actual' && actualFormatted ? actualFormatted : guessedFormatted;
  const label = stage === 'actual' ? 'REAL USAGE' : 'YOUR GUESS';
  const readyForContinue = actualMinutes != null && stage === 'actual';
  const weeklyHours = actualMinutes == null ? 0 : Math.round((actualMinutes * 7) / 60);
  const comparison = actualMinutes == null ? null : compareGuess(guess, actualMinutes);
  const overestimated = actualMinutes != null && guess - actualMinutes > 30;

  return (
    <OnboardingShell
      stepIndex={2}
      onBack={() => router.back()}
      footer={
        <PillButton
          label={readyForContinue ? 'Claim It Back' : 'Continue'}
          disabled={!readyForContinue}
          onPress={() => router.push('/onboarding/goals')}
        />
      }>
      <ScreenTitle
        title="Here's your real usage."
        subtitle="HopOff will use this to set smarter limits."
      />

      <GlassCard style={styles.compareCard}>
        <View style={styles.revealStage}>
          <Animated.View
            key={stage}
            entering={FadeIn.duration(120)}
            exiting={FadeOut.duration(140)}
            style={[styles.metric, stage === 'actual' && crashStyle]}>
            <Txt variant="caption" color={colors.textMuted}>
              {label}
            </Txt>
            <Txt
              style={styles.compareValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.64}>
              {display.value}
              <Txt style={styles.compareUnit}>
                {' '}
                {display.unit}
              </Txt>
            </Txt>
          </Animated.View>
        </View>
        {actualMinutes == null ? (
          <Txt variant="body" color={colors.textMuted} center>
            HopOff is reading your tracked usage locally.
          </Txt>
        ) : null}
      </GlassCard>
      {actualMinutes != null && stage === 'actual' ? (
        <Animated.View entering={FadeIn.duration(240)} style={styles.infoStack}>
          {comparison ? (
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Icon name="refresh" size={18} color={colors.text} />
              </View>
              <Txt style={styles.infoCopy}>
                You underestimated by <Txt style={styles.infoCopyStrong}>{comparison} per day.</Txt>
              </Txt>
            </GlassCard>
          ) : null}
          {weeklyHours > 0 ? (
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Icon name="insight" size={18} color={colors.text} />
              </View>
              <Txt style={styles.infoCopy}>
                {overestimated ? 'That\u2019s still a lot. ' : ''}
                {'That\u2019s '}
                <Txt style={styles.infoCopyStrong}>{`${weeklyHours} hours this week.`}</Txt>
              </Txt>
            </GlassCard>
          ) : null}
        </Animated.View>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  compareCard: {
    minHeight: 255,
    gap: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealStage: {
    alignSelf: 'stretch',
    minHeight: 205,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metric: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  compareValue: {
    fontFamily: fonts.displayBlack,
    fontSize: 104,
    lineHeight: 110,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    maxWidth: '100%',
    textAlign: 'center',
  },
  compareUnit: {
    fontFamily: fonts.displayBlack,
    fontSize: 30,
    lineHeight: 36,
    color: colors.text,
  },
  infoStack: {
    gap: spacing.md,
  },
  infoCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  infoCopy: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 17,
    lineHeight: 25,
    color: colors.textMuted,
  },
  infoCopyStrong: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text,
  },
});
