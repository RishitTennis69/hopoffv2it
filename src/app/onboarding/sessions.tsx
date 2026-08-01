import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AnimatedChoice, GlassCard, OnboardingShell, PillButton, ScreenTitle, Txt } from '@/components';
import { colors, fonts, radius, spacing } from '@/theme';
import { useApps, useOnboarding } from '@/store';

function PartsButton({
  count,
  selected,
  onPress,
}: {
  count: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <AnimatedChoice
      selected={selected}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      containerStyle={styles.partsButtonContainer}
      style={[styles.partsButton, selected && styles.partsButtonActive]}>
      <Txt variant="bodyStrong" color={selected ? colors.text : colors.textMuted} center>
        {count} session{count === 1 ? '' : 's'}
      </Txt>
    </AnimatedChoice>
  );
}

export default function SessionsStep() {
  const preferredSessionCount = useOnboarding((s) => s.preferredSessionCount);
  const setPreferredSessionCount = useOnboarding((s) => s.setPreferredSessionCount);
  const groups = useApps((s) => s.groups);
  const updateGroup = useApps((s) => s.updateGroup);
  const primaryGroup = groups[0];
  const primaryLimitMinutes = Math.max(15, Math.round((primaryGroup?.limitHours ?? 1) * 60));
  const sessionOptions = sessionCountOptions(primaryLimitMinutes);
  const selectedSessionCount = sessionOptions.includes(preferredSessionCount)
    ? preferredSessionCount
    : sessionOptions[0];
  const sessionMinutes = roundSessionMinutes(primaryLimitMinutes, selectedSessionCount);
  const continueToPermissions = () => {
    groups.forEach((group) => {
      const totalMinutes = Math.max(5, Math.round(group.limitHours * 60));
      const options = sessionCountOptions(totalMinutes);
      const groupSessionCount = options.includes(selectedSessionCount)
        ? selectedSessionCount
        : options[0];
      updateGroup(group.id, {
        sessionCount: groupSessionCount,
        sessionLimitMinutes: roundSessionMinutes(totalMinutes, groupSessionCount),
      });
    });
    router.push('/onboarding/calculating-score');
  };

  return (
    <OnboardingShell
      stepIndex={7}
      onBack={() => router.back()}
      footer={<PillButton label="Continue" onPress={continueToPermissions} />}>
      <ScreenTitle
        title="Split your limit into sessions."
        subtitle={`Turn your ${formatLimitCopy(primaryLimitMinutes)} daily limit into reset-sized sessions.`}
      />

      <GlassCard style={styles.previewCard}>
        <View style={styles.limitSummary}>
          <Txt variant="caption" color={colors.textMuted}>
            DAILY LIMIT
          </Txt>
          <Txt style={styles.limitText}>{primaryLimitMinutes} min</Txt>
        </View>

        <View style={styles.partsRow}>
          {sessionOptions.map((count) => (
            <PartsButton
              key={count}
              count={count}
              selected={selectedSessionCount === count}
              onPress={() => setPreferredSessionCount(count)}
            />
          ))}
        </View>

        <View style={styles.windowStack}>
          {Array.from({ length: selectedSessionCount }).map((_, index) => (
            <View key={index} style={styles.sessionWindow}>
              <Txt variant="caption" color={colors.textMuted}>
                SESSION {index + 1}
              </Txt>
              <Txt style={styles.windowMinutes}>{sessionMinutes} min</Txt>
            </View>
          ))}
        </View>
      </GlassCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  limitSummary: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  limitText: {
    fontFamily: fonts.displayBlack,
    fontSize: 64,
    lineHeight: 70,
    color: colors.text,
  },
  partsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  partsButtonContainer: {
    flex: 1,
    minWidth: 0,
  },
  partsButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.glassFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  partsButtonActive: {
    backgroundColor: colors.glassFill,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  windowStack: {
    gap: spacing.sm,
  },
  sessionWindow: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  windowMinutes: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
  },
});

function roundSessionMinutes(totalMinutes: number, count: number) {
  return Math.round(totalMinutes / count);
}

function sessionCountOptions(totalMinutes: number) {
  const options = [1, 2, 3, 4].filter((count) => {
    const minutes = totalMinutes / count;
    return Number.isInteger(minutes) && minutes >= 15 && minutes <= 45 && minutes % 5 === 0;
  });
  return options.length ? options : [1];
}

function formatLimitCopy(minutes: number) {
  if (minutes < 60) return `${minutes}-minute`;
  const hours = minutes / 60;
  return `${hours.toFixed(minutes % 60 === 0 ? 0 : 1)}-hour`;
}
